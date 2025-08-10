const express = require('express');
const router = express.Router();

// Import authentication controller functions
const {
    register,
    login,
    resetPassword,
    validateResetToken,
    forgotPassword,
    sendOtp,
    verifyOtp // Import the verifyOtp controller function
} = require('../controllers/authController');

// Import the sendOtpEmail function specifically from the emailSender utility
const { sendOtpEmail: sendEmailUtility } = require('../utils/emailSender');

// --- Authentication Routes ---

// Route for user registration
router.post('/register', register);

// Route for user login
router.post('/login', login);

// Route to request a password reset link
router.post('/forgot-password', forgotPassword);

// Route to reset password using a token
router.post('/reset-password/:token', resetPassword);

// Route to send a One-Time Password (OTP) email
router.post('/send-otp', sendOtp);

// Route to verify an OTP
router.post('/verify-otp', verifyOtp); // Add this route

// Route to validate a password reset token
router.get('/validate-reset-token/:token', validateResetToken);

module.exports = router;