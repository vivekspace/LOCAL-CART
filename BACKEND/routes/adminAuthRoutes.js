// routes/adminAuthRoutes.js
const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

router.post('/login', adminAuthController.login);

// Protected routes example
router.get('/dashboard', protectAdmin, (req, res) => {
  res.json({ message: 'Admin dashboard' });
});

module.exports = router;