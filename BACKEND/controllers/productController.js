// controllers/productController.js
const Product = require('../models/Product');


// Enhanced with pagination, filtering, and better error handling
exports.getAllProducts = async (req, res) => {
  try {
    // 1. Basic filtering
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
      query = query.sort('-createdAt'); // Default sorting
    }

    // 4. Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v'); // Exclude version key by default
    }

    // 5. Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // Execute query
    const products = await query.lean();

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Server Error'
    });
  }
};

// Enhanced with input validation and duplicate checking
exports.createProduct = async (req, res) => {
  try {
    // 1. Basic validation
    if (!req.body.name || !req.body.price || !req.body.description || !req.body.category) {
      return res.status(400).json({
        status: 'fail',
        message: 'Product name, price, description, and category are required'
      });
    }

    // 2. Check for duplicate product
    const existingProduct = await Product.findOne({
      name: req.body.name,
      seller: req.vendor.id
    });

    if (existingProduct) {
      return res.status(400).json({
        status: 'fail',
        message: 'You already have a product with this name'
      });
    }

    // ✅ 3. Handle uploaded images
    const imagePaths = req.files?.map(file => file.filename) || [];


    // 4. Create product with images
    const product = await Product.create({
      ...req.body,
      seller: req.vendor.id,
      images: imagePaths
    });

    // 5. Send response
    res.status(201).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (err) {
    console.error('Error creating product:', err);

    if (err.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Product with this name already exists'
      });
    }

    res.status(400).json({
      status: 'error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Invalid data'
    });
  }
};
