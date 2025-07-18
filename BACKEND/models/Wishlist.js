// models/Wishlist.js
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Reference to your User model
        required: [true, 'Wishlist must belong to a user.']
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product', // Reference to your Product model
        required: [true, 'Wishlist item must have a product.'],
        unique: false // A user can have multiple items, but we'll enforce unique product per user in controller
    },
    // You might want to store some denormalized product data directly in the wishlist item
    // to avoid extra lookups when fetching the wishlist.
    // Ensure these fields are updated if the product changes (e.g., via a webhook or product update logic).
    productName: {
        type: String,
        required: [true, 'Product name is required.']
    },
    productPrice: {
        type: Number,
        required: [true, 'Product price is required.']
    },
    productImageUrl: String, // Assuming you store image URLs
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Ensure a user can only add a specific product to their wishlist once
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

// Populate product details when querying wishlist
// This will automatically fetch the full product object if you need it,
// but for the wishlist display, we're mostly using denormalized data.
wishlistSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'product',
        select: 'name price images discountPrice stock' // Select only necessary fields from Product
    });
    next();
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
