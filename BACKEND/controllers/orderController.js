// controllers/orderController.js
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose') // Ensure mongoose is imported
require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_FROM || 'localcarthelp.@gmail.com',
        pass: process.env.Google_Pass
    }
});

// Get all orders (for customers)
exports.getAllOrders = async (req, res) => {
    try {
        // If you have user authentication, filter by user ID
        // const userId = req.user._id; // from auth middleware
        // For now, getting all orders (you should add user filtering)
        const orders = await Order.find().sort({ createdAt: -1 });

        // Transform orders for frontend
        const transformedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order._id.toString(),
            status: order.status,
            createdAt: order.createdAt,
            customerName: `${order.customerDetails.firstname} ${order.customerDetails.lastname}`,
            customerEmail: order.customerDetails.email,
            totalAmount: order.totalAmount || order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            itemCount: order.cartItems.length,
            paymentMethod: order.paymentDetails.method,
            paymentStatus: order.paymentDetails.status
        }));

        res.status(200).json(transformedOrders);
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

// Get orders by customer email (if you don't have user auth)
exports.getOrdersByEmail = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const orders = await Order.find({ 'customerDetails.email': email }).sort({ createdAt: -1 });

        const transformedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order._id.toString(),
            status: order.status,
            createdAt: order.createdAt,
            totalAmount: order.totalAmount || order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            itemCount: order.cartItems.length,
            paymentMethod: order.paymentDetails.method,
            paymentStatus: order.paymentDetails.status
        }));

        res.status(200).json(transformedOrders);
    } catch (error) {
        console.error('Error fetching orders by email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const { customerDetails, cartItems, paymentDetails, shippingAddress } = req.body;

        // Validate required fields
        if (!customerDetails || !cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required order information'
            });
        }

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08; // 8% tax rate, adjust as needed
        const shippingCost = subtotal > 50 ? 0 : 10; // Free shipping over $50
        const discount = 0; // Add discount logic if needed
        const totalAmount = subtotal + tax + shippingCost - discount;

        // Normalize cart items
        const normalizedItems = cartItems.map(item => {
            let sellerId;
            // Handle cases where seller might be an object or a string
            if (typeof item.seller === 'object' && (item.seller._id || item.seller.id)) {
                sellerId = item.seller._id || item.seller.id;
            } else {
                sellerId = item.seller; // Assume it's already a string ID
            }

            // CRITICAL FIX: Explicitly convert sellerId to ObjectId if it's a valid string ID
            // This ensures it's saved as an ObjectId in MongoDB, matching the schema.
            const finalSellerId = mongoose.Types.ObjectId.isValid(sellerId)
                ? new mongoose.Types.ObjectId(sellerId)
                : sellerId; // If not a valid ObjectId string, keep as is (e.g., if it's null/undefined or an invalid format)

            return {
                ...item,
                seller: finalSellerId // Assign the converted ObjectId
            };
        });

        // Create and save the order
        const newOrder = new Order({
            customerDetails,
            cartItems: normalizedItems,
            paymentDetails,
            shippingAddress: shippingAddress || {
                street: customerDetails.address || '',
                city: customerDetails.city || '',
                state: customerDetails.state || '',
                zip: customerDetails.zip || '',
                country: customerDetails.country || 'India'
            },
            subtotal,
            tax,
            shippingCost,
            discount,
            totalAmount,
            status: 'processing'
        });

        const savedOrder = await newOrder.save();

        // Group items by vendor
        const vendorItemsMap = normalizedItems.reduce((map, item) => {
            // Ensure the key is a string for the map, as map keys are strings
            const key = item.seller.toString();
            if (!map[key]) {
                map[key] = [];
            }
            map[key].push(item);
            return map;
        }, {});

        // Send email to each vendor
        await Promise.all(
            Object.entries(vendorItemsMap).map(async ([sellerId, items]) => {
                try {
                    // Find vendor by ID (sellerId will be a string here from Object.entries)
                    const vendor = await Vendor.findById(sellerId);
                    if (vendor && vendor.email) {
                        await sendVendorEmail(vendor.email, {
                            orderId: savedOrder._id,
                            items,
                            customer: {
                                name: `${customerDetails.firstname} ${customerDetails.lastname}`
                            },
                            paymentMethod: paymentDetails.method
                        });
                    } else {
                        console.warn(`Vendor with ID ${sellerId} not found or missing email.`);
                    }
                } catch (emailError) {
                    console.error(`Failed to send email to vendor ${sellerId}:`, emailError);
                }
            })
        );

        res.status(201).json({
            success: true,
            orderId: savedOrder._id,
            message: 'Order placed successfully'
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
        from: `"LocalCart" <${process.env.EMAIL_FROM}>`,
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
        const vendorId = req.vendor._id; // This is a Mongoose ObjectId
        console.log('Querying for vendor ID (ObjectId):', vendorId); // Log the ObjectId type
        console.log('Querying for vendor ID (String):', vendorId.toString()); // Log the string type

        // Attempt 1: Query with ObjectId (for correctly saved new orders)
        let orders = await Order.find({ 'cartItems.seller': vendorId }).sort({ createdAt: -1 });

        // If no orders found with ObjectId, attempt 2: Query with string (for potentially older/inconsistent data)
        if (orders.length === 0) {
            console.log('No orders found with ObjectId query. Trying with string ID...');
            orders = await Order.find({ 'cartItems.seller': vendorId.toString() }).sort({ createdAt: -1 });
        }

        console.log('Found orders:', orders.length);
        if (orders.length > 0) {
            console.log('First order found (for debugging):', orders[0]);
            orders[0].cartItems.forEach((item, index) => {
                console.log(`  Item ${index} seller ID:`, item.seller, `(Type: ${typeof item.seller})`);
                if (item.seller && item.seller._id) {
                    console.log(`    Item ${index} seller ID (from object):`, item.seller._id);
                }
            });
        }


        const vendorOrders = orders.map(order => {
            const relevantItems = order.cartItems.filter(item =>
                // Ensure comparison is string-to-string for filtering, even if stored as ObjectId
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
                    status: order.status
                })),
                subtotal,
                shipping: order.shippingCost || 0,
                total: subtotal + (order.shippingCost || 0),
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

exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('Fetching order details for:', orderId);

        // Validate the ID format first
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Calculate totals if not stored
        const subtotal = order.subtotal || order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = order.tax || 0;
        const shippingCost = order.shippingCost || 0;
        const discount = order.discount || 0;
        const total = order.totalAmount || (subtotal + tax + shippingCost - discount);

        // Transform data for frontend
        const response = {
            orderNumber: order._id.toString(),
            createdAt: order.createdAt,
            status: order.status,
            items: order.cartItems.map(item => ({
                id: item._id || uuidv4(),
                name: item.name,
                variant: item.variant || '',
                price: item.price,
                originalPrice: item.originalPrice || null,
                quantity: item.quantity,
                image: item.image || '/placeholder-product.jpg',
                seller: item.seller
            })),
            subtotal,
            discount,
            shippingCost,
            tax,
            total,
            shippingAddress: {
                name: `${order.customerDetails.firstname} ${order.customerDetails.lastname}`,
                street: order.shippingAddress?.street || order.customerDetails.address || 'N/A',
                city: order.shippingAddress?.city || order.customerDetails.city || 'N/A',
                state: order.shippingAddress?.state || order.customerDetails.state || 'N/A',
                zip: order.shippingAddress?.zip || order.customerDetails.zip || 'N/A',
                country: order.shippingAddress?.country || order.customerDetails.country || 'N/A'
            },
            paymentMethod: {
                type: order.paymentDetails.method || 'Card',
                last4: order.paymentDetails.cardLast4 || '4242',
                status: order.paymentDetails.status || 'paid',
                paidAt: order.paymentDetails.paidAt || order.createdAt
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order details',
            error: error.message
        });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { orderId } = req.params;
        const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Send status update email to customer
        try {
            await sendStatusUpdateEmail(order);
        } catch (emailError) {
            console.error('Failed to send status update email:', emailError);
        }

        res.status(200).json({
            success: true,
            status: order.status
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Failed to update order status' });
    }
};

async function sendStatusUpdateEmail(order) {
    const mailOptions = {
        from: `"LocalCart" <${process.env.EMAIL_FROM}>`,
        to: order.customerDetails.email,
        subject: `Your Order #${order._id} Status Update`,
        html: `
            <h2>Order Status Updated</h2>
            <p>Your order <strong>#${order._id}</strong> status has been updated to <strong>${order.status}</strong>.</p>
            <p>Thank you for shopping with us!</p>
        `
    };

    await transporter.sendMail(mailOptions);
}