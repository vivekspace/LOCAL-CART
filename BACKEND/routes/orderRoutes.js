// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Create new order
router.post('/', orderController.createOrder);



module.exports = router;
