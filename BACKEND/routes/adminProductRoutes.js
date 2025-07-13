const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
    getAllProductsForAdmin,
    deleteProduct,
    updateProduct,
    createProduct,
    getProductByIdForAdmin
} = require("../controllers/dashboardController");

router.route('/')
    .get(protect, authorizeRoles('admin'), getAllProductsForAdmin)
    .post(protect, authorizeRoles('admin'), createProduct);

router.route('/:id')
    .get(protect, authorizeRoles('admin'), getProductByIdForAdmin)
    .patch(protect, authorizeRoles('admin'), updateProduct)
    .delete(protect, authorizeRoles('admin'), deleteProduct);

module.exports = router;
