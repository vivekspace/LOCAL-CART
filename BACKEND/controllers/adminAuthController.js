const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select("+password");
        if (!user || user.role !== 'admin') {
            return res.status(401).json({ success: false, message: "Invalid credentials or not an admin" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
        res.status(200).json({
            success: true,
            token,
            user: userData,
        });
    } catch (error) {
        console.error("Admin login error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
