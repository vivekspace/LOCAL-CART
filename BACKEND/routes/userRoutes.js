const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('customer'));

router.get('/me', userController.getMe, userController.getUser);

router.patch(
    '/updateMe',
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
);

router
    .route('/me/addresses')
    .get(userController.getAddresses)
    .post(userController.addAddress);

router
    .route('/me/addresses/:addressId')
    .put(userController.updateAddress)
    .delete(userController.deleteAddress);

router.patch('/me/addresses/:addressId/default', userController.setAsDefaultAddress);

module.exports = router;
