    // server/utils/otpGenerator.js

    // Node.js's built-in crypto module for secure random number generation
    // This is preferred over Math.random() for security-sensitive applications like OTPs.
    const crypto = require('crypto');

    /**
     * Generates a random numeric One-Time Password (OTP) of a specified length.
     * Uses Node.js's crypto module for cryptographically strong random numbers.
     *
     * @param {number} length The desired length of the OTP (e.g., 4 or 6).
     * @returns {string} The generated OTP as a string.
     */
    const generateOtp = (length = 6) => {
        // Ensure length is a positive integer
        if (length <= 0 || !Number.isInteger(length)) {
            throw new Error('OTP length must be a positive integer.');
        }

        // Define the characters allowed in the OTP (digits 0-9)
        const digits = '0123456789';
        let otp = '';

        // Generate random digits securely
        for (let i = 0; i < length; i++) {
            // crypto.randomInt(min, max) generates a random integer between min (inclusive) and max (exclusive)
            const randomIndex = crypto.randomInt(0, digits.length);
            otp += digits[randomIndex];
        }

        return otp;
    };

    module.exports = { generateOtp };
