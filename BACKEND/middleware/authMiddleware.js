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
      seller: req.vendor.id  // Changed from req.user.id to req.vendor.id
    });
    
    if (existingProduct) {
      return res.status(400).json({
        status: 'fail',
        message: 'You already have a product with this name'
      });
    }
    
    // 3. Create product
    const product = await Product.create({
      ...req.body,
      seller: req.vendor.id  // Changed from req.user.id to req.vendor.id
    });
    
    // 4. Send response
    res.status(201).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (err) {
    console.error('Error creating product:', err);
    
    // Handle duplicate key errors (MongoDB unique constraint)
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