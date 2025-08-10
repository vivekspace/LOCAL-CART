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
        select: false // Exclude password from query results by default for security
    },
    role: {
        type: String,
        enum: ['customer', 'seller', 'admin'],
        default: 'customer'
    },
    photo: {
        url: {
            type: String,
            default: null // Will be set by pre-save hook
        },
        publicId: String // For Cloudinary or similar services
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        default: ''
    },
    lastLoginAt: {
        type: Date,
        default: Date.now // Set default to current time
    },
    addresses: {
        type: [addressSchema],
        default: []
    },
    passwordResetToken: {
        type: String,
        select: false // For security, exclude from default queries
    },
    passwordResetExpires: {
        type: Date,
        select: false // For security, exclude from default queries
    },
    // --- NEW: Fields for OTP (One-Time Password) ---
    otp: {
        type: String,
        select: false // Crucial: Do not return OTP in regular user queries
    },
    otpExpires: {
        type: Date,
        select: false // Crucial: Do not return OTP expiration in regular user queries
    }
    // --- END NEW OTP FIELDS ---
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Mongoose pre-save hook for hashing passwords and setting default photo
userSchema.pre('save', async function (next) {
    // 🖼️ Set default photo based on role if not already provided
    if (!this.photo || !this.photo.url) {
        const DEFAULT_PHOTOS = {
            customer: 'https://res.cloudinary.com/dr9zse9a6/image/upload/v1753785034/localcart/1753785033784-646705549.png',
            seller: 'https://res.cloudinary.com/dr9zse9a6/image/upload/v1753848167/vendor_default_logo_ht2qor.webp',
            admin: 'https://res.cloudinary.com/dr9zse9a6/image/upload/v1753887570/admin_logo_img_foeuh2.webp'
        };
        const role = this.role || 'customer';
        this.photo = {
            url: DEFAULT_PHOTOS[role] || DEFAULT_PHOTOS['customer'],
            publicId: null
        };
    }

    // 🔐 Hash the password only if it's modified (e.g., during registration or password reset)
    if (!this.isModified('password')) return next();

    console.log("\n--- User Model Pre-Save Hook Debugging ---");
    console.log("    Password BEFORE hashing (in pre-save hook):", this.password);
    console.log("    Length of password BEFORE hashing:", this.password ? this.password.length : 'N/A');
    console.log("    Type of password BEFORE hashing:", typeof this.password);

    this.password = await bcrypt.hash(this.password, 10); // Hash with a salt round of 10
    console.log("    Password AFTER hashing (in pre-save hook):", this.password);
    
    next();
});

// Instance method to compare entered password with the hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    // 'this.password' needs to be selected in the query for this to work
    return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the User model
module.exports = mongoose.model('User', userSchema);
