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
router.put('/orders/:orderId/status', 
    protectVendor,
    async (req, res) => {
        try {
            const { orderId } = req.params;
            const { status } = req.body;

            // Update logic here
            // Assuming Order.updateStatus correctly updates based on orderId and newStatus
            const updatedOrder = await Order.updateStatus(orderId, status);

            res.json(updatedOrder);
        } catch (error) {
            console.error("Error updating order status:", error); // Added console.error for debugging
            res.status(500).json({ error: error.message });
        }
    }
);

// Dashboard Route (Correct path relative to '/api/vendor' prefix)
router.get('/dashboard', protectVendor, getVendorDashboard);

// Analytics Route (Correct path relative to '/api/vendor' prefix)
router.get('/analytics', protectVendor, async (req, res) => {
    try {
        const vendorId = req.vendor._id;

        // Since seller is in cartItems, we need to match orders that have items from this vendor
        const totalRevenueResult = await Order.aggregate([
            { $match: { 'cartItems.seller': vendorId, 'paymentDetails.status': 'completed' } },
            { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        // Count total orders that contain items from this vendor
        const totalOrders = await Order.countDocuments({ 'cartItems.seller': vendorId });

        // Count completed orders that contain items from this vendor
        const completedOrders = await Order.countDocuments({
            'cartItems.seller': vendorId,
            'paymentDetails.status': 'completed'
        });

        // New customers in last 30 days (This queries all customers, not just vendor-specific customers)
        // If you need vendor-specific customers, your Customer model or Order model needs to link customers to vendors.
        const newCustomers = await Customer.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // Popular products - aggregate from cartItems for this vendor
        const popularProducts = await Order.aggregate([
            { $unwind: '$cartItems' },
            { $match: { 'cartItems.seller': vendorId } },
            {
                $group: {
                    _id: '$cartItems.productId',
                    name: { $first: '$cartItems.name' },
                    totalQuantity: { $sum: '$cartItems.quantity' },
                    orders: { $sum: 1 } // Sum of orders where this product appears
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            {
                $project: {
                    name: 1,
                    orders: '$totalQuantity', // Renaming totalQuantity to orders for response consistency
                    _id: 0
                }
            }
        ]);

        // Sales trend data (last 30 days) - only for this vendor's items
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
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    amount: { $sum: { $multiply: ['$cartItems.price', '$cartItems.quantity'] } }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: "$_id",
                    amount: 1,
                    _id: 0
                }
            }
        ]);

        // Recent orders (last 5) - adjusted to match `cartItems.seller`
        const recentOrders = await Order.aggregate([
            { $unwind: '$cartItems' }, // Deconstruct cartItems array
            { $match: { 'cartItems.seller': vendorId } }, // Filter by this vendor's items
            { $sort: { createdAt: -1 } }, // Sort by most recent
            
            { $limit: 5 },
            {
                $project: {
                    orderId: '$_id', // The original order _id
                    customerName: {
                        $concat: ['$customerDetails.firstname', ' ', '$customerDetails.lastname']
                    },
                    itemName: '$cartItems.name',
                    quantity: '$cartItems.quantity',
                    amount: { $multiply: ['$cartItems.price', '$cartItems.quantity'] },
                    status: '$paymentDetails.status', // Payment status of the order
                    createdAt: '$createdAt', // Order creation date
                    _id: 0
                }
            }
        ]);


        // Additional metrics
        const pendingOrders = await Order.countDocuments({
            'cartItems.seller': vendorId,
            'paymentDetails.status': 'pending'
        });

        const processingOrders = await Order.countDocuments({
            'cartItems.seller': vendorId,
            'paymentDetails.status': 'processing'
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
                message: 'Using correct field names: seller, paymentDetails.amount, paymentDetails.status'
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
