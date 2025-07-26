    // controllers/vendorController.js

    // Removed: const Vendor = require('../models/Vendor'); // No longer needed if unified User model is used
    const bcrypt = require('bcryptjs'); // Keep if other bcrypt operations exist here, otherwise can be removed
    const jwt = require('jsonwebtoken'); // Keep if other JWT operations exist here, otherwise can be removed
    const User = require('../models/User'); // Essential for interacting with the unified User model
    const Product = require('../models/Product'); // Assuming Product model is used for vendor products

    // Removed: const JWT_SECRET = process.env.JWT_SECRET || 'vendorSecret'; // Handled globally by authController

    // Removed: exports.registerVendor = async (req, res) => { ... }; // Moved to authController.js
    // Removed: exports.loginVendor = async (req, res) => { ... };    // Moved to authController.js

    exports.getVendorProfile = async (req, res) => {
        try {
            // req.user is populated by the protect middleware
            const vendorProfile = req.user; 
            
            // Ensure vendorProfile has the necessary fields from the unified User model
            // If 'storeName' and 'phone' are part of your User model for sellers, they will be here.
            res.json({
                success: true,
                vendor: { // Renamed to 'vendor' for frontend compatibility if needed
                    id: vendorProfile._id,
                    name: vendorProfile.name, 
                    email: vendorProfile.email,
                    storeName: vendorProfile.storeName, // Assuming storeName is on User model
                    phone: vendorProfile.phone,
                    createdAt: vendorProfile.createdAt,
                    // Add other fields as needed from the unified User model
                },
            });
        } catch (err) {
            console.error('Failed to fetch vendor profile:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch profile' });
        }
    };

    exports.addProduct = async (req, res) => {
        try {
            const { name, description, price } = req.body;

            // req.user will contain the authenticated seller's data
            console.log("req.user (seller):", req.user); // Debug log
            console.log("req.user._id (seller ID):", req.user._id); // Debug log

            const product = new Product({
                name,
                description,
                price,
                seller: req.user._id // Correctly uses req.user._id for seller
            });

            await product.save();
            console.log("Saved product with seller:", product.seller); // Debug log

            res.status(201).json({ message: 'Product added successfully', product });
        } catch (err) {
            console.error('Add Product Error:', err);
            res.status(500).json({ message: 'Failed to add product' });
        }
    };

  // controllers/vendorController.js

exports.getVendorProducts = async (req, res) => {
    try {
        console.log('--- Inside getVendorProducts ---');
        console.log('Request received for /api/vendor/products');

        // Check if req.user exists and what it contains
        console.log('req.user object:', req.user);

        // Check the specific _id from req.user
        if (req.user && req.user._id) {
            console.log('Authenticated Seller ID (req.user._id):', req.user._id.toString());
        } else {
            console.log('WARNING: req.user or req.user._id is not available!');
        }

        // Add a check before querying to handle cases where req.user might be missing
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: 'Not authorized: User information missing.' });
        }

        // Filter products by the authenticated seller's ID
        const products = await Product.find({ seller: req.user._id });

        console.log(`Query successful. Found ${products.length} products for seller ID: ${req.user._id.toString()}`);
        // Optionally, log the first few product sellers to verify
        if (products.length > 0) {
            console.log('Seller ID of first product found:', products[0].seller ? products[0].seller.toString() : 'N/A');
        }

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Error fetching vendor products:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

    exports.deleteProduct = async (req, res) => {
        try {
            // Add a check to ensure the seller can only delete their own products
            const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id }); // Correctly ensures seller owns product
            if (!product) {
                return res.status(404).json({ message: 'Product not found or you do not have permission to delete this product.' });
            }
            res.status(200).json({ message: 'Product deleted successfully' });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ message: error.message });
        }
    };
