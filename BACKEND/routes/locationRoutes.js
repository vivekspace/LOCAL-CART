const express = require('express');
const router = express.Router();
const { redisClient } = require('../config/redis');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

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

/**
 * @desc Get nearby products with vendor info
 * @route GET /api/locations/nearby-products
 * @access Public
 */
router.get('/nearby-products', cache(300), async (req, res) => {
  const { lat, lng, distance = 10, limit = 50 } = req.query;

  // Validation
  if (!lat || !lng) {
    return res.status(400).json({ 
      status: 'fail', 
      message: 'Latitude and longitude are required' 
    });
  }

  try {
    const results = await Product.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: "distance",
          maxDistance: parseFloat(distance) * 1000,
          spherical: true
        }
      },
      {
        $lookup: {
          from: Vendor.collection.name,
          localField: 'seller',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          'images': { $slice: ['$images', 1] },
          distance: { $divide: ['$distance', 1000] },
          'vendor._id': 1,
          'vendor.name': 1,
          'vendor.rating': 1
        }
      },
      { $limit: parseInt(limit) },
      { $sort: { distance: 1 } }
    ]);

    res.json({
      status: 'success',
      results: results.length,
      data: { products: results },
      meta: {
        units: { distance: 'km' },
        source: 'mongodb_geoNear'
      }
    });
  } catch (err) {
    console.error('Location service error:', err);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch nearby products'
    });
  }
});

/**
 * @desc Get available service locations
 * @route GET /api/locations/service-areas
 * @access Public
 */
router.get('/service-areas', cache(3600), async (req, res) => {
  const { lat, lng, radius = 20 } = req.query;

  try {
    const pipeline = [
      {
        $group: {
          _id: '$location.city',
          coordinates: { $first: '$location.coordinates' },
          productCount: { $sum: 1 }
        }
      },
      { 
        $project: {
          _id: 0,
          city: '$_id',
          coordinates: 1,
          productCount: 1
        }
      }
    ];

    // Add geo-filter if coordinates provided
    if (lat && lng) {
      pipeline.unshift({
        $match: {
          'location.coordinates': {
            $geoWithin: {
              $centerSphere: [
                [parseFloat(lng), parseFloat(lat)],
                parseFloat(radius) / 6378.1 // Convert km to radians
              ]
            }
          }
        }
      });
    }

    const locations = await Product.aggregate(pipeline);

    res.json({
      status: 'success',
      results: locations.length,
      data: { locations },
      meta: {
        units: { radius: 'km' },
        hasGeoFilter: !!lat && !!lng
      }
    });
  } catch (err) {
    console.error('Location service error:', err);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch service areas'
    });
  }
});

module.exports = router;