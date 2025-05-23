const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
// const { registerVendor } = require('../controllers/authController');

// router.post('/vendors/register', registerVendor); // Add this line
// router.post('/vendors/login', login); // Add this line


module.exports = router;
