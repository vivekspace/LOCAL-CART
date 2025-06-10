const express = require('express');
const userController = require('../controllers/userController');
// 🚨 CHANGE THIS LINE 🚨
const { protect } = require('../middleware/authMiddleware'); // Import protect directly from the middleware file

const router = express.Router();

// Apply the protect middleware
router.use(protect); // Use the directly imported protect function

router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
// router.patch('/updateMyPassword', authController.updatePassword);

// Address routes
router
    .route('/me/addresses')
    .get(userController.getAddresses)
    .post(userController.addAddress);

router
    .route('/me/addresses/:addressId')
    .patch(userController.updateAddress)
    .delete(userController.deleteAddress);

module.exports = router;