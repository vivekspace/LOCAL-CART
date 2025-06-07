// controllers/productController.js
const Product = require('../models/Product');
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const sharp = require('sharp'); // Import sharp
const path = require('path'); // Import path for joining directories
const fs = require('fs'); // Import fs for file system operations (e.g., deleting old files)

// Helper function for sending consistent error responses
const sendErrorResponse = (res, statusCode, status, message, error = null) => {
  console.error(`Error: ${message}`, error); // Log the full error in development
  res.status(statusCode).json({
    status: status,
    message: process.env.NODE_ENV === 'development' && error ? error.message : message
  });
};

// Enhanced with pagination, filtering, and better error handling
exports.getAllProducts = async (req, res) => {
  try {
    // 1. Basic filtering (e.g., category, name)
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 2. Advanced filtering (for price ranges, etc.)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

    // 3. Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt'); // Default sorting by creation date (newest first)
    }

    // 4. Field limiting (for performance and data transfer size)
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      // Default fields to return for a list view (e.g., homepage, category page)
      // Including location and city is crucial for frontend filtering/display
      // FIX FOR __v ERROR: Removed -__v exclusion when mixing with inclusions.
      // If you need to explicitly exclude __v, do it as a separate .select('-__v')
      // without other fields, or handle it as a global schema option.
      query = query.select('name price category images description seller location city');
    }

    // 5. Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100; // Default limit for reasonable number of products
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // Count total documents for pagination metadata (optional but good practice)
    const totalProducts = await Product.countDocuments(JSON.parse(queryStr));


    // Execute query
    const products = await query.lean(); // Use .lean() for faster query execution

    res.status(200).json({
      status: 'success',
      results: products.length,
      total: totalProducts, // Include total count for pagination on frontend
      data: {
        products
      }
    });
  } catch (err) {
    sendErrorResponse(res, 500, 'error', 'Error fetching products', err);
  }
};

// Enhanced with input validation and duplicate checking
exports.createProduct = async (req, res) => {
  try {
    // 1. Basic validation (required fields)
    if (!req.body.name || !req.body.price || !req.body.description || !req.body.category || !req.body.city || !req.body.location) {
      return sendErrorResponse(res, 400, 'fail', 'Product name, price, description, category, city, and location are required');
    }

    // 2. Location parsing and detailed validation
    let parsedLocation = req.body.location;
    if (typeof parsedLocation === 'string') {
      try {
        parsedLocation = JSON.parse(req.body.location);
      } catch (err) {
        return sendErrorResponse(res, 400, 'fail', 'Invalid location format (must be valid JSON string)');
      }
    }

    // Ensure parsedLocation is an object with expected GeoJSON Point structure
    if (!parsedLocation || typeof parsedLocation !== 'object' || parsedLocation.type !== 'Point' || !Array.isArray(parsedLocation.coordinates) || parsedLocation.coordinates.length !== 2 || typeof parsedLocation.coordinates[0] !== 'number' || typeof parsedLocation.coordinates[1] !== 'number') {
      return sendErrorResponse(res, 400, 'fail', 'Invalid location data. Must be a GeoJSON Point object with "type":"Point" and "coordinates":[longitude, latitude] as numbers.');
    }

    // 3. Check for duplicate product (name + seller)
    // Assuming req.vendor.id is set by a middleware (e.g., authentication)
    if (!req.vendor || !req.vendor.id) {
      return sendErrorResponse(res, 401, 'fail', 'Seller not authenticated or ID not provided.');
    }
    const existingProduct = await Product.findOne({
      name: req.body.name,
      seller: req.vendor.id
    });

    if (existingProduct) {
      return sendErrorResponse(res, 400, 'fail', 'You already have a product with this name');
    }

    // --- NEW IMAGE PROCESSING LOGIC FOR createProduct ---
    const processedImageNames = [];
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(async (file, index) => {
        // Generate a unique filename with .webp extension
        const filename = `productImages-${Date.now()}-${index}.webp`;
        const outputPath = path.join(__dirname, '../uploads', filename); // Path to save the processed image

        try {
          // Process image using sharp: resize and convert to webp
          await sharp(file.buffer) // Multer's memoryStorage gives us file.buffer
            .resize(800, 600, { // Example: Resize to max 800x600, maintain aspect ratio
              fit: sharp.fit.inside,
              withoutEnlargement: true
            })
            .webp({ quality: 80 }) // Convert to webp with 80% quality
            .toFile(outputPath); // Save the processed image

          processedImageNames.push(filename); // Store the new webp filename in array
        } catch (sharpError) {
          console.error(`Sharp image processing error for file ${file.originalname}:`, sharpError);
          // Decide how to handle: skip this image, or throw error and fail product creation
          // For now, it will just log the error and not add this specific image
          // to processedImageNames if processing fails.
        }
      }));
    }
    // --- END NEW IMAGE PROCESSING LOGIC ---

    // 5. Create product
    const product = await Product.create({
      ...req.body,
      seller: req.vendor.id, // Ensure seller ID is correctly assigned
      images: processedImageNames, // Store the new .webp filenames
      location: parsedLocation, // Use the validated and parsed location
      city: req.body.city // Ensure city is passed
    });

    // 6. Send response
    res.status(201).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (err) {
    if (err.code === 11000) { // MongoDB duplicate key error
      return sendErrorResponse(res, 400, 'fail', 'Product with this name already exists', err);
    }
    // Mongoose validation errors will also be caught here
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(el => el.message);
      return sendErrorResponse(res, 400, 'fail', `Invalid input data: ${messages.join('. ')}`, err);
    }
    sendErrorResponse(res, 400, 'error', 'Failed to create product', err);
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendErrorResponse(res, 400, 'fail', 'Invalid Product ID format');
    }
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return sendErrorResponse(res, 404, 'fail', 'Product not found');
    }

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (err) {
    sendErrorResponse(res, 500, 'error', 'Error fetching product by ID', err);
  }
};

// PATCH /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendErrorResponse(res, 400, 'fail', 'Invalid Product ID format');
    }

    // Handle location parsing and validation if it's being updated
    if (req.body.location) {
      let parsedLocation = req.body.location;
      if (typeof parsedLocation === 'string') {
        try {
          parsedLocation = JSON.parse(req.body.location);
        } catch (err) {
          return sendErrorResponse(res, 400, 'fail', 'Invalid location format (must be valid JSON string)');
        }
      }

      if (!parsedLocation || typeof parsedLocation !== 'object' || parsedLocation.type !== 'Point' || !Array.isArray(parsedLocation.coordinates) || parsedLocation.coordinates.length !== 2 || typeof parsedLocation.coordinates[0] !== 'number' || typeof parsedLocation.coordinates[1] !== 'number') {
        return sendErrorResponse(res, 400, 'fail', 'Invalid location data. Must be a GeoJSON Point object with "type":"Point" and "coordinates":[longitude, latitude] as numbers.');
      }
      req.body.location = parsedLocation; // Assign validated object back
    }

    // --- NEW IMAGE PROCESSING LOGIC FOR updateProduct ---
    let newImageNames = [];
    if (req.files && req.files.length > 0) {
      // Fetch the existing product to get current images (if replacing/appending)
      const existingProduct = await Product.findById(req.params.id);
      if (!existingProduct) {
        return sendErrorResponse(res, 404, 'fail', 'Product not found for image update');
      }

      // Decide if you want to replace all old images or append.
      // For simplicity here, we'll replace them if new files are provided.
      // If appending, you'd do: newImageNames = [...existingProduct.images];

      // Delete old images from disk if replacing
      if (existingProduct.images && existingProduct.images.length > 0) {
        await Promise.all(existingProduct.images.map(oldFilename => {
          const oldImagePath = path.join(__dirname, '../uploads', oldFilename);
          return new Promise(resolve => {
            fs.unlink(oldImagePath, (err) => {
              if (err && err.code !== 'ENOENT') { // ENOENT means file not found, which is fine if it was already deleted
                console.error(`Error deleting old image file ${oldFilename}:`, err);
              }
              resolve(); // Resolve anyway to not block the Promise.all
            });
          });
        }));
      }

      await Promise.all(req.files.map(async (file, index) => {
        const filename = `productImages-${Date.now()}-updated-${index}.webp`; // Unique name for updated images
        const outputPath = path.join(__dirname, '../uploads', filename);

        try {
          await sharp(file.buffer)
            .resize(800, 600, {
              fit: sharp.fit.inside,
              withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(outputPath);

          newImageNames.push(filename);
        } catch (sharpError) {
          console.error(`Sharp image processing error for updated file ${file.originalname}:`, sharpError);
        }
      }));
      req.body.images = newImageNames; // Update images array in req.body
    }
    // --- END NEW IMAGE PROCESSING LOGIC ---

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Return the modified document rather than the original
      runValidators: true // Run Mongoose validators on update
    }).lean();

    if (!product) {
      return sendErrorResponse(res, 404, 'fail', 'Product not found');
    }

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (err) {
    if (err.code === 11000) { // MongoDB duplicate key error
      return sendErrorResponse(res, 400, 'fail', 'Product with this name already exists', err);
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(el => el.message);
      return sendErrorResponse(res, 400, 'fail', `Invalid input data: ${messages.join('. ')}`, err);
    }
    sendErrorResponse(res, 400, 'error', 'Failed to update product', err);
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendErrorResponse(res, 400, 'fail', 'Invalid Product ID format');
    }

    const productToDelete = await Product.findById(req.params.id);
    if (!productToDelete) {
      return sendErrorResponse(res, 404, 'fail', 'Product not found');
    }

    // Delete associated images from disk
    if (productToDelete.images && productToDelete.images.length > 0) {
      await Promise.all(productToDelete.images.map(filename => {
        const imagePath = path.join(__dirname, '../uploads', filename);
        return new Promise(resolve => {
          fs.unlink(imagePath, (err) => {
            if (err && err.code !== 'ENOENT') { // ENOENT means file not found, which is fine
              console.error(`Error deleting image file ${filename}:`, err);
            }
            resolve(); // Resolve anyway to not block the Promise.all
          });
        });
      }));
    }

    // Delete product from database
    const product = await Product.findByIdAndDelete(req.params.id);


    res.status(204).json({ // 204 No Content for successful deletion
      status: 'success',
      data: null
    });
  } catch (err) {
    sendErrorResponse(res, 500, 'error', 'Error deleting product', err);
  }
};

// GET /api/products/nearby?lat=19.12&lng=72.84&distance=10
exports.getNearbyProducts = async (req, res) => {
  const { lat, lng, distance = 10 } = req.query; // distance in kilometers

  if (!lat || !lng) {
    return sendErrorResponse(res, 400, 'fail', 'Latitude and longitude are required for nearby product search');
  }

  const userLocation = {
    type: 'Point',
    coordinates: [parseFloat(lng), parseFloat(lat)] // MongoDB expects [longitude, latitude]
  };

  if (isNaN(userLocation.coordinates[0]) || isNaN(userLocation.coordinates[1])) {
    return sendErrorResponse(res, 400, 'fail', 'Invalid latitude or longitude provided.');
  }

  try {
    const radius = distance * 1000; // Convert km to meters for $geoNear maxDistance

    const nearbyProducts = await Product.aggregate([
      {
        $geoNear: {
          near: userLocation,
          distanceField: 'distance', // Output field with calculated distance in meters
          maxDistance: radius,
          spherical: true, // Use spherical geometry for Earth-like distances
          // Optional: query can be added here to filter before geoNear
          // query: { category: 'Fruits' }
        }
      },
      // Project to include only necessary fields and limit images
      {
        $project: {
          name: 1,
          price: 1,
          category: 1,
          images: { $slice: ["$images", 1] }, // Only get the first image for listings
          description: 1,
          seller: 1,
          location: 1,
          city: 1,
          distance: { $divide: ["$distance", 1000] }, // Convert distance to km for frontend
          // __v: 0 // Exclude version key - this will now automatically be excluded because of the $project stage.
        }
      },
      {
        $sort: { distance: 1 } // Sort by distance, closest first
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
    }

    res.status(200).json({
      status: 'success',
      results: nearbyProducts.length,
      data: {
        products: nearbyProducts
      }
    });
  } catch (err) {
    // Catch specific geo-query errors if possible, or general server error
    sendErrorResponse(res, 500, 'error', 'Error finding nearby products', err);
  }
};