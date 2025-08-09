const express = require('express');
const router = express.Router();

const {
    getAllOrders,
    createOrder,
    getOrderDetails,
    updateOrderStatus,
    getPublicOrderDetails,
    getCustomerOrders,
    getVendorOrders, // This is for fetching ALL vendor orders, distinct from single order details
    getOrdersByEmail,
    sendOrderMessageToCustomer,
    getSellerOrderDetails // Import the new function
} = require('../controllers/orderController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Seller/Vendor specific routes
router.get('/vendor/orders', protect, authorizeRoles('seller', 'vendor'), getVendorOrders); // Added 'vendor' role for consistency
router.post('/vendor/message-customer', protect, authorizeRoles('seller', 'vendor'), sendOrderMessageToCustomer); // Added 'vendor' role
router.put('/vendor/:orderId/status', protect, authorizeRoles('seller', 'vendor'), updateOrderStatus); // Added 'vendor' role

// NEW ROUTE FOR SELLERS/VENDORS TO GET SINGLE ORDER DETAILS
router.get('/seller/:orderId', protect, authorizeRoles('seller', 'vendor'), getSellerOrderDetails);

// Customer specific routes
router.post('/', protect, authorizeRoles('customer'), createOrder);
router.get('/my-orders', protect, authorizeRoles('customer'), getCustomerOrders);

// General order details (now for Customer and Admin ONLY)
// FIX: Removed 'seller' and 'vendor' roles from here as they now use /seller/:orderId
router.get('/:orderId', protect, authorizeRoles('customer', 'admin'), getOrderDetails);

// Public order tracking route (no authentication required)
router.get('/track/:orderId', getPublicOrderDetails);

module.exports = router;