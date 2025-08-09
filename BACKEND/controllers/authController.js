const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

exports.register = async (req, res) => {
    // Destructure the role from req.body.
    // If req.body.role is 'vendor', we'll map it to 'seller'.
    // Otherwise, use the role as is (e.g., 'customer', 'admin').
    let { name, email, password, role } = req.body; 

    // --- CRITICAL FIX START ---
    // Map 'vendor' role to 'seller' to match your Mongoose enum
    if (role === 'vendor') {
        role = 'seller'; // Reassign 'role' variable to 'seller'
    }
    // --- CRITICAL FIX END ---

    console.log("\n--- Auth Register Debugging ---");
    console.log("Register Request Body:", req.body); // This will still show original role from request
    console.log("Role after mapping (if 'vendor' was sent):", role); // Add this new log
    console.log("Plain password from request (before hashing):", password);
    console.log("Length of plain password (before hashing):", password ? password.length : 'N/A');
    console.log("Type of plain password (before hashing):", typeof password);

    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Create the user with the potentially modified 'role' variable
        const user = await User.create({ name, email, password, role });

        console.log("User created, password should be hashed by pre-save hook.");
        // console.log("Hashed password stored in DB (from user object after create):", user.password); // This will be undefined as 'select: false'

        const token = generateToken(user);
        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Auth Registration failed (catch block):', err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
};

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

        console.log("\n--- Backend Unified Login Debugging ---");
        console.log("   Attempting login for email:", email.toLowerCase().trim());
        console.log("   User found in DB:", user ? user.email : "None found");
        console.log("   User role in DB:", user ? user.role : "N/A");
        console.log("   Password from DB (hashed):", user ? user.password : "N/A (no user or no password field)");
        console.log("   Password from request (plain):", password);
        console.log("   Length of plain password from request:", password ? password.length : 'N/A');
        console.log("   Type of plain password from request:", typeof password);
        console.log("   Does user object have password property?", user && user.password !== undefined);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!user.password) {
            console.error(`User ${user.email} found but has no password field (even after explicit select).`);
            return res.status(500).json({ message: 'User data corrupted: Password not found.' });
        }

        // 2. Verify password using the model method
        console.log("   Calling bcrypt.compare with:");
        console.log("     - Entered password:", password);
        console.log("     - Stored hash:", user.password);
        const isPasswordValid = await user.matchPassword(password);
        console.log("   bcrypt.compare result (isPasswordValid):", isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // 3. Generate token
        const token = generateToken(user);

        // 4. Update last login timestamp
        user.lastLoginAt = new Date();
        await user.save({ validateBeforeSave: false });

        // 5. Return response
        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                lastLoginAt: user.lastLoginAt,
                photo: user.photo,
                bio: user.bio,
                addresses: user.addresses
            }
        });

    } catch (err) {
        console.error('Login error (catch block):', err);
        res.status(500).json({
            success: false,
            message: 'Authentication server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};