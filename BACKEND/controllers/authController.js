const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  console.log(req.body)
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// In your authController.js file




exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide both email and password'
        });
    }

    try {
        // 1. Check if user exists (case-insensitive search) and explicitly select password
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // 2. Verify password using the model method
        const isPasswordValid = await user.matchPassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // 3. Generate token
        const token = generateToken(user);

        // 4. Update last login timestamp
        user.lastLogin = new Date();
        // FIX: Bypass schema validation when saving only the 'lastLogin' field
        await user.save({ validateBeforeSave: false }); // <--- ADD THIS OPTION

        // 5. Return response
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        // Ensure you're handling errors robustly, possibly using AppError if that's your pattern
        res.status(500).json({
            success: false,
            message: 'Authentication server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};


