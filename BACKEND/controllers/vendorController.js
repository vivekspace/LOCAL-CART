const Vendor = require('../models/Vendor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vendorSecret';

exports.registerVendor = async (req, res) => {
    try {
        const { name, email, password, storeName, phone } = req.body;

        const existing = await Vendor.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const vendor = new Vendor({ name, email, password: hashedPassword, storeName, phone });
        await vendor.save();

        const token = jwt.sign({ id: vendor._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            token,
            user: {
                id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                role: 'vendor',
                storeName: vendor.storeName
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

exports.loginVendor = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const vendor = await Vendor.findOne({ email: email.toLowerCase() });
        if (!vendor) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, vendor.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: vendor._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({
            token,
            user: {  // Changed from 'vendor' to 'user' for consistency
                id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                role: 'vendor',  // Explicitly adding role
                storeName: vendor.storeName  // Add other vendor-specific fields if needed
            }
        });
    } catch (error) {
        const isDev = process.env.NODE_ENV === 'development';
        res.status(500).json({
            message: 'Login failed. Please try again later.',
            ...(isDev && { error: error.message })
        });
    }
};

