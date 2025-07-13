const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const User = require('../models/User');

router.get('/users', protect, authorizeRoles('admin'), async (req, res) => {
    try {
       
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
