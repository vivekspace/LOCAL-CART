const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor.js');
const Product = require('../models/Product.js');
const { redisClient } = require('../config/redis');

// Import your existing controller functions
const {
    getAllProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadMultiple, handleUploadError } = require('../middleware/uploadMiddleware');

// Cache middleware
const cache = (seconds) => async (req, res, next) => {
    const key = `${req.originalUrl}`;
    const cached = await redisClient.get(key);
    
    if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
    }
  
    res.set('X-Cache', 'MISS');
    const originalSend = res.json;
    res.json = (body) => {
        redisClient.setEx(key, seconds, JSON.stringify(body));
        originalSend.call(res, body);
    };
    next();
};

// =========================================================
// Public Routes (No authentication required)
// =========================================================

// GET /api/products - Get all products (public, with filtering)
router.get('/', getAllProducts);

// GET /api/products/nearby - Get nearby products with geolocation
router.get('/nearby', cache(300), async (req, res) => {
    console.log('--- HIT: /api/products/nearby route ---');

    const { lat, lng, distance = 10 } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ 
            status: 'fail', 
            message: 'Latitude and longitude are required for nearby product search' 
        });
    }

    const userLocation = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
    };

    if (isNaN(userLocation.coordinates[0]) || isNaN(userLocation.coordinates[1])) {
        return res.status(400).json({ 
            status: 'fail', 
            message: 'Invalid latitude or longitude provided.' 
        });
    }

    try {
        const radius = parseFloat(distance) * 1000;

        if (isNaN(radius) || radius <= 0) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'Invalid distance provided.' 
            });
        }

        const nearbyProducts = await Product.aggregate([
            {
                $geoNear: {
                    near: userLocation,
                    distanceField: 'distance',
                    maxDistance: radius,
                    spherical: true,
                }
            },
            {
                $lookup: {
                    from: Vendor.collection.name,
                    localField: 'seller',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            {
                $unwind: {
                    path: '$sellerInfo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    price: 1,
                    category: 1,
                    images: { $slice: ["$images", 1] },
                    mainImage: 1, // Include mainImage from your schema
                    description: 1,
                    stock: 1,
                    ratingsAverage: 1,
                    ratingsQuantity: 1,
                    location: 1,
                    city: '$location.city',
                    distance: { $divide: ["$distance", 1000] },
                    discount: 1,
                    isNew: 1,
                    originalPrice: 1,
                    seller: {
                        _id: '$sellerInfo._id',
                        name: '$sellerInfo.name',
                        email: '$sellerInfo.email',
                        rating: '$sellerInfo.rating',
                    },
                }
            },
            {
                $sort: { distance: 1 }
            },
            {
                $limit: 50
            }
        ]);

        // Format products to match frontend's expected structure
        const formattedProducts = nearbyProducts.map(product => ({
            _id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            images: product.images,
            mainImage: product.mainImage, // Use the mainImage field
            stock: product.stock,
            rating: product.ratingsAverage,
            reviewCount: product.ratingsQuantity,
            discount: product.discount,
            isNew: product.isNew,
            originalPrice: product.originalPrice,
            vendor: product.seller ? product.seller.name : 'Unknown Vendor',
            vendorRating: product.seller ? product.seller.rating : 0,
        }));

        if (formattedProducts.length === 0) {
            return res.status(200).json({
                status: 'success',
                results: 0,
                message: 'No products found nearby',
                data: { products: [] }
            });
        }

        res.status(200).json({
            status: 'success',
            results: formattedProducts.length,
            data: {
                products: formattedProducts
            }
        });
    } catch (err) {
        console.error('Backend: Error finding nearby products:', err);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error finding nearby products' 
        });
    }
});

// GET /api/products/:id - Get single product by ID (public)
router.get('/:id', getProductById);

// =========================================================
// Vendor/Seller Routes (Require seller authentication)
// =========================================================

// POST /api/products/vendor - Create new product (sellers only)
// Uses your existing createProduct controller with Cloudinary integration
router.post('/vendor', 
    protect, 
    authorizeRoles('seller'), 
    uploadMultiple,           // Cloudinary upload middleware for multiple images
    handleUploadError,        // Error handling middleware
    createProduct             // Your existing controller handles Cloudinary images
);

// PATCH /api/products/:id - Update product (sellers only, own products)
// Uses your existing updateProduct controller with Cloudinary integration
router.patch('/:id', 
    protect, 
    authorizeRoles('seller'), 
    uploadMultiple,           // Cloudinary upload middleware for updating images
    handleUploadError,        // Error handling middleware
    updateProduct             // Your existing controller handles Cloudinary images
);

// DELETE /api/products/vendor/:id - Delete product (sellers only, own products)
// Uses your existing deleteProduct controller with Cloudinary cleanup
router.delete('/vendor/:id', 
    protect, 
    authorizeRoles('seller'), 
    deleteProduct             // Your existing controller handles Cloudinary cleanup
);

// =========================================================
// Admin Routes (Require admin authentication)
// =========================================================

// GET /api/products/admin - Get all products (admin view)
router.get('/admin', 
    protect, 
    authorizeRoles('admin'), 
    getAllProducts
);

// GET /api/products/admin/:id - Get single product (admin view)
router.get('/admin/:id', 
    protect, 
    authorizeRoles('admin'), 
    getProductById
);

// PATCH /api/products/admin/:id - Update any product (admin only)
router.patch('/admin/:id', 
    protect, 
    authorizeRoles('admin'), 
    uploadMultiple,           // Cloudinary upload middleware
    handleUploadError,        // Error handling middleware
    updateProduct             // Your existing controller handles Cloudinary images
);

// DELETE /api/products/admin/:id - Delete any product (admin only)
router.delete('/admin/:id', 
    protect, 
    authorizeRoles('admin'), 
    deleteProduct             // Your existing controller handles Cloudinary cleanup
);

module.exports = router;