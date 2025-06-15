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
        firstname: String, // From user's provided schema
        lastname: String,  // From user's provided schema
        email: { type: String, required: true },
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
            enum: ['pending', 'completed', 'failed', 'processing', 'shipped'],
            required: true, // Should always have a status
            default: 'pending'
        },
        amount: { type: Number, required: true },
        transactionId: String,
        last4: String, // Added if you save last 4 digits of card
        paidAt: Date // Added to store when payment was successful
    },
    // ADDED SHIPPING ADDRESS SCHEMA DEFINITION
    shippingAddress: {
        name: { type: String }, // Optional: If you want to store recipient name
        street: { type: String, required: true }, // Mapped from frontend's addressLine1
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true }, // Mapped from frontend's pincode
        country: { type: String, required: true, default: 'India' },
    },

    // Add these fields if your backend calculations and frontend data include them
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }, // Represents the final total

    // REMOVED top-level 'status' field to avoid redundancy with paymentDetails.status
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
orderSchema.statics.updateStatus = async function(orderId, newStatus) {
    try {
        // Find the order by its _id (MongoDB's default unique identifier)
        // Frontend sends selectedOrder._id, which is the MongoDB document _id
        const order = await this.findById(orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        // Validate the newStatus against the enum defined in the schema
        const allowedStatuses = orderSchema.path('paymentDetails.status').enumValues;
        if (!allowedStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}. Allowed statuses are: ${allowedStatuses.join(', ')}`);
        }

        // Update the paymentDetails.status
        order.paymentDetails.status = newStatus;

        // Save the updated order
        await order.save();

        console.log(`Order ${orderId} status updated to: ${newStatus}`);
        return order; // Return the updated order document
    } catch (error) {
        console.error("Error in Order.updateStatus:", error);
        throw error; // Re-throw the error for the calling function to handle
    }
};
// --- END STATIC METHOD ADDITION ---

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;