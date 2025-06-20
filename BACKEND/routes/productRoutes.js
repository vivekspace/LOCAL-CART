// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor.js');
const Product = require('../models/Product.js'); // Make sure Product is imported here
// Destructure all needed controller functions for clarity
const {
    getAllProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');

const { protectVendor } = require('../middleware/vendorAuth'); // For vendor-specific actions
const { protectAdmin } = require('../middleware/adminAuthMiddleware'); // For admin-specific actions

const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});


router.post('/vendor', protectVendor, upload.array('productImages', 10), createProduct); 
router.patch('/vendor/:id', protectVendor, upload.array('productImages', 10), updateProduct); 
router.delete('/vendor/:id', protectVendor, deleteProduct); 

// When this is used as part of /api/admin/products
router.get('/admin', protectAdmin, getAllProducts); 
router.get('/admin/:id', protectAdmin, getProductById); 
router.patch('/admin/:id', protectAdmin, upload.array('productImages', 10), updateProduct); 
router.delete('/admin/:id', protectAdmin, deleteProduct); 



router.get('/nearby', async (req, res) => {
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
                    ratingsAverage: 1,
                    ratingsQuantity: 1,
                    location: 1,
                    city: '$location.city',
                    distance: { $divide: ["$distance", 1000] },
                    seller: {
                        _id: '$sellerInfo._id',
                        name: '$sellerInfo.name',
                        email: '$sellerInfo.email',
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

        if (nearbyProducts.length === 0) {
            return res.status(200).json({
                status: 'success',
                results: 0,
                message: 'No products found nearby',
                data: { products: [] }
            });
        }

        res.status(200).json({
            status: 'success',
            results: nearbyProducts.length,
            data: {
                products: nearbyProducts
            }
        });
    } catch (err) {
        console.error('Backend: Error finding nearby products:', err);
        res.status(500).json({ status: 'error', message: 'Error finding nearby products' });
    }
});

// 2. Specific static path: /api/products/locations (for unique cities)
router.get('/locations', async (req, res) => {
    console.log('--- HIT: /api/products/locations route ---');

    try {
        const uniqueCities = await Product.aggregate([
            {
                $match: {
                    'location.city': { $exists: true, $ne: null, $ne: '' },
                    'location.coordinates': { $exists: true, $ne: null, $size: 2 },
                    'location.type': 'Point'
                }
            },
            {
                $group: {
                    _id: '$location.city',
                    lat: { $first: '$location.coordinates.1' },
                    lng: { $first: '$location.coordinates.0' }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: '$_id',
                    lat: 1,
                    lng: 1,
                    type: { $literal: 'product_location' }
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);

        res.status(200).json({
            status: 'success',
            results: uniqueCities.length,
            data: {
                locations: uniqueCities
            }
        });

    } catch (err) {
        console.error('Backend: Error fetching unique product locations:', err);
        res.status(500).json({ status: 'error', message: 'Error fetching unique product locations' });
    }
});

router.get('/:id', getProductById);


router.get('/', getAllProducts);

module.exports = router;