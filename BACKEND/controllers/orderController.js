// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const mongoose = require('mongoose');
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
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized - please login"
            });
        }

        const orders = await Order.find({
            customerId: req.user._id
        })
            .populate({
                path: 'cartItems.productId',
                model: 'Product',
                select: 'images',
            })
            .sort({ createdAt: -1 })
            .lean();

        const transformedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order._id.toString().slice(-8).toUpperCase(),
            firstProductName: order.cartItems.length > 0 ? order.cartItems[0].name : null,
            status: order.status,
            createdAt: order.createdAt,
            totalAmount: order.totalAmount ||
                order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            itemCount: order.cartItems.length,
            paymentMethod: order.paymentDetails.method,
            paymentStatus: order.paymentDetails.status,
            cartItems: order.cartItems.map(item => {
                let imageUrl = '/placeholder-product.png';

                if (item.productId && item.productId.images && item.productId.images.length > 0) {
                    imageUrl = item.productId.images[0];
                }

                return {
                    productId: item.productId ? item.productId._id : null,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    imageUrl: imageUrl,
                };
            })
        }));

        res.status(200).json({
            success: true,
            count: transformedOrders.length,
            orders: transformedOrders
        });

    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

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
exports.createOrder = async (req, res, next) => { // Added 'next' for error handling consistency
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
                        const product = await Product.findById(item.productId);

                        if (product && product.seller) {
                            return {
                                ...item,
                                seller: product.seller
                            };
                        } else {
                            console.warn(`WARNING: Product ${item.productId} found but seller is missing or null. Product object:`, JSON.stringify(product, null, 2));
                            return item;
                        }
                    }
                    console.warn(`WARNING: Cart item ${item.name || 'Unknown'} has no productId.`);
                    return item;
                } catch (error) {
                    console.error(`ERROR: Exception while fetching product ${item.productId}:`, error);
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
                console.error(`!!! ERROR TRIGGERED: Invalid or missing seller ID for cart item: ${item.name || 'Unknown Item'}. Received sellerId:`, sellerId, `Type:`, typeof sellerId);
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
            zip: shipping.address.zip,
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
                    const vendor = await User.findById(sellerId);

                    // --- ADDED SOCKET.IO NOTIFICATION LOGIC FOR REAL ORDERS ---
                    const io = req.app.get('socketio'); // Get the Socket.IO instance
                    if (io && vendor) {
                        const notificationData = {
                            recipient: vendor._id,
                            type: 'new-order',
                            title: `New Order: #${savedOrder._id.toString().slice(-6).toUpperCase()}`,
                            message: `You received a new order for ${items.length} item(s). Total for your items: ₹${items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}.`,
                            link: `/vendor/orders/${savedOrder._id}`, // Link to the order details page
                            isRead: false,
                            createdAt: new Date(),
                            orderId: savedOrder._id,
                        };
                        await Notification.create(notificationData); // Save notification to DB
                        io.to(vendor._id.toString()).emit('newNotification', notificationData); // Emit to seller's room
                        console.log(`[OrderController] SUCCESS: Emitted 'newNotification' for actual order ${savedOrder._id} to vendor ${vendor._id}`);
                    } else {
                        console.warn(`[OrderController] WARNING: Socket.IO instance or vendor not found for real order notification. io: ${!!io}, vendor: ${!!vendor}. Seller ID: ${sellerId}`);
                    }
                    // --- END ADDED SOCKET.IO LOGIC ---

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
                        console.warn(`Vendor with ID ${sellerId} not found or missing email for email notification.`);
                    }
                } catch (notificationOrEmailError) {
                    console.error(`Failed to send notification/email to vendor ${sellerId}:`, notificationOrEmailError);
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
        next(error); // Pass error to Express error handling middleware
    }
};

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
        const vendorId = req.user._id;

        const orders = await Order.find({ 'cartItems.seller': vendorId })
            .sort({ createdAt: -1 })
            .lean();

        const vendorOrders = orders.map(order => {
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

        const order = await Order.findById(orderId)
            .populate({
                path: 'cartItems.productId',
                model: 'Product',
                select: 'images'
            })
            .lean();

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
                    image: imageUrl,
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

        const order = await Order.findOne({
            _id: orderId,
            customerId: req.user._id
        })
            .populate({
                path: 'cartItems.productId',
                model: 'Product',
                select: 'images'
            })
            .lean();

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
                    image: imageUrl,
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
exports.updateOrderStatus = async (req, res, next) => { // Added 'next' here
    try {
        const { status } = req.body;
        const { orderId } = req.params;
        const vendorId = req.user._id;

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

        // --- ADDED SOCKET.IO NOTIFICATION LOGIC FOR STATUS UPDATES ---
        const io = req.app.get('socketio'); // Get the Socket.IO instance
        if (io && updatedOrder && updatedOrder.customerId) {
            const customerNotificationData = {
                recipient: updatedOrder.customerId,
                type: 'order-status-update',
                title: `Order #${updatedOrder._id.toString().slice(-6).toUpperCase()} Status Update`,
                message: `Your order is now '${updatedOrder.status}'.`,
                link: `/orders/${updatedOrder._id}`, // Link to customer's order details
                isRead: false,
                createdAt: new Date(),
                orderId: updatedOrder._id,
            };
            await Notification.create(customerNotificationData); // Save notification to DB
            io.to(updatedOrder.customerId.toString()).emit('newNotification', customerNotificationData); // Emit to customer's room
            console.log(`[OrderController] Socket.IO: Emitted 'newNotification' to customer room ${updatedOrder.customerId} for order status update.`);
        } else {
            console.warn(`[OrderController] Socket.IO instance or order/customer not found for status update notification.`);
        }
        // --- END ADDED SOCKET.IO LOGIC ---

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
        next(error); // Pass error to Express error handling middleware
    }
};


exports.getAllOrders = async (req, res) => {
    try {
        console.log('Fetching all orders for admin view...');

        const orders = await Order.find({})
            .populate({
                path: 'cartItems.productId',
                model: 'Product',
                select: 'images name'
            })
            .sort({ createdAt: -1 })
            .lean();

        const transformedOrders = orders.map(order => {
            const customerFullName = `${order.customerDetails?.firstname || ''} ${order.customerDetails?.lastname || ''}`.trim();
            const orderTotal = order.totalAmount ||
                order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            return {
                _id: order._id,
                orderNumber: order._id.toString().slice(-8).toUpperCase(),
                customerName: customerFullName || 'N/A',
                customerEmail: order.customerDetails?.email || 'N/A',
                customerPhone: order.customerDetails?.phone || 'N/A',
                status: order.status,
                createdAt: order.createdAt,
                totalAmount: orderTotal,
                paymentMethod: order.paymentDetails?.method || 'N/A',
                paymentStatus: order.paymentDetails?.status || 'N/A',
                shippingAddress: order.shippingAddress,
                items: order.cartItems.map(item => {
                    let imageUrl = '/placeholder-product.png';
                    let productName = item.name;

                    if (item.productId) {
                        if (item.productId.images && item.productId.images.length > 0) {
                            imageUrl = item.productId.images[0];
                        }
                        if (item.productId.name) {
                            productName = item.productId.name;
                        }
                    }

                    return {
                        productId: item.productId ? item.productId._id : null,
                        name: productName,
                        quantity: item.quantity,
                        price: item.price,
                        imageUrl: imageUrl,
                        seller: item.seller
                    };
                })
            };
        });

        res.status(200).json({
            success: true,
            count: transformedOrders.length,
            orders: transformedOrders
        });

    } catch (error) {
        console.error('Error fetching all orders for admin:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch all orders for admin',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.sendOrderMessageToCustomer = async (req, res) => {
    if (!req.user || req.user.role !== 'seller') {
        return res.status(403).json({
            success: false,
            message: "Not authorized - only sellers can send messages to customers."
        });
    }

    const { orderId, messageContent } = req.body;
    const vendorId = req.user._id;

    if (!orderId || !messageContent) {
        return res.status(400).json({ success: false, message: 'Order ID and message content are required.' });
    }

    try {
        const order = await Order.findOne({
            _id: orderId,
            'cartItems.seller': vendorId
        }).lean();

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not associated with this vendor.' });
        }

        const customerEmail = order.customerDetails?.email;
        const customerName = `${order.customerDetails?.firstname || ''} ${order.customerDetails?.lastname || ''}`.trim() || 'Valued Customer';

        if (!customerEmail) {
            return res.status(404).json({ success: false, message: 'Customer email not found for this order.' });
        }

        const vendor = await User.findById(vendorId);
        const vendorShopName = vendor?.storeName || 'Your LocalCart Vendor';

        const mailOptions = {
    from: `"LocalCart - ${vendorShopName}" <${process.env.EMAIL_FROM}>`,
    to: customerEmail,
    subject: `Important Message Regarding Your LocalCart Order #${order._id.toString().slice(-8).toUpperCase()} from ${vendorShopName}`,
    html: `
        <div style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <!-- Header Section -->
            <div style="background-color: #0056b3; color: #ffffff; padding: 20px 25px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">LocalCart</h1>
                <p style="margin: 5px 0 0; font-size: 16px;">Connecting You with Local Businesses</p>
            </div>

            <!-- Body Content -->
            <div style="padding: 25px;">
                <h2 style="color: #0056b3; font-size: 22px; margin-top: 0;">Dear ${customerName},</h2>
                <p style="font-size: 15px; margin-bottom: 20px;">You have received an important message from <strong>${vendorShopName}</strong> concerning your recent order on LocalCart.</p>

                <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 18px 20px; border-radius: 6px; margin-bottom: 20px;">
                    <p style="font-size: 15px; margin: 0;"><strong>Order Reference:</strong> <span style="font-weight: bold; color: #d9534f;">#${order._id.toString().slice(-8).toUpperCase()}</span></p>
                </div>

                <h3 style="color: #0056b3; font-size: 18px; border-bottom: 1px solid #e9ecef; padding-bottom: 10px; margin-bottom: 20px;">Message from ${vendorShopName}:</h3>
                <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                    <p style="font-size: 15px; margin: 0;">${messageContent.replace(/\n/g, '<br>')}</p>
                </div>

                <p style="font-size: 15px; text-align: center; margin-bottom: 25px;">For further assistance or to respond to this message, please log in to your LocalCart account or reply directly to this email.</p>

                <!-- Call to Action Button (Example - adjust URL as needed) -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href="YOUR_LOCALCART_LOGIN_URL" style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 16px;">
                        Access Your Order on LocalCart
                    </a>
                </div>

                <p style="font-size: 15px; margin-top: 0; text-align: center;">Thank you for choosing LocalCart for your shopping needs!</p>
            </div>

            <!-- Footer Section -->
            <div style="background-color: #f0f0f0; color: #666; padding: 15px 25px; text-align: center; font-size: 13px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                <p style="margin: 0;">Best regards,<br>The LocalCart Team</p>
                <p style="margin: 10px 0 0;">&copy; ${new Date().getFullYear()} LocalCart. All rights reserved.</p>
            </div>
        </div>
    `
};


        await transporter.sendMail(mailOptions);
        console.log(`Vendor message sent for order ${orderId} to ${customerEmail}`);
        res.status(200).json({ success: true, message: 'Message sent to customer successfully!' });

    } catch (error) {
        console.error('Error sending vendor message to customer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message to customer.',
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