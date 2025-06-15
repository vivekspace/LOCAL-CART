const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Destructure Schema from mongoose

const orderSchema = new mongoose.Schema({
    // ADDED - Critical for security and user-specific queries
    customerId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User', // or whatever your user model is called
        index: true // Add index for better query performance
    },

    customerDetails: {
        firstname: String,
        lastname: String,
        email: { type: String, required: true }, // REQUIRED
        phone: String,
    },
    cartItems: [{
        productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        seller: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Vendor', // From user's provided schema
            validate: {
                validator: function (v) {
                    return mongoose.Types.ObjectId.isValid(v);
                },
                message: props => `${props.value} is not a valid vendor ID!`
            }
        }
    }],
    paymentDetails: {
        method: { type: String, enum: ['card', 'paypal', 'cod'], required: true }, // From user's provided schema
        // ENUM ADJUSTED: Ensure this matches frontend states (pending, completed, failed, processing, shipped)
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed'], // ✅ Correct enum for payment status
            required: true,
            default: 'pending'
        },
        amount: { type: Number, required: true },
        transactionId: String,
        last4: String, // Added if you save last 4 digits of card
        paidAt: Date // Added to store when payment was successful
    },
    // ADDED SHIPPING ADDRESS SCHEMA DEFINITION
    shippingAddress: {
        name: { type: String },
        street: { type: String, required: true }, // REQUIRED
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },     // REQUIRED
        country: { type: String, required: true, default: 'India' },
    },

    // Add these fields if your backend calculations and frontend data include them
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled', 'failed'],
        default: 'pending',
        required: true
    },
    // Represents the final total

    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps automatically
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


// --- ADDED THIS STATIC METHOD TO YOUR ORDER MODEL ---
// This method updates the status within the paymentDetails object
orderSchema.statics.updateStatus = async function (orderId, newStatus) {
    try {
        const order = await this.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        const allowedStatuses = orderSchema.path('status').enumValues;
        if (!allowedStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}. Allowed: ${allowedStatuses.join(', ')}`);
        }

        order.status = newStatus;
        await order.save();
        console.log(`Order ${orderId} status updated to: ${newStatus}`);
        return order;
    } catch (error) {
        console.error("Error in Order.updateStatus:", error);
        throw error;
    }
};

// --- END STATIC METHOD ADDITION ---

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;