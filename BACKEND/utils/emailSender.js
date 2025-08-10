const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
});

const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('Email transporter is ready');
        return true;
    } catch (error) {
        console.error('Email transporter verification failed:', error);
        return false;
    }
};

/**
 * Sends an email.
 * @param {string} to - Recipient email address (must be a string, not object)
 * @param {string} subject
 * @param {string} text
 * @param {string|null} html
 */
const sendEmail = async (to, subject, text, html = null) => {
    try {
        if (typeof to !== 'string') {
            throw new Error(`Invalid "to" parameter: expected string, got ${typeof to}`);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            throw new Error('Invalid email address format');
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            text,
            html: html || text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

const sendOtpEmail = async (to, otp, userName = null) => {
    const subject = 'Your Verification Code';
    const textContent = `
Hello${userName ? ` ${userName}` : ''},

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
${process.env.APP_NAME || 'Your App'} Team
    `.trim();

    const htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Verification Code</h2>
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            <p>Your verification code is:</p>
            <div style="font-size: 24px; font-weight: bold; color: #007bff;">${otp}</div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>Best regards,<br>${process.env.APP_NAME || 'Your App'} Team</p>
        </body>
        </html>
    `;

    return await sendEmail(to, subject, textContent, htmlContent);
};

module.exports = { sendEmail, sendOtpEmail, verifyConnection };
