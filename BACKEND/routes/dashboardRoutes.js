// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/adminAuthMiddleware'); // Use protectAdmin
const { getAdminDashboardStats } = require('../controllers/dashboardController'); // Define this in the controller

router.get('/stats', protectAdmin, getAdminDashboardStats);
// Add other admin dashboard routes here if needed (e.g., recent orders for admin view)

module.exports = router;