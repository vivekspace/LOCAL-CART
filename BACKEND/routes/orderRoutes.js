const express = require('express');
const router = express.Router();
const {
    getAllOrders,         
    createOrder,
    getOrderDetails,
    updateOrderStatus,
    getPublicOrderDetails,
    getCustomerOrders,
    getVendorOrders,
    getOrdersByEmail,
    sendOrderMessageToCustomer
} = require('../controllers/orderController');

const { protectVendor } = require('../middleware/vendorAuth');
const { protectAdmin } = require('../middleware/adminAuthMiddleware'); // Assuming this exists
const { protect } = require('../middleware/authMiddleware'); // Assuming this exists


router.get('/admin', protectAdmin, getAllOrders); // Corrected: Using getAllOrders directly

// Customer routes (protected)
router.get('/', protect, getCustomerOrders);
router.post('/', protect, createOrder);
router.get('/track/:orderId', getPublicOrderDetails); // Public tracking, no auth needed here

router.get('/:orderId', protect, getOrderDetails);

router.get('/vendor/orders', protectVendor, getVendorOrders);

router.post('/vendor/message-customer', protectVendor, sendOrderMessageToCustomer); 


router.get('/by-email', protectAdmin, getOrdersByEmail);

router.put('/:orderId/status', protectVendor, updateOrderStatus); // Assuming vendor updates status



module.exports = router;