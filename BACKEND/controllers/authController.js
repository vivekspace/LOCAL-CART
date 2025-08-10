const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { sendOtpEmail: sendEmailUtility } = require('../utils/emailSender');

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

const createEmailTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

const sendPasswordResetEmail = async (user, resetToken) => {
    if (typeof user.email !== 'string' || !user.email) {
        console.error('Invalid email address in user object:', user);
        throw new Error('Invalid email address in user object');
    }
    const transporter = createEmailTransporter();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const mailOptions = {
        from: `"${process.env.APP_NAME || 'Your App'}" <${process.env.SMTP_EMAIL}>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
                    .content { padding: 20px; }
                    .button { display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .button:hover { background-color: #0056b3; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${user.name || 'User'},</p>
                        <p>You requested a password reset for your account. Click the button below to reset your password:</p>
                        <p style="text-align: center;">
                            <a href="${resetUrl}" class="button">Reset Password</a>
                        </p>
                        <p><strong>This link will expire in 15 minutes.</strong></p>
                        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                        <p>For security reasons, this link can only be used once.</p>
                    </div>
                    <div class="footer">
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p>${resetUrl}</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Hello ${user.name || 'User'},

            You requested a password reset for your account.

            Please click the following link to reset your password:
            ${resetUrl}

            This link will expire in 15 minutes.

            If you didn't request this password reset, please ignore this email.
            Your password will remain unchanged.
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to: ${user.email}`);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send reset email');
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    console.log("\n--- Forgot Password Request ---");
    console.log("Email requested for reset:", email);

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Please provide your email address'
        });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        console.log("Retrieved user object:", user);
        console.log("User email:", user?.email, "Type:", typeof user?.email);

        const successMessage = {
            success: true,
            message: 'If an account with that email exists, we have sent a password reset link to it.'
        };

        if (!user) {
            console.log("No user found, but returning success message for security to prevent enumeration.");
            return res.status(200).json(successMessage);
        }

        if (typeof user.email !== 'string' || !user.email) {
            console.error("Invalid email format for user:", user);
            return res.status(400).json({
                success: false,
                message: 'Invalid email address.'
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.passwordResetToken = hashedResetToken;
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        console.log("Reset token generated and saved for user:", user.email);
        console.log("Token expires at:", new Date(user.passwordResetExpires));

        try {
            await sendPasswordResetEmail(user, resetToken);
            console.log("Password reset email sent successfully");
        } catch (emailError) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            console.error("Failed to send reset email, token cleared:", emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send reset email. Please try again later.'
            });
        }

        res.status(200).json(successMessage);

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while processing reset request',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.sendOtp = async (req, res) => {
    const { email } = req.body;

    console.log("\n--- Send OTP Request ---");
    console.log("Email requested for OTP:", email);

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Please provide an email address.'
        });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        console.log("Retrieved user object:", user);
        console.log("User email:", user?.email, "Type:", typeof user?.email);

        const successMessage = {
            success: true,
            message: 'If an account with that email exists, an OTP has been sent.'
        };

        if (!user) {
            console.log("No user found for OTP request, returning generic success message.");
            return res.status(200).json(successMessage);
        }

        if (typeof user.email !== 'string' || !user.email) {
            console.error("Invalid email format for user:", user);
            return res.status(400).json({
                success: false,
                message: 'Invalid email address.'
            });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        user.otp = otpCode;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        console.log(`OTP generated and saved for ${user.email}: ${otpCode}`);
        console.log("OTP expires at:", user.otpExpires);

        // Explicitly log the arguments being passed
        const toParam = user.email;
        console.log("Preparing to send email - 'to' parameter:", toParam, "Type:", typeof toParam);
        console.log("OTP parameter:", otpCode);
        console.log("User name parameter:", user.name || 'User');

        // Call sendEmailUtility with explicit parameters
        try {
            await sendEmailUtility(toParam, otpCode, user.name || 'User');
            console.log("OTP email sent successfully to", toParam);
            return res.status(200).json(successMessage);
        } catch (emailError) {
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save({ validateBeforeSave: false });
            console.error("Failed to send OTP email:", emailError.message || emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP email. Please try again later.'
            });
        }

    } catch (err) {
        console.error('Error in sendOtp controller:', err);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while sending OTP.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: 'Please provide both email and OTP.'
        });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select('+otp +otpExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP.'
            });
        }

        // Generate reset token for password reset
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.otp = undefined;
        user.otpExpires = undefined;
        user.passwordResetToken = hashedResetToken;
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully.',
            resetToken: resetToken
        });

    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error occurred during OTP verification.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Please provide both password and password confirmation'
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Passwords do not match'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long'
        });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // --- THE ONLY CHANGE: Set plaintext password, let pre-save hook handle hashing ---
        user.password = password; // Set the new plaintext password

        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save(); // The pre-save hook in your User model will now hash 'password'

        const jwtToken = generateToken(user);

        user.lastLoginAt = new Date();
        await user.save({ validateBeforeSave: false }); // Note: This save doesn't need re-hashing, so validateBeforeSave: false is okay here

        res.status(200).json({
            success: true,
            message: 'Password reset successful',
            token: jwtToken,
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
        console.error('Reset password error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while resetting password',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.validateResetToken = async (req, res) => {
    const { token } = req.params;

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Reset token is valid',
            email: user.email
        });

    } catch (err) {
        console.error('Validate reset token error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while validating token'
        });
    }
};

exports.register = async (req, res) => {
    let { name, email, password, role } = req.body;

    if (role === 'vendor') {
        role = 'seller';
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role });

        const token = generateToken(user);
        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Auth Registration failed:', err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide both email and password'
        });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isPasswordValid = await user.matchPassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user);

        user.lastLoginAt = new Date();
        await user.save({ validateBeforeSave: false });

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
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: 'Authentication server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};
