// routes/adminAuthRoutes.js
const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const Vendor = require('../models/Vendor'); 
const { getAllUsersForAdmin } = require('../controllers/dashboardController');
const {getUserByIdForAdmin , getAllProductsForAdmin , createProduct , getProductByIdForAdmin , updateProduct , deleteProduct} = require('../controllers/dashboardController')



router.post('/login', adminAuthController.login);

// Protected routes example
router.get('/dashboard', protectAdmin, (req, res) => {
  res.json({ message: 'Admin dashboard' });
});

router.get('/vendors', protectAdmin, async (req, res) => {
    try {
        const vendors = await Vendor.find({}); // Example: Fetching all vendors from a Mongoose model


        // Send the fetched vendors as a JSON response
        res.status(200).json({ success: true, vendors });
    } catch (error) {
        console.error("Error fetching vendors from backend:", error);
        res.status(500).json({ success: false, message: "Server error fetching vendors" });
    }
});

router.get('/users', protectAdmin, getAllUsersForAdmin);
router.get('/users/:id', protectAdmin, getUserByIdForAdmin);




module.exports = router;