const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protectVendor } = require('../middleware/vendorAuth'); // Assuming this middleware exists and is correctly implemented

// All routes below are relative to the base path where this router is mounted.
// In server.js, this router is mounted at '/api/orders'.

// Get all orders (for customers)
// This will handle GET /api/orders
router.get('/', orderController.getAllOrders);

// Create new order
// This will handle POST /api/orders
router.post('/', orderController.createOrder);

// Get orders by customer email
// This will handle GET /api/orders/by-email
router.get('/by-email', orderController.getOrdersByEmail);

// Get a specific order's details by ID
// This will handle GET /api/orders/:orderId
router.get('/:orderId', orderController.getOrderDetails);

// Get orders for a specific vendor
// This will handle GET /api/orders/vendor/orders
// It requires the protectVendor middleware to ensure only authenticated vendors can access it.
router.get('/vendor/orders', protectVendor, orderController.getVendorOrders);


// Update order status
// This will handle PUT /api/orders/:orderId/status
// You might want to add authentication/authorization middleware here (e.g., protectAdmin or protectVendor)
router.put('/:orderId/status', orderController.updateOrderStatus);


module.exports = router;
