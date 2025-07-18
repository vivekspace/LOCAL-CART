const express = require('express');
const reviewController = require('../controllers/reviewController');

// --- IMPORTANT CHANGE: Import protect and restrictTo from your actual middleware file ---
const {protect , restrictTo} = require('../middleware/authMiddleware')
const router = express.Router({ mergeParams: true }); // mergeParams to get product ID from nested routes


router.use(protect); // Correctly using the imported protect function

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    restrictTo('customer'),
    reviewController.setProductUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(restrictTo('customer'), reviewController.updateReview)
  .delete(restrictTo('customer', 'admin'), reviewController.deleteReview); // Admin can also delete

module.exports = router;