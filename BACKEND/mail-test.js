require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendTestEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'localcarthelp@gmail.com',
      pass: process.env.Google_Pass, // App password here
    },
  });

  try {
    const info = await transporter.sendMail({
      from: 'localcarthelp@gmail.com', // MUST match auth user
      to: 'parshya8454081477don@gmail.com',
      subject: 'Test Email from LocalCart',
      html: '<h1>Congrats u won 1lakh rupee </h1><p>Click on the following link to withdraw!</p> <a>https://localcart.com/claim-prize</a>',
    });

    console.log("Email sent! Info:");
    console.log(info);
  } catch (err) {
    console.error("Error sending test email:");
    console.error(err);
  }
}

sendTestEmail();
