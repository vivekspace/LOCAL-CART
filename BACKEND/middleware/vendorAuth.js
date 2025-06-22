  const jwt = require('jsonwebtoken');
  const Vendor = require('../models/Vendor');

  exports.protectVendor = async (req, res, next) => {
    // 1. Get token
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.vendorToken) {
      token = req.cookies.vendorToken; // Optional: cookie fallback
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    try {
      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Role verification (will now work after controller update)
      if (decoded.role !== 'vendor') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a vendor'
        });
      }

      // 4. Vendor existence check
      const vendor = await Vendor.findById(decoded.id).select('-password');

      if (!vendor) {
        return res.status(401).json({
          success: false,
          message: 'Vendor no longer exists'
        });
      }

      // 5. Attach vendor to request
      req.vendor = vendor;
      next();
    } catch (err) {
      console.error('[AUTH ERROR]', err.message);

      // Specific error messages
      let message = 'Not authorized, token failed';
      if (err.name === 'TokenExpiredError') {
        message = 'Session expired, please login again';
      } else if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token';
      }

      res.status(401).json({
        success: false,
        message
      });
    }
  };