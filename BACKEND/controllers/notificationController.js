// controllers/notificationController.js
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const AppError = require('../utils/appError'); // Assuming you have an AppError utility

// @desc    Get notifications for the authenticated user
// @route   GET /api/notifications/my
// @access  Private (Any authenticated user)
exports.getMyNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        console.log(`Fetching notifications for user: ${userId}`);

        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 }) // Sort by newest first
            .lean(); // Return plain JavaScript objects for better performance

        // Count unread notifications
        const unreadCount = notifications.filter(notif => !notif.isRead).length;

        res.status(200).json({
            success: true,
            notifications: notifications,
            unreadCount: unreadCount,
            message: `Successfully fetched ${notifications.length} notifications.`
        });

    } catch (error) {
        console.error('Error fetching my notifications:', error);
        next(new AppError('Server Error fetching notifications.', 500));
    }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:notificationId/read
// @access  Private (User can only mark their own notifications as read)
exports.markNotificationAsRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return next(new AppError('Invalid notification ID format.', 400));
        }

        // MODIFIED: Removed 'isRead: false' from the query.
        // This allows the operation to succeed even if the notification is already read.
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId }, // Query now only checks ID and recipient
            { $set: { isRead: true } },
            { new: true } // Return the updated document
        );

        if (!notification) {
            // If 'notification' is null here, it means the notification was NOT FOUND for this user,
            // or the 'notificationId' was invalid, or the 'recipient' did not match 'userId'.
            return next(new AppError('Notification not found or you do not have permission to mark it as read.', 404));
        }

        // If we reach here, the notification was found and its isRead status was set to true (or already was).
        // The operation is considered successful from the backend's perspective.
        res.status(200).json({ success: true, message: 'Notification marked as read.', notification: notification });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        next(new AppError('Server Error marking notification as read.', 500));
    }
};

// @desc    Mark all notifications for the user as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private (User can only mark their own notifications as read)
exports.markAllNotificationsAsRead = async (req, res, next) => {
    try {
        const userId = req.user._id;
        console.log(`Marking all notifications as read for user: ${userId}`);

        const result = await Notification.updateMany(
            { recipient: userId, isRead: false }, // Only update unread notifications for this user
            { $set: { isRead: true } }
        );

        res.status(200).json({ success: true, message: `Marked ${result.modifiedCount} notifications as read.` });

    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        next(new AppError('Server Error marking all notifications as read.', 500));
    }
};

// @desc    Delete a single notification
// @route   DELETE /api/notifications/:notificationId
// @access  Private (User can only delete their own notifications)
exports.deleteNotification = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return next(new AppError('Invalid notification ID format.', 400));
        }

        const result = await Notification.deleteOne({ _id: notificationId, recipient: userId });

        if (result.deletedCount === 0) {
            return next(new AppError('Notification not found or you do not have permission to delete it.', 404));
        }

        res.status(200).json({ success: true, message: 'Notification deleted successfully.' });

    } catch (error) {
        console.error('Error deleting notification:', error);
        next(new AppError('Server Error deleting notification.', 500));
    }
};
