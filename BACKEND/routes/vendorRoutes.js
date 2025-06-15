const express = require('express');
const router = express.Router();
const mongoose = require('mongoose') // Corrected spelling from 'moongose'

// --- ADD THESE IMPORTS ---
const Product = require('../models/Product');
const Order = require('../models/Order');     // Assuming your Order model is here
const Customer = require('../models/User'); // Assuming your Customer model is here
// --- END ADDITIONS ---


const {
    registerVendor,
    loginVendor,
    addProduct,
    deleteProduct,
    getVendorProducts
} = require('../controllers/vendorController');
const { getVendorDashboard } = require('../controllers/dashboardController');
const { protectVendor } = require('../middleware/vendorAuth');
const orderController = require('../controllers/orderController');

// Vendor Auth Routes (These paths are correct relative to '/api/vendor' prefix)
router.post('/register', registerVendor);
router.post('/login', loginVendor);

// Product Routes (These paths are correct relative to '/api/vendor' prefix)
router.post('/products', protectVendor, addProduct);
router.get('/products', protectVendor, getVendorProducts);
router.delete('/products/:id', protectVendor, deleteProduct);

// Middleware for orderId parameter validation
// This should also be relative to the router's prefix
router.param('orderId', (req, res, next, id) => {
    // Ensure mongoose is correctly imported as 'mongoose' not 'moongose'
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid order ID format'
        });
    }
    next();
});

// Order Routes (Corrected paths - removed '/vendor' prefix)
router.get('/orders', protectVendor, orderController.getVendorOrders); // Correct: /api/vendor/orders
router.put('/orders/:orderId/status', protectVendor, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const updatedOrder = await Order.updateStatus(orderId, status);
        res.json(updatedOrder);
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: error.message });
    }
});


// Dashboard Route (Correct path relative to '/api/vendor' prefix)
router.get('/dashboard', protectVendor, getVendorDashboard);

// Analytics Route (Correct path relative to '/api/vendor' prefix)
router.get('/analytics', protectVendor, async (req, res) => {
    try {
        const vendorId = req.vendor._id;

        // Calculate total revenue for this vendor (completed orders only)
        const totalRevenueResult = await Order.aggregate([
            { $match: { 'cartItems.seller': vendorId, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        // Count all orders that include this vendor's items
        const totalOrders = await Order.countDocuments({ 'cartItems.seller': vendorId });

        // Count completed orders for this vendor
        const completedOrders = await Order.countDocuments({
            'cartItems.seller': vendorId,
            status: 'completed'
        });

        // New customers in last 30 days (global, not vendor-specific)
        const newCustomers = await Customer.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // Popular products (top 5)
        const popularProducts = await Order.aggregate([
            { $unwind: '$cartItems' },
            { $match: { 'cartItems.seller': vendorId } },
            {
                $group: {
                    _id: '$cartItems.productId',
                    name: { $first: '$cartItems.name' },
                    totalQuantity: { $sum: '$cartItems.quantity' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            {
                $project: {
                    name: 1,
                    orders: '$totalQuantity',
                    _id: 0
                }
            }
        ]);

        // Sales trend over the last 30 days
        const salesTrend = await Order.aggregate([
            { $unwind: '$cartItems' },
            {
                $match: {
                    'cartItems.seller': vendorId,
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    amount: { $sum: { $multiply: ['$cartItems.price', '$cartItems.quantity'] } }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: '$_id',
                    amount: 1,
                    _id: 0
                }
            }
        ]);

        // Recent 5 orders that include this vendor's items
        const recentOrders = await Order.aggregate([
            { $unwind: '$cartItems' },
            { $match: { 'cartItems.seller': vendorId } },
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
                $project: {
                    orderId: '$_id',
                    customerName: {
                        $concat: ['$customerDetails.firstname', ' ', '$customerDetails.lastname']
                    },
                    itemName: '$cartItems.name',
                    quantity: '$cartItems.quantity',
                    amount: { $multiply: ['$cartItems.price', '$cartItems.quantity'] },
                    status: '$status', // ✅ Now using top-level status
                    createdAt: 1,
                    _id: 0
                }
            }
        ]);

        // Additional order statuses
        const pendingOrders = await Order.countDocuments({
            'cartItems.seller': vendorId,
            status: 'pending'
        });

        const processingOrders = await Order.countDocuments({
            'cartItems.seller': vendorId,
            status: 'processing'
        });

        const response = {
            totalRevenue,
            totalOrders,
            completedOrders,
            pendingOrders,
            processingOrders,
            newCustomers,
            popularProducts,
            salesTrend,
            recentOrders,
            debug: {
                vendorId: vendorId.toString(),
                message: 'Using top-level "status" instead of "paymentDetails.status"'
            }
        };

        console.log('Analytics response:', response);
        res.json(response);

    } catch (error) {
        console.error("Error in /api/vendor/analytics:", error);
        res.status(500).json({ error: 'Server Error', details: error.message });
    }
});

module.exports = router;
