const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Import protect directly from the middleware file

const router = express.Router();

// Apply the protect middleware to all routes in this router
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
    .put(userController.updateAddress) // This is for general updates to an address
    .delete(userController.deleteAddress);

// NEW ROUTE FOR SETTING DEFAULT ADDRESS
router.patch('/me/addresses/:addressId/default', userController.setAsDefaultAddress); // <--- ADD THIS LINE

module.exports = router;