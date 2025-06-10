const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator'); // Import validator for email validation

// Define the Address sub-schema
const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Address name (e.g., Home, Work) is required'],
    trim: true,
    maxlength: [50, 'Address name cannot exceed 50 characters']
  },
  fullAddress: { // This will store the combined address string
    type: String,
    required: [true, 'Full address is required'],
    trim: true,
    maxlength: [200, 'Full address cannot exceed 200 characters']
  },
  // You might want to break down fullAddress into more structured fields
  // street: { type: String, trim: true },
  // city: { type: String, trim: true },
  // state: { type: String, trim: true },
  // postalCode: { type: String, trim: true },
  // country: { type: String, trim: true, default: 'India' },
  // For now, we'll stick to fullAddress as requested by your frontend.
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
    validate: [validator.isEmail, 'Please provide a valid email address'] // Added email validation
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'], // Added minlength
    select: false // Crucial: Do not send password in queries by default
  },
  role: {
    type: String,
    enum: ['customer', 'seller', 'admin'],
    default: 'customer'
  },
  // New fields for the profile page
  avatar: {
    type: String, // Stores the URL or path to the user's profile picture
    default: 'https://i.ibb.co/4pDnMkG/avatar.png' // A generic default avatar
    // You can replace this with your own default image URL or path
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: '' // Default to an empty string
  },
  addresses: [addressSchema], // Array of address sub-documents
}, {
  timestamps: true // Keeps createdAt and updatedAt
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 10
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);