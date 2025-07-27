const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// IMPORT THE AUTH CONTROLLER FOR REGISTER AND LOGIN
const authController = require('../controllers/authController');

// Import other vendor-specific controllers (non-auth related)
const {
    addProduct,
    deleteProduct,
    getVendorProducts,
    getVendorProfile
} = require('../controllers/vendorController'); // Keep only non-auth functions here

const { getVendorDashboard } = require('../controllers/dashboardController');
const orderController = require('../controllers/orderController');


// --- CRITICAL CHANGE: Point vendor register and login to authController ---
router.post('/register', authController.register); // Use the unified register function
router.post('/login', authController.login);     // Use the unified login function
// --- END CRITICAL CHANGE ---


router.use(protect, authorizeRoles('seller')); // Changed 'vendor' to 'seller' role for consistency with User model

router.get('/profile', getVendorProfile);
router.post('/products', addProduct);
router.get('/products', getVendorProducts);
router.delete('/products/:id', deleteProduct);

router.param('orderId', (req, res, next, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid order ID format'
        });
    }
    next();
});

router.get('/orders', orderController.getVendorOrders);
router.put('/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: status },
            { new: true, runValidators: true }
        );
        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, data: updatedOrder });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: 'Server Error', details: error.message });
    }
});

router.get('/dashboard', getVendorDashboard);

router.get('/analytics', async (req, res) => {
    try {
        const vendorId = req.user._id;
        const totalRevenueResult = await Order.aggregate([
            { $match: { 'cartItems.seller': vendorId, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;
        const totalOrders = await Order.countDocuments({ 'cartItems.seller': vendorId });
        const completedOrders = await Order.countDocuments({
            'cartItems.seller': vendorId,
            status: 'completed'
        });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const customersForVendor = await Order.aggregate([
            { $match: { 'cartItems.seller': vendorId, createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$customerId' } }, // Group by customerId to get unique customers
            { $count: 'newCustomersCount' } // Count the unique customer IDs
        ]);

        const newCustomers = customersForVendor[0]?.newCustomersCount || 0; // Set to 0 if no results
        const popularProducts = await Order.aggregate([
            { $unwind: '$cartItems' },
            { $match: { 'cartItems.seller': vendorId } },
            {
                $group: {
                    _id: '$cartItems.productId',
                    name: { $first: '$cartItems.name' },
                    totalQuantity: { $sum: '$cartItems.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$cartItems.price', '$cartItems.quantity'] } } // ADDED THIS LINE

                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            {
                $project: {
                    name: 1,
                    orders: '$totalQuantity',
                    revenue: `$totalRevenue`,
                    _id: 0
                }
            }
        ]);
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
                    status: '$status',
                    createdAt: 1,
                    _id: 0
                }
            }
        ]);
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
