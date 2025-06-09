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
// In your orderController.js - rename the function
exports.getCustomerOrders = async (req, res) => {  // ✅ Changed from getAllOrders
    try {
        // 1. ENFORCE AUTHENTICATION - MUST come from protect middleware
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized - please login"
            });
        }

        // 2. DATA ISOLATION - Only get orders for the current user
        const orders = await Order.find({
            customerId: req.user._id // Critical security filter
        }).sort({ createdAt: -1 });

        // 3. TRANSFORM DATA - Only include what's needed
        const transformedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order._id.toString().slice(-8).toUpperCase(),
            status: order.status,
            createdAt: order.createdAt,
            totalAmount: order.totalAmount ||
                order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            itemCount: order.cartItems.length,
            paymentMethod: order.paymentDetails.method,
            paymentStatus: order.paymentDetails.status
        }));

        res.status(200).json({
            success: true,
            count: transformedOrders.length,
            orders: transformedOrders
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    console.log('Order Controller: Starting createOrder execution.'); // Add this
    console.log('Order Controller: req.user at entry:', req.user ? req.user._id : 'null/undefined'); // Add this

    if (!req.user) {
        console.log('Order Controller: req.user is NULL, returning 401.'); // Add this
        return res.status(401).json({
            success: false,
            message: "Not authorized - please login"
        });
    }
    try {
        // ADD THIS AUTHENTICATION CHECK (ensure protect middleware is active on route)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized - please login"
            });
        }

        // Destructure `shipping` from req.body, which contains the nested address
        const { customerDetails, cartItems, paymentDetails, shipping, pricing, orderStatus } = req.body;

        // Validate required fields
        if (!customerDetails || !cartItems || cartItems.length === 0 || !shipping || !shipping.address) {
            return res.status(400).json({
                success: false,
                error: 'Missing required order information, including shipping address'
            });
        }

        // Backend calculations (your existing logic)
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08;
        const shippingCost = subtotal > 50 ? 0 : 10; // This might be overridden by frontend's `shipping.cost`
        const discount = 0;
        const totalAmount = subtotal + tax + shippingCost - discount; // Use your backend calculation

        // Normalize cart items (your existing logic)
        const normalizedItems = cartItems.map(item => {
            let sellerId;
            if (typeof item.seller === 'object' && (item.seller._id || item.seller.id)) {
                sellerId = item.seller._id || item.seller.id;
            } else {
                sellerId = item.seller;
            }

            const finalSellerId = mongoose.Types.ObjectId.isValid(sellerId)
                ? new mongoose.Types.ObjectId(sellerId)
                : sellerId;

            return {
                ...item,
                seller: finalSellerId
            };
        });

        // Construct the shippingAddress object for the Order model
        // directly from the frontend's 'shipping.address' structure
        const finalShippingAddress = {
            street: shipping.address.line1, // Map frontend line1 to backend street
            city: shipping.address.city,
            state: shipping.address.state,
            zip: shipping.address.pincode,  // Map frontend pincode to backend zip
            country: shipping.address.country || 'India', // Ensure country is saved
            // Include line2 if your Order model has it
            // line2: shipping.address.line2 || ''
        };

        // Create and save the order
        const newOrder = new Order({
            customerId: req.user._id,
            customerDetails: {
                firstname: customerDetails.firstname,
                lastname: customerDetails.lastname,
                email: customerDetails.email,
                phone: customerDetails.phone,
                // Do NOT include address fields here if they are now in shippingAddress
            },
            cartItems: normalizedItems,
            paymentDetails,
            shippingAddress: finalShippingAddress, // <<< Use the newly mapped address here

            // Use backend calculated values or frontend values if reliable
            subtotal,
            tax,
            shippingCost: shipping.cost, // Use frontend's provided shipping cost if reliable, or your backend calculation
            discount,
            totalAmount: pricing?.total || totalAmount, // Use frontend total if sent, otherwise backend calculated
            status: orderStatus || 'processing'
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
        // ADD AUTHENTICATION CHECK
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized - please login"
            });
        }

        const { orderId } = req.params;
        console.log('Fetching order details for:', orderId);

        // Validate the ID format first
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format'
            });
        }

        // ✅ CRITICAL SECURITY FIX: Only get orders for the authenticated user
        const order = await Order.findOne({
            _id: orderId,
            customerId: req.user._id  // Only user's own orders
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Rest of your existing transformation logic...
        const subtotal = order.subtotal || order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = order.tax || 0;
        const shippingCost = order.shippingCost || 0;
        const discount = order.discount || 0;
        const total = order.totalAmount || (subtotal + tax + shippingCost - discount);

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