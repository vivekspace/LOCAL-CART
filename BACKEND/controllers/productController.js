const Product = require('../models/Product');
const mongoose = require('mongoose');
const { cloudinary, deleteImage } = require('../config/cloudinary'); // Import Cloudinary utilities
const UniqueLocation = require('../models/uniqueLocation');

// Helper function for sending consistent error responses
const sendErrorResponse = (res, statusCode, status, message, error = null) => {
  console.error(`Error: ${message}`, error);
  res.status(statusCode).json({
    status: status,
    message: process.env.NODE_ENV === 'development' && error ? error.message : message
  });
};

// Enhanced with pagination, filtering, and better error handling
exports.getAllProducts = async (req, res) => {
  try {
    const queryObj = { ...req.query };

    // Define fields that are *not* direct Mongoose query fields but are for control
    const excludedControlFields = ['page', 'sort', 'limit', 'fields', 'location', 'category', 'exclude'];

    // Create a base filter object for Mongoose to build the query
    const filter = {};

    // --- Apply specific filters from query parameters ---

    // 1. Location Filtering (using req.query.location)
    if (req.query.location && req.query.location.toLowerCase() !== "default" && req.query.location.toLowerCase() !== "current_location") {
        const cityParam = req.query.location;
        filter['location.city'] = { $regex: new RegExp(cityParam, 'i') };
    }

    // 2. Category Filtering
    if (req.query.category && req.query.category.toLowerCase() !== 'all') {
      filter.category = { $regex: new RegExp(req.query.category, 'i') };
    }

    // 3. Exclude Product by ID
    if (req.query.exclude) {
      filter._id = { $ne: req.query.exclude };
    }

    // Remove the control and specific filter fields from queryObj
    excludedControlFields.forEach(el => delete queryObj[el]);

    // Handle Mongoose advanced filtering operators (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    const generalFilters = JSON.parse(queryStr);

    // Merge the specific filters with the general filters
    Object.assign(filter, generalFilters);

    // Build the Mongoose query chain
    let query = Product.find(filter);

    // 4. Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // 5. Field Limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      // UPDATED: Include mainImage in default selection for easier frontend usage
      query = query.select('name price category images mainImage description seller location stock');
    }

    // 6. Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // Count total documents matching *all* filters
    const totalProducts = await Product.countDocuments(filter);

    // Execute the Mongoose query
    const products = await query.lean();

    res.status(200).json({
      status: 'success',
      results: products.length,
      total: totalProducts,
      data: { products }
    });
  } catch (err) {
    sendErrorResponse(res, 500, 'error', 'Error fetching products', err);
  }
};

// UPDATED: Create Product with Cloudinary Upload
exports.createProduct = async (req, res) => {
    try {
        console.time('Product Creation Total');

        // 1. Basic validation
        if (!req.body.name || !req.body.price || !req.body.description || !req.body.category || !req.body.city || !req.body.location) {
            return sendErrorResponse(res, 400, 'fail', 'Product name, price, description, category, city, and location are required');
        }

        // 2. Location parsing and validation
        let parsedLocation = req.body.location;
        if (typeof parsedLocation === 'string') {
            try {
                parsedLocation = JSON.parse(req.body.location);
            } catch (err) {
                return sendErrorResponse(res, 400, 'fail', 'Invalid location format (must be valid JSON string)');
            }
        }

        if (!parsedLocation || typeof parsedLocation !== 'object' || parsedLocation.type !== 'Point' || !Array.isArray(parsedLocation.coordinates) || parsedLocation.coordinates.length !== 2) {
            return sendErrorResponse(res, 400, 'fail', 'Invalid location data. Must be a GeoJSON Point object with coordinates.');
        }

        // 3. Authentication check
        console.time('Auth & Duplicate Check');

        if (!req.user || !req.user.id) {
            sendErrorResponse(res, 401, 'fail', 'Seller not authenticated or ID not provided.');
            console.timeEnd('Auth & Duplicate Check');
            return;
        }

        // 4. Check for duplicate product
        const existingProduct = await Product.findOne({
            name: req.body.name,
            seller: req.user.id
        });

        if (existingProduct) {
            sendErrorResponse(res, 400, 'fail', 'You already have a product with this name');
            console.timeEnd('Auth & Duplicate Check');
            return;
        }

        console.timeEnd('Auth & Duplicate Check');

        // 5. Unique Location Logic
        console.time('Unique Location Upsert');

        const cityToStore = String(req.body.city).trim().toLowerCase();

        if (cityToStore) {
            try {
                await UniqueLocation.findOneAndUpdate(
                    { location_name: cityToStore },
                    { $set: { location_name: cityToStore } },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            } catch (err) {
                if (err.code === 11000) {
                    console.warn(`City '${cityToStore}' was attempted to be added concurrently, but already exists.`);
                } else {
                    console.error(`Error adding/updating unique location '${cityToStore}':`, err.message);
                }
            }
        }

        console.timeEnd('Unique Location Upsert');

        // 6. UPDATED: Cloudinary Image Processing
        console.time('Cloudinary Image Upload');

        const uploadedImages = [];

        // Check if files were uploaded via multer-cloudinary middleware
        if (req.files && req.files.length > 0) {
            // Files are already uploaded to Cloudinary via middleware
            req.files.forEach(file => {
                uploadedImages.push({
                    url: file.path, // Cloudinary URL
                    publicId: file.filename, // Cloudinary public ID
                    altText: `${req.body.name} product image`
                });
            });
        }

        console.timeEnd('Cloudinary Image Upload');

        // 7. Create product with Cloudinary images
        console.time('Product DB Create');

        const productData = {
            ...req.body,
            seller: req.user.id,
            location: {
                type: parsedLocation.type,
                coordinates: parsedLocation.coordinates,
                city: req.body.city
            }
        };

        // Set images - either uploaded images or require at least one
        if (uploadedImages.length > 0) {
            productData.images = uploadedImages;
            productData.mainImage = uploadedImages[0].url;
        } else {
            return sendErrorResponse(res, 400, 'fail', 'At least one product image is required');
        }

        const product = await Product.create(productData);
        console.timeEnd('Product DB Create');

        res.status(201).json({
            status: 'success',
            data: { product }
        });

        console.timeEnd('Product Creation Total');

    } catch (err) {
        console.timeEnd('Product Creation Total');
        
        // If product creation fails, cleanup uploaded images
        if (req.files && req.files.length > 0) {
            const cleanupPromises = req.files.map(file => deleteImage(file.filename));
            await Promise.allSettled(cleanupPromises);
        }

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
                path: 'reviews',
                populate: {
                    path: 'user',
                    select: 'name photo'
                }
            })
            .lean();

        if (!product) {
            return sendErrorResponse(res, 404, 'fail', 'Product not found');
        }

        res.status(200).json({
            status: 'success',
            data: { product }
        });
    } catch (err) {
        sendErrorResponse(res, 500, 'error', 'Error fetching product by ID', err);
    }
};

// UPDATED: Update Product with Cloudinary
exports.updateProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendErrorResponse(res, 400, 'fail', 'Invalid Product ID format');
        }

        // Handle location parsing if being updated
        if (req.body.location) {
            let parsedLocation = req.body.location;
            if (typeof parsedLocation === 'string') {
                try {
                    parsedLocation = JSON.parse(req.body.location);
                } catch (err) {
                    return sendErrorResponse(res, 400, 'fail', 'Invalid location format');
                }
            }

            if (!parsedLocation || parsedLocation.type !== 'Point' || !Array.isArray(parsedLocation.coordinates)) {
                return sendErrorResponse(res, 400, 'fail', 'Invalid location data');
            }
            req.body.location = parsedLocation;
        }

        // Authorization check
        const productToUpdate = await Product.findById(req.params.id);
        if (!productToUpdate) {
            return sendErrorResponse(res, 404, 'fail', 'Product not found for update');
        }

        const productSellerId = productToUpdate.seller ? productToUpdate.seller._id.toString() : null;
        const loggedInUserId = req.user ? req.user.id : null;

        if (req.user.role !== 'admin' && productSellerId !== loggedInUserId) {
            return sendErrorResponse(res, 403, 'fail', 'You are not authorized to update this product.');
        }

        // UPDATED: Handle new image uploads with Cloudinary
        if (req.files && req.files.length > 0) {
            // Delete old images from Cloudinary
            if (productToUpdate.images && productToUpdate.images.length > 0) {
                const deletePromises = productToUpdate.images.map(image => {
                    if (image.publicId) {
                        return deleteImage(image.publicId);
                    }
                });
                await Promise.allSettled(deletePromises);
            }

            // Process new uploaded images
            const newUploadedImages = req.files.map(file => ({
                url: file.path,
                publicId: file.filename,
                altText: `${req.body.name || productToUpdate.name} product image`
            }));

            req.body.images = newUploadedImages;
            req.body.mainImage = newUploadedImages[0].url;
        }

        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: { product }
        });

    } catch (err) {
        // Cleanup uploaded images if update fails
        if (req.files && req.files.length > 0) {
            const cleanupPromises = req.files.map(file => deleteImage(file.filename));
            await Promise.allSettled(cleanupPromises);
        }

        if (err.code === 11000) {
            return sendErrorResponse(res, 400, 'fail', 'Product with this name already exists', err);
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(el => el.message);
            return sendErrorResponse(res, 400, 'fail', `Invalid input data: ${messages.join('. ')}`, err);
        }
        sendErrorResponse(res, 400, 'error', 'Failed to update product', err);
    }
};

// UPDATED: Delete Product with Cloudinary cleanup
exports.deleteProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendErrorResponse(res, 400, 'fail', 'Invalid Product ID format');
        }

        const productToDelete = await Product.findById(req.params.id);
        if (!productToDelete) {
            return sendErrorResponse(res, 404, 'fail', 'Product not found');
        }

        // Authorization check
        if (req.user.role !== 'admin' && productToDelete.seller.toString() !== req.user.id) {
            return sendErrorResponse(res, 403, 'fail', 'You are not authorized to delete this product.');
        }

        // UPDATED: Delete images from Cloudinary
        if (productToDelete.images && productToDelete.images.length > 0) {
            const deletePromises = productToDelete.images.map(image => {
                if (image.publicId) {
                    return deleteImage(image.publicId);
                }
            });
            await Promise.allSettled(deletePromises);
            console.log(`🗑️ Deleted ${productToDelete.images.length} images from Cloudinary`);
        }

        // Delete product from database (this will also trigger the cleanup middleware)
        await Product.findByIdAndDelete(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null
        });

    } catch (err) {
        sendErrorResponse(res, 500, 'error', 'Error deleting product', err);
    }
};