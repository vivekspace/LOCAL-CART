const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email }).select("+password");
        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: admin._id, role: admin.role || "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Remove password before sending user object
        const adminData = {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role || "admin",
            isSuperAdmin: admin.isSuperAdmin,
            permissions: admin.permissions
        };

        res.status(200).json({
            success: true,
            token,
            user: adminData,
        });
    } catch (error) {
        console.error("Admin login error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
