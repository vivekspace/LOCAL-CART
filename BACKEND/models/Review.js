const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product', // Links to your Product model
        required: [true, 'Review must belong to a product.']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Links to your User model (seller/customer)
        required: [true, 'Review must belong to a user.']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Review must have a rating.']
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Comment cannot exceed 500 characters.']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Prevent a user from submitting multiple reviews for the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Middleware to calculate average ratings on the Product
reviewSchema.statics.calcAverageRatings = async function(productId) {
    const stats = await this.aggregate([
        {
            $match: { product: productId }
        },
        {
            $group: {
                _id: '$product',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            ratingsQuantity: 0,
            ratingsAverage: 0 // Or your default average (e.g., 4.5 for new products)
        });
    }
};

reviewSchema.post('save', async function() {
    // this points to current review
    await this.constructor.calcAverageRatings(this.product);
});

// Middleware to calculate ratings on findOneAndUpdate and findOneAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne(); // 'this' is the query object, not the document
    next();
});

reviewSchema.post(/^findOneAnd/, async function() {
    // this.r is the document found by findOneAnd...
    if (this.r) {
        await this.r.constructor.calcAverageRatings(this.r.product);
    }
});

module.exports = mongoose.model('Review', reviewSchema);