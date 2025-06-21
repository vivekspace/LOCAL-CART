// routes/adminAuthRoutes.js (or routes/adminUserRoutes.js)
const express = require('express');
const router = express.Router();
const { protectAdmin} = require('../middleware/adminAuthMiddleware'); // Your admin auth middleware
const User = require('../models/User'); // Make sure you have a User model
// Assuming you have a controller for getting all users, let's call it 'getAllUsers'
// If not, you might define it directly here or create a new adminController.js
const { /* other auth controllers, */ userController } = require('../controllers/adminController'); // Or your userController if it has an admin-specific function

// ... other admin authentication routes (e.g., /register, /login, /me)

// THIS IS THE MISSING ROUTE FOR FETCHING ALL USERS FOR ADMINS
// It needs to use protect and authorize middleware to ensure only authorized admins can access it.
router.get('/users', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        // Fetch all users, possibly excluding sensitive fields like password
        const users = await User.find({}).select('-password');
        res.status(200).json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error("Error fetching all users for admin:", error);
        res.status(500).json({ success: false, message: "Server error fetching users." });
    }
});

module.exports = router;