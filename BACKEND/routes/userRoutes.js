// D:\LOCALCART-WEB\BACKEND\routes\userRoutes.js

const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Import protect directly from the middleware file

const router = express.Router();


router.use(protect);

router.get('/me', userController.getMe, userController.getUser);

// Correct and comprehensive /updateMe route
router.patch(
    '/updateMe',
    userController.uploadUserPhoto, // Use multer to process the photo
    userController.resizeUserPhoto, // Optional: for image processing (recommended)
    userController.updateMe // Then update user data, including the photo path
);

// router.patch('/updateMyPassword', authController.updatePassword); // Uncomment if you have this route defined

// Address routes
router
    .route('/me/addresses')
    .get(userController.getAddresses)
    .post(userController.addAddress);

router
    .route('/me/addresses/:addressId')
    .put(userController.updateAddress) // This is for general updates to an address
    .delete(userController.deleteAddress);

// NEW ROUTE FOR SETTING DEFAULT ADDRESS
router.patch('/me/addresses/:addressId/default', userController.setAsDefaultAddress);

module.exports = router;
