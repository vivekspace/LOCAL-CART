const Review = require('../models/Review');

exports.setProductUserIds = (req, res, next) => {
  // Allow nested routes (e.g., /products/:productId/reviews)
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user.id; // Get user from protected route middleware
  next();
};

exports.createReview = async (req, res) => {
    try {
        const newReview = await Review.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                review: newReview
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        let filter = {};
        if (req.params.productId) filter = { product: req.params.productId };

        const reviews = await Review.find(filter).populate('user'); // Populate user data

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: {
                reviews
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id).populate('user');
        
        if (!review) {
            return res.status(404).json({
                status: 'fail',
                message: 'No review found with that ID'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                review
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.updateReview = async (req, res) => {
    try {
        // First find the review to check ownership
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({
                status: 'fail',
                message: 'No review found with that ID'
            });
        }

        // Check if the user owns the review
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'fail',
                message: 'You can only update your own reviews'
            });
        }

        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true, // Return the updated document
                runValidators: true // Run schema validators
            }
        ).populate('user');

        res.status(200).json({
            status: 'success',
            data: {
                review: updatedReview
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({
                status: 'fail',
                message: 'No review found with that ID'
            });
        }

        // Check if the user owns the review or is an admin
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'fail',
                message: 'You can only delete your own reviews'
            });
        }

        await Review.findByIdAndDelete(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};