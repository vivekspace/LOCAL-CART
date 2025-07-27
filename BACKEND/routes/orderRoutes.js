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

    const { protect, authorizeRoles } = require('../middleware/authMiddleware');




    router.get('/vendor/orders', protect, authorizeRoles('seller'), getVendorOrders);
    router.post('/vendor/message-customer', protect, authorizeRoles('seller'), sendOrderMessageToCustomer);
    router.put('/vendor/:orderId/status', protect, authorizeRoles('seller'), updateOrderStatus);

    router.post('/', protect, authorizeRoles('customer'), createOrder);
    router.get('/my-orders', protect, authorizeRoles('customer'), getCustomerOrders);
    router.get('/:orderId', protect, authorizeRoles('customer', 'admin', 'vendor'), getOrderDetails);

    router.get('/track/:orderId', getPublicOrderDetails);

    module.exports = router;
