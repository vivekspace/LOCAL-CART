const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protectVendor } = require('../middleware/vendorAuth');

const { protectAdmin } = require('../middleware/adminAuthMiddleware')
const { protect } = require('../middleware/authMiddleware')

// Customer routes (protected)
router.get('/', protect, orderController.getCustomerOrders); // ✅ Changed to match your controller
router.post('/', protect, orderController.createOrder);
router.get('/:orderId', protect, orderController.getOrderDetails);

// Vendor routes
router.get('/vendor/orders', protectVendor, orderController.getVendorOrders);

// Admin/email lookup route (if absolutely needed)
router.get('/by-email', protectAdmin, orderController.getOrdersByEmail);

// Status update
router.put('/:orderId/status', protectVendor, orderController.updateOrderStatus);

module.exports = router;    