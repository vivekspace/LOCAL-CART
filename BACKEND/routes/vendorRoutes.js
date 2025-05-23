const express = require('express');
const router = express.Router();
const { registerVendor, loginVendor } = require('../controllers/vendorController');

// POST /api/vendor/register
router.post('/register', registerVendor);

// POST /api/vendor/login
router.post('/login', loginVendor);

module.exports = router;
