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
    zipCode: {
        type: String,
        required: [true, 'ZIP Code is required'],
        trim: true,
        maxlength: [10, 'ZIP Code cannot exceed 10 characters'],
        minlength: [5, 'ZIP Code must be at least 5 characters']
    },
    // ADDED: isDefault field
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    _id: true // Good practice to explicitly set true, though often default
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
    // *** MODIFICATION HERE ***
    photo: { // Changed from 'avatar' to 'photo'
        type: String,
        default: 'default.jpg' // Changed default to a local filename, as we'll be serving locally
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        default: ''
    },
    // CRITICAL CHANGE: Ensure addresses is always an array
    addresses: {
        type: [addressSchema],
        default: [] // <<< THIS IS THE KEY CHANGE for new users / when fetching existing users without the field
    },
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);