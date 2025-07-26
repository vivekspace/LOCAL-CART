// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose'); // Needed for ObjectId validation

// Assume AppError is defined in a utility file. Adjust path as needed.
const AppError = require('../utils/appError'); // <--- ADD THIS LINE (or define AppError here if it's simple)


// @route   GET /api/notifications/unread
// @desc    Get unread notifications for authenticated seller
// @access  Private (Seller only)
router.get('/unread', protect, authorizeRoles('seller'), async (req, res, next) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id,
            isRead: false
        }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        console.error(err.message);
        next(new AppError('Server Error fetching unread notifications.', 500));
    }
});

// @route   GET /api/notifications/all
// @desc    Get all notifications for authenticated seller
// @access  Private (Seller only)
router.get('/all', protect, authorizeRoles('seller'), async (req, res, next) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id
        }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        console.error(err.message);
        next(new AppError('Server Error fetching all notifications.', 500));
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a specific notification as read
// @access  Private (Seller only)
router.put('/:id/read', protect, authorizeRoles('seller'), async (req, res, next) => {
    try {
        // Validate if req.params.id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return next(new AppError('Invalid notification ID format.', 400));
        }

        let notification = await Notification.findById(req.params.id);

        if (!notification) {
            return next(new AppError('Notification not found', 404));
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized to mark this notification.', 401));
        }

        notification.isRead = true;
        await notification.save();
        res.json({ msg: 'Notification marked as read' });
    } catch (err) {
        console.error(err.message);
        next(new AppError('Server Error marking notification.', 500));
    }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all unread notifications for a seller as read
// @access  Private (Seller only)
router.put('/mark-all-read', protect, authorizeRoles('seller'), async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ msg: 'All notifications marked as read' });
    } catch (err) {
        console.error(err.message);
        next(new AppError('Server Error marking all notifications.', 500));
    }
});

// --- SIMULATION ENDPOINTS (for testing purposes) ---
router.post('/simulate-order/:sellerId', async (req, res, next) => {
    try {
        const sellerId = req.params.sellerId;
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return next(new AppError('Invalid seller ID format.', 400));
        }

        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== 'seller') {
            return next(new AppError('Seller not found or user is not a seller.', 404));
        }

        const newNotification = new Notification({
            recipient: seller._id,
            type: 'order',
            title: `New Order! #${Math.floor(100000 + Math.random() * 900000)}`,
            message: `A customer just placed a new order for your product. Check details now!`,
            link: `/vendor/orders/${new Date().getTime()}`,
            isRead: false
        });
        await newNotification.save();

        // Get the Socket.IO instance from the app object
        const io = req.app.get('socketio'); // <--- KEY CHANGE HERE
        if (io) {
            io.to(seller._id.toString()).emit('newNotification', newNotification);
            console.log(`[NotificationRoutes] SUCCESS: Emitted 'newNotification' to room '${seller._id.toString()}' for simulation.`);
        } else {
            console.warn(`[NotificationRoutes] WARNING: Socket.IO instance not available for simulation.`);
        }

        res.status(201).json(newNotification);
    } catch (err) {
        console.error('Error in /simulate-order:', err.message);
        next(new AppError('Server Error during order simulation.', 500));
    }
});

router.post('/simulate-message/:sellerId', async (req, res, next) => {
    try {
        const sellerId = req.params.sellerId;
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return next(new AppError('Invalid seller ID format.', 400));
        }

        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== 'seller') {
            return next(new AppError('Seller not found or user is not a seller.', 404));
        }

        const newNotification = new Notification({
            recipient: seller._id,
            type: 'message',
            title: `New Customer Message!`,
            message: `You have a new message from a customer. Respond quickly!`,
            link: `/vendor/messages/${new Date().getTime()}`,
            isRead: false
        });
        await newNotification.save();

        const io = req.app.get('socketio'); // <--- KEY CHANGE HERE
        if (io) {
            io.to(seller._id.toString()).emit('newNotification', newNotification);
            console.log(`[NotificationRoutes] SUCCESS: Emitted 'newNotification' to room '${seller._id.toString()}' for message simulation.`);
        } else {
            console.warn(`[NotificationRoutes] WARNING: Socket.IO instance not available for message simulation.`);
        }
        res.status(201).json(newNotification);
    } catch (err) {
        console.error('Error in /simulate-message:', err.message);
        next(new AppError('Server Error during message simulation.', 500));
    }
});

router.post('/simulate-review/:sellerId', async (req, res, next) => {
    try {
        const sellerId = req.params.sellerId;
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return next(new AppError('Invalid seller ID format.', 400));
        }

        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== 'seller') {
            return next(new AppError('Seller not found or user is not a seller.', 404));
        }

        const newNotification = new Notification({
            recipient: seller._id,
            type: 'review',
            title: `New Product Review!`,
            message: `A customer just reviewed your product. See what they said!`,
            link: `/vendor/reviews/${new Date().getTime()}`,
            isRead: false
        });
        await newNotification.save();

        const io = req.app.get('socketio'); // <--- KEY CHANGE HERE
        if (io) {
            io.to(seller._id.toString()).emit('newNotification', newNotification);
            console.log(`[NotificationRoutes] SUCCESS: Emitted 'newNotification' to room '${seller._id.toString()}' for review simulation.`);
        } else {
            console.warn(`[NotificationRoutes] WARNING: Socket.IO instance not available for review simulation.`);
        }
        res.status(201).json(newNotification);
    } catch (err) {
        console.error('Error in /simulate-review:', err.message);
        next(new AppError('Server Error during review simulation.', 500));
    }
});

module.exports = router;