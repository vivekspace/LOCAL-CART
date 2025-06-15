// controllers/orderController.js
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const nodemailer = require('nodemailer');
const User = require('../models/User')
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
    console.log('Order Controller: Starting createOrder execution.');
    console.log('Order Controller: req.user at entry:', req.user ? req.user._id : 'null/undefined');

    if (!req.user) {
        console.log('Order Controller: req.user is NULL, returning 401.');
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

        // *** NEW: Fetch product details to get seller information ***
        const enrichedCartItems = await Promise.all(
            cartItems.map(async (item) => {
                try {
                    // Fetch product details if productId exists
                    if (item.productId) {
                        const Product = require('../models/Product'); // Adjust path as needed
                        const product = await Product.findById(item.productId);

                        if (product && product.seller) {
                            return {
                                ...item,
                                seller: product.seller // Add seller from product
                            };
                        }
                    }

                    // If no productId or product not found, return item as is
                    return item;
                } catch (error) {
                    console.error(`Error fetching product ${item.productId}:`, error);
                    return item;
                }
            })
        );

        // Backend calculations (your existing logic)
        const subtotal = enrichedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08;
        const shippingCost = subtotal > 50 ? 0 : 10; // This might be overridden by frontend's `shipping.cost`
        const discount = 0;
        const totalAmount = subtotal + tax + shippingCost - discount; // Use your backend calculation

        // Normalize cart items (your existing logic)
        const normalizedItems = enrichedCartItems.map(item => {
            let sellerId;

            if (typeof item.seller === 'object' && item.seller !== null && (item.seller._id || item.seller.id)) {
                sellerId = item.seller._id || item.seller.id;
            } else {

                sellerId = item.seller;
            }


            let finalSellerId = null; // Initialize to null

            if (sellerId && typeof sellerId === 'string' && mongoose.Types.ObjectId.isValid(sellerId)) {
                // If it's a valid ObjectId string, convert it
                finalSellerId = new mongoose.Types.ObjectId(sellerId);
            } else if (sellerId && typeof sellerId === 'object' && sellerId instanceof mongoose.Types.ObjectId) {
                // If it's already a mongoose ObjectId (less likely if coming from frontend payload directly)
                finalSellerId = sellerId;
            } else {

                console.error(`Invalid or missing seller ID for cart item: ${item.name || 'Unknown Item'}. Received sellerId:`, sellerId);
                throw new Error(`Missing or invalid seller ID for product: ${item.name || 'an item in your cart'}`);

            }

            return {
                ...item,
                seller: finalSellerId // Ensure this is a valid ObjectId or null/undefined if allowed by schema
            };
        });


        const finalShippingAddress = {
            street: shipping.address.line1, // Map frontend line1 to backend street
            city: shipping.address.city,
            state: shipping.address.state,
            zip: shipping.address.pincode,  // Map frontend pincode to backend zip
            country: shipping.address.country || 'India', // Ensure country is saved

        };

        // Create and save the order
        const allowedStatuses = ['pending', 'processing', 'completed', 'shipped', 'failed'];
        const safeStatus = allowedStatuses.includes(orderStatus) ? orderStatus : 'processing';


        const newOrder = new Order({
            customerId: req.user._id,
            customerDetails: {
                firstname: customerDetails.firstname,
                lastname: customerDetails.lastname,
                email: customerDetails.email,
                phone: customerDetails.phone,
            },
            cartItems: normalizedItems,
            paymentDetails: {
                method: paymentDetails.method,
                amount: paymentDetails.amount,
                transactionId: paymentDetails.transactionId,
                last4: paymentDetails.last4,
                paidAt: paymentDetails.paidAt,
                status: paymentDetails.status ||
                    (paymentDetails.method?.toLowerCase() === 'cod' ? 'pending' : 'paid')
            },

            shippingAddress: finalShippingAddress,
            subtotal,
            tax,
            shippingCost: shipping.cost,
            discount,
            totalAmount: pricing?.total || totalAmount,
            status: safeStatus
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
                            customer: { // Pass all customer details as an object
                                email: customerDetails.email,
                                firstname: customerDetails.firstname,
                                lastname: customerDetails.lastname,
                                phone: customerDetails.phone,
                                name: `${customerDetails.firstname || ''} ${customerDetails.lastname || ''}`.trim()
                            },
                            paymentMethod: paymentDetails.method,
                            shippingAddress: finalShippingAddress, // Pass the entire finalShippingAddress object
                            overallTotal: savedOrder.totalAmount // Pass the overall order total if relevant
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
async function sendVendorEmail(to, { orderId, items, customer, paymentMethod, shippingAddress, overallTotal }) {
    // Ensure customer name is properly formatted
    const customerFullName = (customer.name && customer.name.trim() !== '') ? customer.name : `${customer.firstname || ''} ${customer.lastname || ''}`.trim();
    const displayCustomerName = customerFullName || 'N/A'; // Fallback if still empty

    // Calculate subtotal for the items relevant to this specific vendor
    const vendorSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const itemRows = items.map(item => `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${item.price.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${(item.quantity * item.price).toFixed(2)}</td>
        </tr>
    `).join('');

    const mailOptions = {
        from: `"LocalCart" <${process.env.EMAIL_FROM}>`,
        to,
        subject: `New Order Notification - Order #${orderId}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #0056b3;">New Order Notification</h2>
                <p>Hello Vendor,</p>
                <p>You have received a new order from LocalCart!</p>

                <p><strong>Order ID:</strong> <span style="font-weight: bold; color: #d9534f;">${orderId}</span></p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>

                <h3 style="color: #0056b3;">Customer Details:</h3>
                <p><strong>Name:</strong> ${displayCustomerName}</p>
                <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>

                <h3 style="color: #0056b3;">Shipping Address:</h3>
                <p>${shippingAddress.street || 'N/A'}</p>
                <p>${shippingAddress.city || 'N/A'}, ${shippingAddress.state || 'N/A'} - ${shippingAddress.zip || 'N/A'}</p>
                <p>${shippingAddress.country || 'India'}</p>

                <h3 style="color: #0056b3;">Your Order Items:</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Quantity</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Unit Price</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                        <tr>
                            <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Subtotal (Your items):</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${vendorSubtotal.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                <p>Please prepare these items for shipping at your earliest convenience.</p>
                <p>Thank you for being a part of LocalCart!</p>
                <p>Best regards,<br>The LocalCart Team</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}
// controllers/orderController.js (Updated getVendorOrders function)



// controllers/orderController.js

exports.getVendorOrders = async (req, res) => {
    try {
        const vendorId = req.vendor._id;

        // Only orders that include at least one item from this vendor
        const orders = await Order.find({ 'cartItems.seller': vendorId })
            .sort({ createdAt: -1 }) // Latest first
            .lean(); // Optional: Makes result faster if no Mongoose methods needed

        const vendorOrders = orders.map(order => {
            // Filter only the items that belong to this vendor
            const vendorItems = order.cartItems.filter(item => item.seller.toString() === vendorId.toString());

            return {
                _id: order._id,
                orderId: order.orderId || "",
                customerName: `${order.customerDetails?.firstname || ''} ${order.customerDetails?.lastname || ''}`.trim(),
                email: order.customerDetails.email,
                phone: order.customerDetails.phone,
                shippingAddress: order.shippingAddress,
                paymentStatus: order.paymentDetails.status,
                paymentMethod: order.paymentDetails.method,
                orderDate: order.createdAt,
                items: vendorItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                totalAmount: vendorItems.reduce((acc, item) => acc + item.quantity * item.price, 0)
            };
        });

        res.status(200).json({ success: true, orders: vendorOrders });
    } catch (error) {
        console.error("Error fetching vendor orders:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
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
        const vendorId = req.vendor._id;

        const validStatuses = ['pending', 'processing', 'completed', 'failed', 'shipped', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        // Fetch the order first
        const order = await Order.findOne({
            _id: orderId,
            'cartItems.seller': vendorId
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or not authorized' });
        }

        // Determine if payment status needs to be updated
        let paymentStatusUpdate = {};
        const currentPaymentMethod = order.paymentDetails?.method;

        if (status === 'completed') {
            // ✅ If COD order, mark payment as paid when completed
            if (currentPaymentMethod === 'COD') {
                paymentStatusUpdate['paymentDetails.status'] = 'paid';
            } else {
                // For online payments, assume it's already paid, don't change status
                paymentStatusUpdate = {};
            }
        } else if (status === 'failed') {
            paymentStatusUpdate['paymentDetails.status'] = 'failed';
        }

        // Perform update
        const updatedOrder = await Order.findOneAndUpdate(
            {
                _id: orderId,
                'cartItems.seller': vendorId
            },
            {
                $set: {
                    status: status,
                    ...paymentStatusUpdate
                }
            },
            { new: true }
        );

        // Optional: send email notification
        try {
            await sendStatusUpdateEmail(updatedOrder);
        } catch (emailErr) {
            console.error('Failed to send status update email:', emailErr.message);
        }

        return res.status(200).json({
            success: true,
            message: 'Order status updated',
            order: {
                _id: updatedOrder._id,
                status: updatedOrder.status,
                paymentStatus: updatedOrder.paymentDetails.status,
                paymentMethod: updatedOrder.paymentDetails.method
            }
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({
            message: 'Failed to update order status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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