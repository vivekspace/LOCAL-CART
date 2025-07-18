const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor.js');
const Product = require('../models/Product.js');
const { redisClient } = require('../config/redis'); // Assuming redisClient is available

const {
    getAllProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Cache middleware (ensure this is available, if not, copy from app.js or a shared file)
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


// FIXED: Changed 'vendor' to 'seller' to match the role stored in database
router.post('/vendor', protect, authorizeRoles('seller'), upload.array('productImages', 10), createProduct);
router.patch('/:id', protect, authorizeRoles('seller'), upload.array('productImages', 10), updateProduct);
router.delete('/vendor/:id', protect, authorizeRoles('seller'), deleteProduct);

router.get('/admin', protect, authorizeRoles('admin'), getAllProducts);
router.get('/admin/:id', protect, authorizeRoles('admin'), getProductById);
router.patch('/admin/:id', protect, authorizeRoles('admin'), upload.array('productImages', 10), updateProduct);
router.delete('/admin/:id', protect, authorizeRoles('admin'), deleteProduct);

router.get('/nearby', cache(300), async (req, res) => { // Added cache middleware
    console.log('--- HIT: /api/products/nearby route ---');

    const { lat, lng, distance = 10 } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ status: 'fail', message: 'Latitude and longitude are required for nearby product search' });
    }

    const userLocation = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
    };

    if (isNaN(userLocation.coordinates[0]) || isNaN(userLocation.coordinates[1])) {
        return res.status(400).json({ status: 'fail', message: 'Invalid latitude or longitude provided.' });
    }

    try {
        const radius = parseFloat(distance) * 1000;

        if (isNaN(radius) || radius <= 0) {
            return res.status(400).json({ status: 'fail', message: 'Invalid distance provided.' });
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
                    description: 1,
                    stock: 1,
                    ratingsAverage: 1, // Keep original field name
                    ratingsQuantity: 1, // Keep original field name
                    location: 1,
                    city: '$location.city', // Project city from nested location
                    distance: { $divide: ["$distance", 1000] },
                    // Include other fields expected by frontend ProductCard
                    discount: 1,
                    isNew: 1,
                    originalPrice: 1,
                    seller: { // Reformat seller to match frontend expectation
                        _id: '$sellerInfo._id',
                        name: '$sellerInfo.name',
                        email: '$sellerInfo.email',
                        // Assuming Vendor model has a 'rating' field
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

        // Format products to match frontend's expected structure (similar to getAllProducts)
        const formattedProducts = nearbyProducts.map(product => ({
            _id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            images: product.images,
            stock: product.stock,
            rating: product.ratingsAverage, // Map ratingsAverage to frontend's 'rating'
            reviewCount: product.ratingsQuantity, // Map ratingsQuantity to frontend's 'reviewCount'
            discount: product.discount,
            isNew: product.isNew,
            originalPrice: product.originalPrice,
            vendor: product.seller ? product.seller.name : 'Unknown Vendor', // Use seller.name for vendor
            vendorRating: product.seller ? product.seller.rating : 0, // Use seller.rating for vendorRating
        }));


        if (formattedProducts.length === 0) {
            return res.status(200).json({
                status: 'success',
                results: 0,
                message: 'No products found nearby',
                data: { products: [] } // <-- CRITICAL FIX: Nest products array inside 'data' object
            });
        }

        res.status(200).json({
            status: 'success',
            results: formattedProducts.length,
            data: {
                products: formattedProducts // <-- CRITICAL FIX: Nest products array inside 'data' object
            }
        });
    } catch (err) {
        console.error('Backend: Error finding nearby products:', err);
        res.status(500).json({ status: 'error', message: 'Error finding nearby products' });
    }
});

// This route uses the getAllProducts from productController.js
router.get('/:id', getProductById);
router.get('/', getAllProducts); // This calls the getAllProducts from productController

module.exports = router;
