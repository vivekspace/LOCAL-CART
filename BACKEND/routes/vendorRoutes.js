const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product'); // Add this import at the top


const {
    registerVendor,
    loginVendor,
    addProduct,
    deleteProduct,
    getVendorProducts // Make sure this is imported from your controller
} = require('../controllers/vendorController');
const { getVendorDashboard } = require('../controllers/dashboardController');
const { protectVendor } = require('../middleware/vendorAuth');
const orderController = require('../controllers/orderController');

// Vendor Auth Routes
router.post('/register', registerVendor);
router.post('/login', loginVendor);

// Product Routes
router.post('/products', protectVendor, addProduct);
router.get('/products', protectVendor, getVendorProducts); // This uses the controller
router.delete('/products/:id', protectVendor, deleteProduct);
router.get('/orders', protectVendor, orderController.getVendorOrders);

// Dashboard Route
router.get('/dashboard', protectVendor, getVendorDashboard);

// Debug Route (can remove after confirming everything works)
router.get('/debug-vendor-products', async (req, res) => {
    try {
        const products = await Product.find({
            vendor: new mongoose.Types.ObjectId("682da34e36eb5ca5fcc6ed8a")
        });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// routes/vendorRoutes.js
router.get('/analytics', protectVendor, async (req, res) => {
    try {
        // Get vendor ID from authenticated user
        const vendorId = req.user._id;

        // Calculate analytics (example - adjust based on your models)
        const totalRevenue = await Order.aggregate([
            { $match: { vendor: vendorId, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const totalOrders = await Order.countDocuments({ vendor: vendorId });

        const newCustomers = await Customer.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            vendor: vendorId
        });

        const popularProducts = await Product.aggregate([
            { $match: { vendor: vendorId } },
            { $sort: { salesCount: -1 } },
            { $limit: 5 },
            { $project: { name: 1, orders: '$salesCount' } }
        ]);

        // Sales trend data (last 30 days)
        const salesTrend = await Order.aggregate([
            {
                $match: {
                    vendor: vendorId,
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    amount: { $sum: "$totalAmount" }
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

        res.json({
            totalRevenue: totalRevenue[0]?.total || 0,
            totalOrders,
            newCustomers,
            popularProducts,
            salesTrend
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;