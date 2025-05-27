const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new mongoose.Schema({
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
        transactionId: String
    },
    status: { type: String, default: 'processing' },
    createdAt: { type: Date, default: Date.now }
});

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
