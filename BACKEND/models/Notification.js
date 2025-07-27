// backend/models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: { // This will be the User's _id (vendor/seller)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the User model you provided
        required: true
    },
    type: { // 'order', 'message', 'review'
        type: String,
        required: true,
        enum: ['order', 'message', 'review', 'new-order', 'order-status-update'] 
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: { // URL path for the frontend to navigate to
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true }); // Mongoose automatically adds createdAt and updatedAt

module.exports = mongoose.model('Notification', NotificationSchema);