// routes/adminAuthRoutes.js
const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const Vendor = require('../models/Vendor'); // <--- ADD THIS LINE: Import your Vendor model


router.post('/login', adminAuthController.login);

// Protected routes example
router.get('/dashboard', protectAdmin, (req, res) => {
  res.json({ message: 'Admin dashboard' });
});

router.get('/vendors', protectAdmin, async (req, res) => {
    try {
        // Fetch all vendors from your database
        // Replace `Vendor.find({})` with your actual database query to get all vendors
        // Ensure your Vendor model is correctly defined and connected to your database
        const vendors = await Vendor.find({}); // Example: Fetching all vendors from a Mongoose model
                console.log("Backend sending vendors:", JSON.stringify(vendors, null, 2)); // Log the actual data


        // Send the fetched vendors as a JSON response
        res.status(200).json({ success: true, vendors });
    } catch (error) {
        console.error("Error fetching vendors from backend:", error);
        res.status(500).json({ success: false, message: "Server error fetching vendors" });
    }
});

module.exports = router;