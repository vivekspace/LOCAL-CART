const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

// Define the Address sub-schema
const addressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Address name (e.g., Home, Work) is required'],
        trim: true,
        maxlength: [50, 'Address name cannot exceed 50 characters']
    },
    street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
        maxlength: [100, 'Street address cannot exceed 100 characters']
    },
    apartment: {
        type: String,
        trim: true,
        maxlength: [50, 'Apartment/Suite details cannot exceed 50 characters']
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        maxlength: [50, 'State name cannot exceed 50 characters']
    },
    zipCode: { // Assuming you want to stick with zipCode for now as per your original working code
        type: String,
        required: [true, 'ZIP Code is required'],
        trim: true,
        maxlength: [10, 'ZIP Code cannot exceed 10 characters'],
        minlength: [5, 'ZIP Code must be at least 5 characters']
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    _id: true
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters'],
        minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: ['customer', 'seller', 'admin'],
        default: 'customer'
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        default: ''
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    addresses: {
        type: [addressSchema],
        default: []
    },
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    // --- CRITICAL DEBUGGING LOG ---
    console.log("\n--- User Model Pre-Save Hook Debugging ---");
    console.log("   Password BEFORE hashing (in pre-save hook):", this.password);
    console.log("   Length of password BEFORE hashing:", this.password ? this.password.length : 'N/A');
    console.log("   Type of password BEFORE hashing:", typeof this.password);
    // --- END CRITICAL DEBUGGING LOG ---

    this.password = await bcrypt.hash(this.password, 10);
    console.log("   Password AFTER hashing (in pre-save hook):", this.password);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
