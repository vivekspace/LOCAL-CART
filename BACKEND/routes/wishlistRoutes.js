// routes/wishlistRoutes.js
const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming your auth middleware

const router = express.Router();

// All wishlist routes require authentication
router.use(authMiddleware.protect); // Assuming 'protect' middleware exists and populates req.user

router
    .route('/')
    .get(wishlistController.getWishlist); // Get user's wishlist

router
    .route('/add')
    .post(wishlistController.addWishlistItem); // Add a product to wishlist

router
    .route('/remove/:productId') // Use productId as a URL parameter for removal
    .delete(wishlistController.removeWishlistItem); // Remove a product from wishlist

router
    .route('/clear')
    .delete(wishlistController.clearWishlist); // Clear entire wishlist

module.exports = router;
