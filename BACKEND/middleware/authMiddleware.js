// Example: ../middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming you have a User model

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Make sure JWT_SECRET is set

      // Find user by ID from token payload and attach to req.user
      req.user = await User.findById(decoded.id).select('-password'); // Adjust 'id' to your token payload key

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to the next middleware/controller
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };