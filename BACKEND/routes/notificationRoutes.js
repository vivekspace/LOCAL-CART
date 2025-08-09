// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
// We only need 'protect' here to ensure the user is logged in.
// Role-based filtering for notifications (i.e., fetching only YOUR notifications)
// is handled within the controller by filtering on req.user._id.
const { protect } = require('../middleware/authMiddleware');
const {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} = require('../controllers/notificationController'); // Import the generic controller functions

// All notification routes will require authentication.
// The `protect` middleware ensures req.user is populated.
router.use(protect);

// @route   GET /api/notifications/my
// @desc    Get all notifications for the authenticated user (customer, seller, admin)
// @access  Private (Any authenticated user can access their own notifications)
router.get('/my', getMyNotifications);

// @route   PATCH /api/notifications/:notificationId/read
// @desc    Mark a specific notification as read for the authenticated user
// @access  Private (Any authenticated user can mark their own notifications as read)
// Using PATCH for partial update (changing isRead status)
// IMPORTANT: Changed from .put to .patch
router.patch('/:notificationId/read', markNotificationAsRead);

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all unread notifications for the authenticated user as read
// @access  Private (Any authenticated user can mark all their notifications as read)
// Using PATCH for partial update
// IMPORTANT: Changed from .put to .patch
router.patch('/mark-all-read', markAllNotificationsAsRead);

// @route   DELETE /api/notifications/:notificationId
// @desc    Delete a specific notification for the authenticated user
// @access  Private (Any authenticated user can delete their own notifications)
router.delete('/:notificationId', deleteNotification);

// Simulation endpoints (if you still need them) should be in a separate dev-only file or secured
// router.post('/simulate-order/:vendorId', /* ... */);
// router.post('/simulate-message/:vendorId', /* ... */);
// router.post('/simulate-review/:vendorId', /* ... */);

module.exports = router;
