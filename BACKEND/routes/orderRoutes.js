const express = require('express');
const router = express.Router();
// Correctly destructure functions from orderController
const {
    getAllOrders,         // <--- Ensure this is imported
    createOrder,
    getOrderDetails,
    updateOrderStatus,
    getPublicOrderDetails,
    getCustomerOrders,
    getVendorOrders,
    getOrdersByEmail
} = require('../controllers/orderController');

const { protectVendor } = require('../middleware/vendorAuth');
const { protectAdmin } = require('../middleware/adminAuthMiddleware'); // Assuming this exists
const { protect } = require('../middleware/authMiddleware'); // Assuming this exists

// Admin route to get all orders
// Make sure to apply protectAdmin middleware for this route in a real application
router.get('/admin', protectAdmin, getAllOrders); // Corrected: Using getAllOrders directly

// Customer routes (protected)
router.get('/', protect, getCustomerOrders);
router.post('/', protect, createOrder);
router.get('/track/:orderId', getPublicOrderDetails); // Public tracking, no auth needed here

router.get('/:orderId', protect, getOrderDetails);

router.get('/vendor/orders', protectVendor, getVendorOrders);

router.get('/by-email', protectAdmin, getOrdersByEmail);

router.put('/:orderId/status', protectVendor, updateOrderStatus); // Assuming vendor updates status



module.exports = router;