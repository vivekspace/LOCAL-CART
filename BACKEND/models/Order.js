const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new mongoose.Schema({
    // ADD THIS - Critical for security
    customerId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User', // or whatever your user model is called
        index: true // Add index for better query performance
    },

    customerDetails: {
        firstname: String,
        lastname: String,
        email: { type: String, required: true },
        phone: String
    },
    cartItems: [{
        productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        seller: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Vendor',
            validate: {
                validator: function (v) {
                    return mongoose.Types.ObjectId.isValid(v);
                },
                message: props => `${props.value} is not a valid vendor ID!`
            }
        }
    }],
    paymentDetails: {
        method: { type: String, enum: ['card', 'paypal', 'cod'], required: true },
        status: { type: String, enum: ['pending', 'paid', 'failed'], required: true },
        amount: { type: Number, required: true },
        transactionId: String,
        last4: String, // Add if you save last 4 digits of card
        paidAt: Date // Add to store when payment was successful
    },
    // <<< ADD THIS SHIPPING ADDRESS SCHEMA DEFINITION >>>
    shippingAddress: {
        name: { type: String }, // Optional: If you want to store recipient name
        street: { type: String, required: true }, // Mapped from frontend's addressLine1
        // line2: { type: String }, // Optional: If you want to store addressLine2
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true }, // Mapped from frontend's pincode
        country: { type: String, required: true, default: 'India' },
    },
    // <<< END OF ADDITION >>>

    // Add these fields if your backend calculations and frontend data include them
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }, // Represents the final total

    status: { type: String, default: 'processing' },
    createdAt: { type: Date, default: Date.now }
});

// Add compound index for better performance on user-specific queries
orderSchema.index({ customerId: 1, createdAt: -1 });

// Add pre-save hook to normalize seller IDs
orderSchema.pre('save', function (next) {
    this.cartItems = this.cartItems.map(item => {
        if (item.seller && typeof item.seller === 'object') {
            item.seller = item.seller._id || item.seller.id;
        }
        return item;
    });
    next();
});

module.exports = mongoose.model("Order", orderSchema);