// controllers/orderController.js
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const nodemailer = require('nodemailer');
require('dotenv').config(); // make sure this is at the top of your entry file

const { v4: uuidv4 } = require('uuid');

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'localcarthelp.@gmail.com', // Use your email here
        pass: process.env.Google_Pass // Use app password if 2FA enabled
    }
});

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const { customerDetails, cartItems, paymentDetails } = req.body;

        // Normalize cart items
        const normalizedItems = cartItems.map(item => {
            const seller = item.seller;
            if (typeof seller === 'string' && seller.startsWith('[object')) {
                throw new Error(`Invalid seller format for product ${item.name}`);
            }
            const sellerId = typeof seller === 'object' ? seller._id || seller.id : seller;

            return {
                ...item,
                seller: sellerId
            };
        });

        // Create and save the order
        const newOrder = new Order({
            customerDetails,
            cartItems: normalizedItems,
            paymentDetails,
            status: 'processing'
        });

        const savedOrder = await newOrder.save();

        // Group items by vendor
        const vendorItemsMap = normalizedItems.reduce((map, item) => {
            if (!map[item.seller]) {
                map[item.seller] = [];
            }
            map[item.seller].push(item);
            return map;
        }, {});

        // Send email to each vendor
        await Promise.all(
            Object.entries(vendorItemsMap).map(async ([sellerId, items]) => {
                const vendor = await Vendor.findById(sellerId);
                if (vendor) {
                    await sendVendorEmail(vendor.email, {
                        orderId: savedOrder._id,
                        items,
                        customer: {
                            name: `${customerDetails.firstname} ${customerDetails.lastname}`
                        },
                        paymentMethod: paymentDetails.method
                    });
                } else {
                    console.warn(`Vendor with ID ${sellerId} not found.`);
                }
            })
        );

        res.status(201).json({
            success: true,
            orderId: savedOrder._id,
            message: 'Order placed and vendors notified.'
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create order'
        });
    }
};

// Helper function to send email
async function sendVendorEmail(to, { orderId, items, customer, paymentMethod }) {
    const itemRows = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>₹${item.price.toFixed(2)}</td>
      <td>₹${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('');

    const mailOptions = {
        from: `"Your Store" <${process.env.EMAIL_FROM}>`,
        to,
        subject: `New Order #${orderId}`,
        html: `
      <h2>New Order Notification</h2>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Customer:</strong> ${customer.name}</p>
      <p><strong>Payment Method:</strong> ${paymentMethod}</p>
      <h3>Order Items:</h3>
      <table border="1" cellpadding="5" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <p>Please prepare the items for shipping.</p>
    `
    };

    await transporter.sendMail(mailOptions);
}

exports.getVendorOrders = async (req, res) => {
    try {
        const vendorId = req.vendor._id; // from auth middleware
        console.log(vendorId)

        // Find all orders where any item is sold by this vendor
        const orders = await Order.find({ 'cartItems.seller': vendorId }).sort({ createdAt: -1 });
        console.log('Found orders:', orders.length); // Debug line
        console.log('First order cartItems:', orders[0]?.cartItems); // Debug line

        const vendorOrders = orders.map(order => {
            const relevantItems = order.cartItems.filter(item =>
                item.seller.toString() === vendorId.toString()
            );

            const subtotal = relevantItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );

            return {
                orderId: order._id,
                customer: `${order.customerDetails.firstname} ${order.customerDetails.lastname}`,
                date: order.createdAt,
                items: relevantItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.quantity * item.price,
                    status: order.status // Optionally make this per-item
                })),
                subtotal,
                shipping: 0, // static or calculated
                total: subtotal,
                paymentMethod: order.paymentDetails.method,
                paymentStatus: order.paymentDetails.status
            };
        });

        res.status(200).json(vendorOrders);
    } catch (error) {
        console.error('Error fetching vendor orders:', error);
        res.status(500).json({ message: 'Failed to fetch vendor orders' });
    }
};
