// middleware/adminAuthMiddleware.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.protectAdmin = async (req, res, next) => {
  try {
    console.log('ProtectAdmin: Request received.'); // New log
    // 1. Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('ProtectAdmin: Raw Authorization header:', req.header('Authorization')); // New log
    console.log('ProtectAdmin: Extracted Token:', token ? 'Token present' : 'No token'); // New log
    
    if (!token) {
      console.log('ProtectAdmin: Token missing. Sending 401.'); // New log
      return res.status(401).json({ message: 'Not authorized - Token missing' }); // More specific message
    }

    // 2. Verify token
    console.log('ProtectAdmin: Verifying token with secret:', process.env.JWT_SECRET); // New log
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('ProtectAdmin: Token decoded:', decoded); // New log

    // 3. Find admin
    console.log('ProtectAdmin: Finding admin by ID:', decoded.id); // New log
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      console.log('ProtectAdmin: Admin not found for decoded ID. Sending 401.'); // New log
      return res.status(401).json({ message: 'Not authorized - Admin not found' }); // More specific message
    }

    // 4. Attach admin to request
    console.log('ProtectAdmin: Admin found:', admin.email, 'Role:', admin.role); // New log
    req.admin = admin;
    next();
  } catch (err) {
    console.error('ProtectAdmin: Error during verification or lookup:', err.message); // Log the actual error message
    // Optionally differentiate between token errors and other errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Not authorized - Invalid token' });
    } else if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized - Token expired' });
    }
    res.status(401).json({ message: 'Not authorized - Server error' }); // Generic catch-all
  }
};

exports.checkPermission = (permission) => { /* ... unchanged ... */ };