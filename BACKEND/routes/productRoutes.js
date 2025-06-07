const express = require('express');
const router = express.Router();
// Destructure all needed controller functions for clarity
const {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct, // <-- Make sure to import updateProduct
  deleteProduct, // <-- Make sure to import deleteProduct
  getNearbyProducts
} = require('../controllers/productController');
const { protectVendor } = require('../middleware/vendorAuth');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(), // <--- THIS IS THE CRUCIAL CHANGE
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size limit
});
// --- END IMPORTANT MULTER CHANGE ---

// ✅ Protected route: Only logged-in vendors can create products with images
router.post('/', protectVendor, upload.array('productImages', 10), createProduct);

// ✅ Protected route: Only logged-in vendors can update products with images
// Add this line or ensure your existing PATCH route uses the upload middleware
router.patch('/:id', protectVendor, upload.array('productImages', 10), updateProduct); // <--- ADD/UPDATE THIS LINE

// ✅ Protected route: Only logged-in vendors can delete products
router.delete('/:id', protectVendor, deleteProduct); // <--- ADD THIS LINE if not present and if you added deletion logic

// ✅ Public route: Get nearby products
router.get('/nearby', getNearbyProducts);

// ✅ Public route: Get a single product by ID (place before getAllProducts to ensure specific match)
router.get('/:id', getProductById); // This was the missing piece from earlier

// ✅ Public route: Anyone can view all products (place after more specific routes)
router.get('/', getAllProducts);


module.exports = router;