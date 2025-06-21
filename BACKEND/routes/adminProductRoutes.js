// routes/adminProductRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController'); // Or wherever your product functions are
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const {getAllProductsForAdmin , deleteProduct , updateProduct , createProduct , getProductByIdForAdmin} = require("../controllers/dashboardController")

router.route('/') // This is the route for /api/admin/products
    .get(protectAdmin,  getAllProductsForAdmin)
    .post(protectAdmin, createProduct);

router.route('/:id') // This is the route for /api/admin/products/:id
    .get(protectAdmin,  getProductByIdForAdmin)
    .patch(protectAdmin,  updateProduct)
    .delete(protectAdmin, deleteProduct);

module.exports = router;