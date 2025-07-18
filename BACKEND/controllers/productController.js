const Product = require('../models/Product');
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const sharp = require('sharp'); // Import sharp
const path = require('path'); // Import path for joining directories
const fs = require('fs'); // Import fs for file system operations (e.g., deleting old files)
const UniqueLocation = require('../models/uniqueLocation');

// Assume DEFAULT_PRODUCT_IMAGE is defined somewhere, e.g., in a config file or constants.
const DEFAULT_PRODUCT_IMAGE = 'default-product.webp';

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
    const queryObj = { ...req.query };

    // Define fields that are *not* direct Mongoose query fields but are for control (pagination, sorting)
    // or are handled separately (like 'location', 'category', 'exclude')
    // Changed 'city' to 'location' here as frontend sends 'location'
    const excludedControlFields = ['page', 'sort', 'limit', 'fields', 'location', 'category', 'exclude'];

    // Create a base filter object for Mongoose to build the query
    const filter = {};

    // --- Apply specific filters from query parameters ---

    // 1. Location Filtering (using req.query.location)
    if (req.query.location && req.query.location.toLowerCase() !== "default" && req.query.location.toLowerCase() !== "current_location") {
        const cityParam = req.query.location; // Get the city name from the 'location' query parameter
        // Use a regex that matches the city name, case-insensitive, without strict start/end anchors.
        // This will match "Navi Mumbai" in DB if param is "navi mumbai".
        // It's more forgiving for minor variations or extra spaces (though trim() on frontend is good).
        filter['location.city'] = { $regex: new RegExp(cityParam, 'i') };
    }

    // 2. Category Filtering
    if (req.query.category && req.query.category.toLowerCase() !== 'all') {
      // Use a case-insensitive regex for category matching
      filter.category = { $regex: new RegExp(req.query.category, 'i') };
    }

    // 3. Exclude Product by ID (useful for "related products" to exclude the current one)
    if (req.query.exclude) {
      // Mongoose $ne operator means "not equal"
      filter._id = { $ne: req.query.exclude };
    }
    // --- End: Apply specific filters ---


    // Remove the control and specific filter fields from queryObj so that the
    // remaining fields can be used for direct field matching (e.g., price filters)
    excludedControlFields.forEach(el => delete queryObj[el]);

    // Handle Mongoose advanced filtering operators (gte, gt, lte, lt)
    // This part is for generic filters like price ranges (e.g., ?price[gte]=10)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    const generalFilters = JSON.parse(queryStr);

    // Merge the specific filters with the general filters
    // This combines all filtering criteria into a single object for Product.find()
    Object.assign(filter, generalFilters);

    // Build the Mongoose query chain
    let query = Product.find(filter); // Use the combined 'filter' object

    // 4. Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt'); // Default sorting by creation date (newest first)
    }

    // 5. Field Limiting (selecting specific fields to return)
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      // Default fields to return. Ensure 'location' (which includes 'city') is present
      // if you need to display or use location data on the frontend for each product.
      // MODIFICATION: Explicitly include 'stock' in the default selection
      query = query.select('name price category images description seller location stock');
    }

    // 6. Pagination
    const page = req.query.page * 1 || 1; // Default to page 1
    const limit = req.query.limit * 1 || 100; // Default to 100 products per page
    const skip = (page - 1) * limit; // Calculate number of documents to skip

    query = query.skip(skip).limit(limit);

    // Count total documents matching *all* filters for accurate pagination metadata
    const totalProducts = await Product.countDocuments(filter);

    // Execute the Mongoose query
    const products = await query.lean(); // Use .lean() for faster retrieval of plain JavaScript objects

    res.status(200).json({
      status: 'success',
      results: products.length, // Number of products returned in the current page
      total: totalProducts,     // Total number of products matching the filters (across all pages)
      data: { products } // <-- CRITICAL FIX: Nest products array inside 'data' object
    });
  } catch (err) {
    // Centralized error handling
    sendErrorResponse(res, 500, 'error', 'Error fetching products', err);
  }
};

exports.createProduct = async (req, res) => {
    try {
        console.time('Product Creation Total'); // Start total timer

        // 1. Basic validation (required fields) - KEEP AS IS
        if (!req.body.name || !req.body.price || !req.body.description || !req.body.category || !req.body.city || !req.body.location) {
            return sendErrorResponse(res, 400, 'fail', 'Product name, price, description, category, city, and location are required');
        }

        // 2. Location parsing and detailed validation - KEEP AS IS
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

        // --- MODIFIED: Use req.user instead of req.vendor for seller authentication ---
        console.time('Auth & Duplicate Check');

        if (!req.user || !req.user.id) {
            sendErrorResponse(res, 401, 'fail', 'Seller not authenticated or ID not provided.');
            console.timeEnd('Auth & Duplicate Check');
            return;

        }

        // 3. Check for duplicate product (name + seller)
        const existingProduct = await Product.findOne({
            name: req.body.name,
            seller: req.user.id // Use req.user.id
        });

        if (existingProduct) {
            sendErrorResponse(res, 400, 'fail', 'You already have a product with this name');
            console.timeEnd('Auth & Duplicate Check');
            return;

        }

        // --- NEW UNIQUE LOCATION LOGIC START ---
        // This ensures the city name associated with a new product is added to UniqueLocations
        console.time('Unique Location Upsert');

        const cityToStore = String(req.body.city).trim().toLowerCase(); // Normalize the city name

        if (cityToStore) { // Ensure city is not empty after trim
            try {
                await UniqueLocation.findOneAndUpdate(
                    { location_name: cityToStore }, // Query for the normalized city name
                    { $set: { location_name: cityToStore } }, // Set or update the field
                    { upsert: true, new: true, setDefaultsOnInsert: true } // Options: create if not exists
                );
                // console.log(`Ensured unique location: '${cityToStore}'`); // Optional: for debugging
            } catch (err) {

                if (err.code === 11000) {
                    // This means another request already added it, which is fine.
                    console.warn(`City '${cityToStore}' was attempted to be added concurrently, but already exists.`);
                } else {
                    console.error(`Error adding/updating unique location '${cityToStore}':`, err.message);
                }

            }
        }
        console.timeEnd('Unique Location Upsert');

        // --- NEW UNIQUE LOCATION LOGIC END ---

        // --- NEW IMAGE PROCESSING LOGIC FOR createProduct - KEEP AS IS ---
        console.time('Image Processing');

        const processedImageNames = [];
        if (req.files && req.files.length > 0) {
            await Promise.all(req.files.map(async (file, index) => {
                const filename = `product-${Date.now()}-${index}.webp`;
                const outputPath = path.join(__dirname, '../uploads', filename);

                try {
                    await sharp(file.buffer)
                        .resize(800, 600)
                        .webp({ quality: 80 })
                        .toFile(outputPath);
                    processedImageNames.push(filename);
                } catch (sharpError) {
                    console.error(`Image processing error:`, sharpError);
                }
            }));
        }
        console.timeEnd('Image Processing');


        // Create product with processed images
        console.time('Product DB Create');

        const productData = {
            ...req.body,
            seller: req.user.id, // MODIFIED: Use req.user.id here
            location: {
                type: parsedLocation.type,
                coordinates: parsedLocation.coordinates,
                city: req.body.city // Ensure city is stored within the nested location object
            }
        };

        // Only set images if files were processed
        if (processedImageNames.length > 0) {
            productData.images = processedImageNames;
        } else {
            productData.images = [DEFAULT_PRODUCT_IMAGE];
        }

        const product = await Product.create(productData);
        console.timeEnd('Product DB Create');


        res.status(201).json({
            status: 'success',
            data: { product }
        });
        console.timeEnd('Product Creation Total'); // End total timer


    } catch (err) {
       console.timeEnd('Product Creation Total');
       // Your existing error handling - KEEP AS IS
       if (err.code === 11000) {
            return sendErrorResponse(res, 400, 'fail', 'Product with this name already exists', err);
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(el => el.message);
            return sendErrorResponse(res, 400, 'fail', `Invalid input data: ${messages.join('. ')}`, err);
        }
        sendErrorResponse(res, 400, 'error', 'Failed to create product', err);
    }
};

exports.getProductById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendErrorResponse(res, 400, 'fail', 'Invalid Product ID format');
        }
const product = await Product.findById(req.params.id)
            .populate({
                path: 'reviews', // This links to the virtual 'reviews' field in your Product schema
                populate: {
                    path: 'user',  // This links to the 'user' field within each Review document
                    select: 'name photo' // Selects specific fields from the User model
                }
            })
            .lean();
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

        // MODIFIED: Add authorization check for updating product
        const productToUpdate = await Product.findById(req.params.id);
        if (!productToUpdate) {
            return sendErrorResponse(res, 404, 'fail', 'Product not found for update');
        }

        // --- Debugging logs (you can remove these after confirming the fix) ---
        console.log('--- Authorization Check ---');
        console.log('Product ID being updated:', req.params.id);
        console.log('Product Seller ID (from DB):', productToUpdate.seller ? productToUpdate.seller.toString() : 'N/A');
        console.log('Logged-in User ID (req.user.id):', req.user ? req.user.id : 'N/A (user not found)');
        console.log('Logged-in User Role (req.user.role):', req.user ? req.user.role : 'N/A (user not found)');

        // CRITICAL FIX: Ensure both IDs are converted to string for reliable comparison
        const productSellerId = productToUpdate.seller ? productToUpdate.seller._id.toString() : null;
        const loggedInUserId = req.user ? req.user.id : null;

        console.log('Are stringified IDs matching?', productSellerId === loggedInUserId);
        console.log('Is user admin?', req.user && req.user.role === 'admin');
        console.log('---------------------------');
        // --- End Debugging logs ---


        // Ensure the user is either an admin or the actual seller of the product
        // Use the stringified IDs for comparison
        if (req.user.role !== 'admin' && productSellerId !== loggedInUserId) {
            return sendErrorResponse(res, 403, 'fail', 'You are not authorized to update this product.');
        }

        // --- NEW IMAGE PROCESSING LOGIC FOR updateProduct ---
        let newImageNames = [];
        if (req.files && req.files.length > 0) {
            // Delete old images from disk if replacing
            if (productToUpdate.images && productToUpdate.images.length > 0) {
                await Promise.all(productToUpdate.images.map(oldFilename => {
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

        // MODIFICATION: Removed .lean() here to ensure the full document is returned after update.
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the modified document rather than the original
            runValidators: true // Run Mongoose validators on update
        });


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

        // MODIFIED: Add authorization check for deleting product
        // Ensure the user is either an admin or the actual seller of the product
        if (req.user.role !== 'admin' && productToDelete.seller.toString() !== req.user.id) {
            return sendErrorResponse(res, 403, 'fail', 'You are not authorized to delete this product.');
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