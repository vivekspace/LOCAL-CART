// controllers/orderController.js
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product'); // <-- ADD THIS LINE: Import Product model
const nodemailer = require('nodemailer');
const User = require('../models/User');
const mongoose = require('mongoose'); // Ensure mongoose is imported
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
exports.getCustomerOrders = async (req, res) => {
    try {
        // 1. ENFORCE AUTHENTICATION - MUST come from protect middleware
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized - please login"
            });
        }

        // 2. DATA ISOLATION & POPULATION - Only get orders for the current user and populate product images
        const orders = await Order.find({
            customerId: req.user._id // Critical security filter
        })
            .populate({
                path: 'cartItems.productId', // Path to the product ID within each cart item
                model: 'Product',            // The model to use for population
                select: 'images',            // Select only the 'images' array from the Product document
            })
            .sort({ createdAt: -1 })
            .lean(); // Use .lean() for faster query results if you don't need Mongoose document methods


        // 3. TRANSFORM DATA - Include image URL in the transformed output
        const transformedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order._id.toString().slice(-8).toUpperCase(),
            firstProductName: order.cartItems.length > 0 ? order.cartItems[0].name : null, // <--- ADD THIS LINE
            status: order.status,
            createdAt: order.createdAt,
            totalAmount: order.totalAmount ||
                order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            itemCount: order.cartItems.length,
            paymentMethod: order.paymentDetails.method,
            paymentStatus: order.paymentDetails.status,
            // Include cartItems with image URLs
            cartItems: order.cartItems.map(item => {
                let imageUrl = '/placeholder-product.png'; // Default fallback image path

                // Check if productId was successfully populated and has images
                if (item.productId && item.productId.images && item.productId.images.length > 0) {
                    imageUrl = item.productId.images[0]; // Take the first image from the array
                }

                return {
                    productId: item.productId ? item.productId._id : null, // Keep product ID
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    imageUrl: imageUrl, // Add the image URL here
                    // Optionally include seller if frontend needs it for individual items
                    // seller: item.seller
                };
            })
        }));

        res.status(200).json({
            success: true,
            count: transformedOrders.length,
            orders: transformedOrders
        });

    } catch (error) {
        console.error('Error fetching customer orders:', error); // More specific error message
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get orders by customer email (if you don't have user auth) - No change needed here for images unless this route is also used for detailed user view
exports.getOrdersByEmail = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // If you want images here too, you'd add .populate similarly
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
        if (!req.user) { // Redundant check, but harmless if middleware handles it
            return res.status(401).json({
                success: false,
                message: "Not authorized - please login"
            });
        }

        const { customerDetails, cartItems, paymentDetails, shipping, pricing, orderStatus } = req.body;

        if (!customerDetails || !cartItems || cartItems.length === 0 || !shipping || !shipping.address) {
            return res.status(400).json({
                success: false,
                error: 'Missing required order information, including shipping address'
            });
        }

        const enrichedCartItems = await Promise.all(
            cartItems.map(async (item) => {
                try {
                    if (item.productId) {
                        const Product = require('../models/Product'); // Ensure Product model is required locally or globally
                        const product = await Product.findById(item.productId);

                        if (product && product.seller) {
                            return {
                                ...item,
                                seller: product.seller // Add seller from product
                            };
                        }
                    }
                    return item; // If no productId or product not found, return item as is
                } catch (error) {
                    console.error(`Error fetching product ${item.productId}:`, error);
                    return item;
                }
            })
        );

        const subtotal = enrichedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08;
        const shippingCost = subtotal > 50 ? 0 : 10;
        const discount = 0;
        const totalAmount = subtotal + tax + shippingCost - discount;

        const normalizedItems = enrichedCartItems.map(item => {
            let sellerId;
            if (typeof item.seller === 'object' && item.seller !== null && (item.seller._id || item.seller.id)) {
                sellerId = item.seller._id || item.seller.id;
            } else {
                sellerId = item.seller;
            }

            let finalSellerId = null;
            if (sellerId && typeof sellerId === 'string' && mongoose.Types.ObjectId.isValid(sellerId)) {
                finalSellerId = new mongoose.Types.ObjectId(sellerId);
            } else if (sellerId && typeof sellerId === 'object' && sellerId instanceof mongoose.Types.ObjectId) {
                finalSellerId = sellerId;
            } else {
                console.error(`Invalid or missing seller ID for cart item: ${item.name || 'Unknown Item'}. Received sellerId:`, sellerId);
                throw new Error(`Missing or invalid seller ID for product: ${item.name || 'an item in your cart'}`);
            }
            return {
                ...item,
                seller: finalSellerId
            };
        });

        const finalShippingAddress = {
            street: shipping.address.line1,
            city: shipping.address.city,
            state: shipping.address.state,
            zip: shipping.address.pincode,
            country: shipping.address.country || 'India',
        };

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

        const vendorItemsMap = normalizedItems.reduce((map, item) => {
            const key = item.seller.toString();
            if (!map[key]) {
                map[key] = [];
            }
            map[key].push(item);
            return map;
        }, {});

        await Promise.all(
            Object.entries(vendorItemsMap).map(async ([sellerId, items]) => {
                try {
                    const vendor = await Vendor.findById(sellerId);
                    if (vendor && vendor.email) {
                        await sendVendorEmail(vendor.email, {
                            orderId: savedOrder._id,
                            items,
                            customer: {
                                email: customerDetails.email,
                                firstname: customerDetails.firstname,
                                lastname: customerDetails.lastname,
                                phone: customerDetails.phone,
                                name: `${customerDetails.firstname || ''} ${customerDetails.lastname || ''}`.trim()
                            },
                            paymentMethod: paymentDetails.method,
                            shippingAddress: finalShippingAddress,
                            overallTotal: savedOrder.totalAmount
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
    const customerFullName = (customer.name && customer.name.trim() !== '') ? customer.name : `${customer.firstname || ''} ${customer.lastname || ''}`.trim();
    const displayCustomerName = customerFullName || 'N/A';

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
exports.getVendorOrders = async (req, res) => {
    try {
        const vendorId = req.vendor._id;

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
                status: order.status,
                items: vendorItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    // If you want images for vendor view as well, populate in getVendorOrders too.
                    // For now, only for customer view.
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

exports.getPublicOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('Fetching PUBLIC order details for:', orderId);

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format'
            });
        }

        // Here, we *only* query by _id. No customerId check.
        // If you want images for public details, add .populate here too
        const order = await Order.findById(orderId)
            .populate({
                path: 'cartItems.productId',
                model: 'Product',
                select: 'images'
            })
            .lean(); // Add lean for better performance

        console.log("Order object retrieved from DB:", order);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found with the provided ID.'
            });
        }

        const subtotal = order.subtotal || order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = order.tax || 0;
        const shippingCost = order.shippingCost || 0;
        const discount = order.discount || 0;
        const total = order.totalAmount || (subtotal + tax + shippingCost - discount);

        const response = {
            orderId: order._id.toString(),
            createdAt: order.createdAt,
            status: order.status,
            items: order.cartItems.map(item => {
                let imageUrl = '/placeholder-product.png';
                if (item.productId && item.productId.images && item.productId.images.length > 0) {
                    imageUrl = item.productId.images[0];
                }
                return {
                    id: item._id ? item._id.toString() : null,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: imageUrl, // Use the populated image URL
                };
            }),
            subtotal,
            discount,
            shippingCost,
            tax,
            total,
            shippingAddress: {
                city: order.shippingAddress?.city || order.customerDetails?.city || 'N/A',
                state: order.shippingAddress?.state || order.customerDetails?.state || 'N/A',
                pincode: order.shippingAddress?.zip || order.customerDetails?.zip || 'N/A'
            },
            estimatedDelivery: order.estimatedDelivery,
            trackingNumber: order.trackingNumber
        };

        res.status(200).json({ success: true, data: response });

    } catch (error) {
        console.error('[getPublicOrderDetails] Server Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch public order details',
            error: error.message
        });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized - please login"
            });
        }

        const { orderId } = req.params;
        console.log('Fetching order details for:', orderId);

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format'
            });
        }

        // ✅ CRITICAL SECURITY FIX: Only get orders for the authenticated user
        // ✅ ADD POPULATE HERE FOR DETAILED VIEW
        const order = await Order.findOne({
            _id: orderId,
            customerId: req.user._id
        })
            .populate({
                path: 'cartItems.productId',
                model: 'Product',
                select: 'images' // Select only the images field
            })
            .lean(); // Use .lean() for better performance

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const subtotal = order.subtotal || order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = order.tax || 0;
        const shippingCost = order.shippingCost || 0;
        const discount = order.discount || 0;
        const total = order.totalAmount || (subtotal + tax + shippingCost - discount);

        const response = {
            orderNumber: order._id.toString(),
            createdAt: order.createdAt,
            status: order.status,
            items: order.cartItems.map(item => {
                let imageUrl = '/placeholder-product.png';
                if (item.productId && item.productId.images && item.productId.images.length > 0) {
                    imageUrl = item.productId.images[0];
                }
                return {
                    id: item._id || uuidv4(),
                    name: item.name,
                    variant: item.variant || '',
                    price: item.price,
                    originalPrice: item.originalPrice || null,
                    quantity: item.quantity,
                    image: imageUrl, // Use the populated image URL
                    seller: item.seller
                };
            }),
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

        const order = await Order.findOne({
            _id: orderId,
            'cartItems.seller': vendorId
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or not authorized' });
        }

        let paymentStatusUpdate = {};
        const currentPaymentMethod = order.paymentDetails?.method;

        if (status === 'completed') {
            if (currentPaymentMethod === 'COD') {
                paymentStatusUpdate['paymentDetails.status'] = 'paid';
            } else {
                paymentStatusUpdate = {};
            }
        } else if (status === 'failed') {
            paymentStatusUpdate['paymentDetails.status'] = 'failed';
        }

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