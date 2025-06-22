// routes/adminAuthRoutes.js
const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const Vendor = require('../models/Vendor'); 
const { getAllUsersForAdmin } = require('../controllers/dashboardController');
const {getUserByIdForAdmin , getAllProductsForAdmin , createProduct , getProductByIdForAdmin , updateProduct , deleteProduct} = require('../controllers/dashboardController') // Import additional functions


router.post('/login', adminAuthController.login);

// Protected routes example
router.get('/dashboard', protectAdmin, (req, res) => {
    res.json({ message: 'Admin dashboard' });
});

router.get('/vendors', protectAdmin, async (req, res) => {
    try {
        const vendors = await Vendor.find({}); // Example: Fetching all vendors from a Mongoose model
        res.status(200).json({ success: true, vendors });
    } catch (error) {
        console.error("Error fetching vendors from backend:", error);
        res.status(500).json({ success: false, message: "Server error fetching vendors" });
    }
});

router.get('/users', protectAdmin, getAllUsersForAdmin);
// This route will now first validate the ID, and return 400 if invalid.
// If valid, it proceeds to fetch the user.
router.get('/users/:id', protectAdmin, getUserByIdForAdmin);


// --- Product Routes (from your import, if you want them under /admin) ---
router.get('/products', protectAdmin, getAllProductsForAdmin);
router.post('/products', protectAdmin, createProduct); // Example: assuming admin can create products
router.get('/products/:id', protectAdmin, getProductByIdForAdmin);
router.patch('/products/:id', protectAdmin, updateProduct);
router.delete('/products/:id', protectAdmin, deleteProduct);


module.exports = router;
