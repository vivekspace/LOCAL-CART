const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const { getAdminDashboardStats } = require('../controllers/dashboardController');

router.get('/stats', protect, authorizeRoles('admin'), getAdminDashboardStats);

module.exports = router;
