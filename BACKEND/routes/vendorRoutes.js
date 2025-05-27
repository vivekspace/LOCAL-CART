const express = require('express');
const router = express.Router();
const { registerVendor, loginVendor } = require('../controllers/vendorController');
const { addProduct } = require('../controllers/vendorController');
const { protectVendor } = require('../middleware/vendorAuth');

// POST /api/vendor/register
router.post('/register', registerVendor);

// POST /api/vendor/login
router.post('/login', loginVendor);
router.post('/products', protectVendor, addProduct);
// router.get('/dashboard', protectVendor, getDashboard);
// router.get('/profile', protectVendor, getVendorProfile);

module.exports = router;
