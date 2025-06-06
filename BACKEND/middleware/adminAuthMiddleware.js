// middleware/adminAuthMiddleware.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.protectAdmin = async (req, res, next) => {
  try {
    // 1. Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find admin
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // 4. Attach admin to request
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin.permissions.includes(permission) && !req.admin.isSuperAdmin) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    next();
  };
};