const nodemailer = require('nodemailer');
require('dotenv').config();

// Re-use your existing transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_FROM || 'localcarthelp.@gmail.com', // Your LocalCart's sending email
        pass: process.env.Google_Pass // Your App Password for this email
    }
});

exports.sendContactEmail = async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Basic server-side validation
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: 'Please fill in all required fields: Name, Email, and Message.'
        });
    }

    try {
        const mailOptions = {
            from: `"LocalCart Contact Form" <${process.env.EMAIL_FROM}>`, // Your sending email
            to: process.env.CONTACT_RECEIVING_EMAIL || 'localcarthelp@gmail.com', // The email where you want to receive inquiries
            replyTo: email, // Set reply-to to the user's email
            subject: `LocalCart Contact: ${subject || 'No Subject Provided'}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #0056b3;">New Contact Form Submission</h2>
                    <p>You have received a new message from your LocalCart contact form:</p>

                    <h3 style="color: #0056b3;">Sender Details:</h3>
                    <ul>
                        <li><strong>Name:</strong> ${name}</li>
                        <li><strong>Email:</strong> ${email}</li>
                        <li><strong>Subject:</strong> ${subject || 'N/A'}</li>
                    </ul>

                    <h3 style="color: #0056b3;">Message:</h3>
                    <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
                        <p>${message.replace(/\n/g, '<br>')}</p>
                    </div>

                    <p>Please respond to the customer at ${email}.</p>
                    <p>Best regards,<br>LocalCart Contact System</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Contact form email sent successfully to:', process.env.CONTACT_RECEIVING_EMAIL || 'localcarthelp@gmail.com');
        res.status(200).json({ success: true, message: 'Your message has been sent successfully!' });

    } catch (error) {
        console.error('Error sending contact form email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send your message. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};