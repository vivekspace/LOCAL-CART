const express = require('express');
const router = express.Router();

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

// Vendor Auth Routes
router.post('/register', registerVendor);
router.post('/login', loginVendor);

// Product Routes
router.post('/products', protectVendor, addProduct);
router.get('/products', protectVendor, getVendorProducts);
router.delete('/products/:id', protectVendor, deleteProduct);
router.get('/orders', protectVendor, orderController.getVendorOrders);

// Dashboard Route
router.get('/dashboard', protectVendor, getVendorDashboard);



// routes/vendorRoutes.js
router.get('/analytics', protectVendor, async (req, res) => {
    try {
        const vendorId = req.vendor._id;
       

        // Check what sellers exist in orders
        const distinctSellers = await Order.distinct('seller');
        

        // Check if any orders exist at all
        const totalOrdersInDB = await Order.countDocuments({});

        // Try both ObjectId and string matching
        const ordersWithObjectId = await Order.countDocuments({ seller: vendorId });
        const ordersWithString = await Order.countDocuments({ seller: vendorId.toString() });
       

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

        // New customers in last 30 days
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
                    orders: { $sum: 1 }
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
                    status: '$paymentDetails.status',
                    createdAt: '$createdAt',
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