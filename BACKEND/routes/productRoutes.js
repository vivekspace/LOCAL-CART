const express = require('express');
const router = express.Router();
const { getAllProducts, createProduct } = require('../controllers/productController');
const { protectVendor } = require('../middleware/vendorAuth'); // NEW middleware
const multer = require('multer');
const path = require('path'); // Import the 'path' module
const productController = require('../controllers/productController');


// Multer config - Use diskStorage for more control over filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/')); // Assuming routes folder is in '../routes' relative to root
    // Or even better, pass the absolute path from your main app.js if possible
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Preserve original file extension
  }
});

const upload = multer({
  storage: storage, // Use the custom storage configuration
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// ✅ Protected route: Only logged-in vendors can create products with images
router.post('/', protectVendor, upload.array('productImages', 10), createProduct);
router.get('/nearby', productController.getNearbyProducts);


// ✅ Public route: Anyone can view products
router.get('/', getAllProducts);

module.exports = router;