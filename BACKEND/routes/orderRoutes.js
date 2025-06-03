// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protectVendor } = require('../middleware/vendorAuth');


// Create new order
router.post('/', orderController.createOrder);
router.get('/vendor/orders', protectVendor,orderController.getVendorOrders )




module.exports = router;
