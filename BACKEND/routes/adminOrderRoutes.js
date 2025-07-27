// routes/adminOrderRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const {
  getAllOrders,
  adminUpdateOrderStatus // <-- New function imported here
} = require('../controllers/orderController'); // Or adminOrderController if you split controllers

// Example: Admin can get all orders
router.get('/', protect, authorizeRoles('admin'), getAllOrders);

// THIS IS THE CRUCIAL ROUTE FOR UPDATING STATUS (now using the admin-specific function)
router.put('/:id/status', protect, authorizeRoles('admin'), adminUpdateOrderStatus); // <-- Changed from updateOrderStatus

module.exports = router;