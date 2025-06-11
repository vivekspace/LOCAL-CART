const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

// Define the Address sub-schema
const addressSchema = new mongoose.Schema({
    name: { // Corresponds to "Address Name (e.g., Home, Work)" from your frontend form
        type: String,
        required: [true, 'Address name (e.g., Home, Work) is required'],
        trim: true,
        maxlength: [50, 'Address name cannot exceed 50 characters']
    },
    street: { // Corresponds to "Street Address" from your frontend form
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
        maxlength: [100, 'Street address cannot exceed 100 characters']
    },
    apartment: { // Corresponds to "Apartment, Suite, etc. (Optional)" from your frontend form
        type: String,
        trim: true,
        maxlength: [50, 'Apartment/Suite details cannot exceed 50 characters']
        // No 'required' as it's optional
    },
    city: { // Corresponds to "City" from your frontend form
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: { // Corresponds to "State" from your frontend form
        type: String,
        required: [true, 'State is required'],
        trim: true,
        maxlength: [50, 'State name cannot exceed 50 characters']
    },
    zipCode: { // Corresponds to "ZIP Code" from your frontend form
        type: String,
        required: [true, 'ZIP Code is required'],
        trim: true,
        maxlength: [10, 'ZIP Code cannot exceed 10 characters'],
        minlength: [5, 'ZIP Code must be at least 5 characters']
    },
}, {
    timestamps: true // Keeps createdAt and updatedAt for each address sub-document
});

// Your existing userSchema remains the same, just referencing the updated addressSchema
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
    avatar: {
        type: String,
        default: 'https://i.ibb.co/4pDnMkG/avatar.png'
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        default: ''
    },
    addresses: [addressSchema], // Array of address sub-documents
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