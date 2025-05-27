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