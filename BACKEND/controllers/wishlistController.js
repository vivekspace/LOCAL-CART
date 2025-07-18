// controllers/wishlistController.js
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product'); // Assuming you have a Product model
const AppError = require('../utils/appError'); // Assuming you have a custom error class
const catchAsync = require('../utils/catchAsync'); // Assuming you have a catchAsync wrapper

// Middleware to protect routes (assuming you have one, e.g., from your auth setup)
// Example: const protect = require('../middleware/authMiddleware');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = catchAsync(async (req, res, next) => {
    // Find all wishlist items for the current user
    const wishlist = await Wishlist.find({ user: req.user.id }).sort('-addedAt');

    res.status(200).json({
        status: 'success',
        results: wishlist.length,
        data: {
            wishlist
        }
    });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/add
// @access  Private
exports.addWishlistItem = catchAsync(async (req, res, next) => {
    const { productId } = req.body;

    if (!productId) {
        return next(new AppError('Please provide a product ID.', 400));
    }

    // Check if product exists and get its details for denormalization
    const product = await Product.findById(productId);
    if (!product) {
        return next(new AppError('Product not found.', 404));
    }

    // Check if item already in wishlist for this user
    const existingWishlistItem = await Wishlist.findOne({ user: req.user.id, product: productId });
    if (existingWishlistItem) {
        return res.status(200).json({
            status: 'success',
            message: 'Product is already in your wishlist.',
            data: {
                wishlistItem: existingWishlistItem // Return existing item
            }
        });
    }

    // Create new wishlist item
    const newWishlistItem = await Wishlist.create({
        user: req.user.id,
        product: productId,
        productName: product.name,
        productPrice: product.discountPrice || product.price,
        productImageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined // Assuming first image
    });

    res.status(201).json({
        status: 'success',
        message: 'Product added to wishlist!',
        data: {
            wishlistItem: newWishlistItem
        }
    });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/remove/:productId
// @access  Private
exports.removeWishlistItem = catchAsync(async (req, res, next) => {
    const { productId } = req.params;

    const deletedItem = await Wishlist.findOneAndDelete({ user: req.user.id, product: productId });

    if (!deletedItem) {
        return next(new AppError('Product not found in your wishlist.', 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'Product removed from wishlist.',
        data: null
    });
});

// @desc    Clear user's entire wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private
exports.clearWishlist = catchAsync(async (req, res, next) => {
    await Wishlist.deleteMany({ user: req.user.id });

    res.status(200).json({
        status: 'success',
        message: 'Wishlist cleared successfully.',
        data: null
    });
});
