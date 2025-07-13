// routes/adminAuthRoutes.js
const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
// IMPORT THE NEW UNIFIED MIDDLEWARES
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Import your models and controllers as before
const Vendor = require('../models/Vendor');
const {
    getAllUsersForAdmin,
    getUserByIdForAdmin,
    getAllProductsForAdmin,
    createProduct,
    getProductByIdForAdmin,
    updateProduct,
    deleteProduct
} = require('../controllers/dashboardController'); // Import additional functions



router.post('/login', adminAuthController.login);

router.use(protect, authorizeRoles('admin'));

router.get('/dashboard', (req, res) => {
    res.json({ message: 'Admin dashboard', user: req.user.email, role: req.user.role });
});

// Protected route to fetch all vendors
router.get('/vendors', async (req, res) => {
    try {
        const vendors = await Vendor.find({}); // Assuming Vendor model is still separate for data
        res.status(200).json({ success: true, vendors });
    } catch (error) {
        console.error("Error fetching vendors from backend:", error);
        res.status(500).json({ success: false, message: "Server error fetching vendors" });
    }
});

// Protected routes for managing users
router.get('/users', getAllUsersForAdmin);
router.get('/users/:id', getUserByIdForAdmin);

// Protected Product Routes (Admin can manage all products)
router.get('/products', getAllProductsForAdmin);
router.post('/products', createProduct);
router.get('/products/:id', getProductByIdForAdmin);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);


module.exports = router;
