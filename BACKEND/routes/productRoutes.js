const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor.js')
// Destructure all needed controller functions for clarity
const {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct, // <-- Make sure to import updateProduct
  deleteProduct, // <-- Make sure to import deleteProduct
} = require('../controllers/productController');
const { protectVendor } = require('../middleware/vendorAuth');
const multer = require('multer');
const Product = require('../models/Product.js')

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
router.get('/nearby', async (req, res) => {
  const { lat, lng, distance = 10 } = req.query; // distance in kilometers

  // Input validation
  if (!lat || !lng) {
    return res.status(400).json({ status: 'fail', message: 'Latitude and longitude are required for nearby product search' });
    // return sendErrorResponse(res, 400, 'fail', 'Latitude and longitude are required for nearby product search');
  }

  const userLocation = {
    type: 'Point',
    coordinates: [parseFloat(lng), parseFloat(lat)] // MongoDB expects [longitude, latitude]
  };

  if (isNaN(userLocation.coordinates[0]) || isNaN(userLocation.coordinates[1])) {
    return res.status(400).json({ status: 'fail', message: 'Invalid latitude or longitude provided.' });
    // return sendErrorResponse(res, 400, 'fail', 'Invalid latitude or longitude provided.');
  }

  try {
    const radius = parseFloat(distance) * 1000; // Convert km to meters for $geoNear maxDistance

    if (isNaN(radius) || radius <= 0) {
      // Fallback to a reasonable default if distance is invalid
      // Or send an error if distance parameter is strictly required and invalid
      return res.status(400).json({ status: 'fail', message: 'Invalid distance provided.' });
    }


    const nearbyProducts = await Product.aggregate([
      {
        $geoNear: {
          near: userLocation,
          distanceField: 'distance', // Output field with calculated distance in meters
          maxDistance: radius, // Max distance in meters
          spherical: true, // Use spherical geometry for Earth-like distances
          // Optional: query can be added here to filter before geoNear (e.g., query: { category: 'Fruits' })
        }
      },
      // IMPORTANT: Add a $lookup stage to populate seller details within the aggregation
      // This is necessary because Mongoose .populate() middleware doesn't run on aggregation pipelines.
      {
        $lookup: {
          from: Vendor.collection.name, // The collection name of your Vendor model (usually pluralized)
          localField: 'seller',         // Field from the 'products' collection
          foreignField: '_id',          // Field from the 'vendors' collection
          as: 'sellerInfo'              // Output array field name
        }
      },
      // $unwind sellerInfo if you expect a single seller per product
      {
        $unwind: {
          path: '$sellerInfo',
          preserveNullAndEmptyArrays: true // Keep products even if sellerInfo is missing
        }
      },
      // Project to include only necessary fields and shape the output
      {
        $project: {
          _id: 1, // Include product ID
          name: 1,
          price: 1,
          category: 1,
          images: { $slice: ["$images", 1] }, // Only get the first image for listings
          description: 1,
          stock: 1,
          ratingsAverage: 1,
          ratingsQuantity: 1,
          location: 1, // Keep the full location object
          city: '$location.city', // Correctly project city from nested location object
          distance: { $divide: ["$distance", 1000] }, // Convert distance to km for frontend
          // Project specific seller fields if needed, or the whole sellerInfo object
          seller: { // Re-assign seller to include specific populated fields
            _id: '$sellerInfo._id',
            name: '$sellerInfo.name', // Assuming your Vendor model has a 'name' field
            email: '$sellerInfo.email', // Assuming your Vendor model has an 'email' field
            // Add other fields from sellerInfo that you need on the frontend
          },
          // Exclude __v if desired (it's automatically excluded if not explicitly included)
          // __v: 0
        }
      },
      {
        $sort: { distance: 1 } // Sort by distance, closest first
      },
      {
        $limit: 50 // Limit the number of results to prevent huge payloads and improve performance
        // Adjust this limit based on your UI design (e.g., 20, 100)
      }
    ]);

    // Check if any products were found before responding
    if (nearbyProducts.length === 0) {
      return res.status(200).json({ // Return 200 OK with empty array if no products found
        status: 'success',
        results: 0,
        message: 'No products found nearby',
        data: { products: [] }
      });
      // return sendErrorResponse(res, 200, 'success', 'No products found nearby', { products: [] });
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
    // return sendErrorResponse(res, 500, 'error', 'Error finding nearby products', err);
  }
});
// ✅ Public route: Get a single product by ID (place before getAllProducts to ensure specific match)
router.get('/:id', getProductById); // This was the missing piece from earlier

// ✅ Public route: Anyone can view all products (place after more specific routes)
router.get('/', getAllProducts);


module.exports = router;