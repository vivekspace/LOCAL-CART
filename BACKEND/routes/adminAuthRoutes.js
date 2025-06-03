// routes/adminAuthRoutes.js
const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { protect } = require('../middleware/adminAuthMiddleware');

router.post('/login', adminAuthController.login);

// Protected routes example
router.get('/dashboard', protect, (req, res) => {
  res.json({ message: 'Admin dashboard' });
});

module.exports = router;