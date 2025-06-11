const mongoose = require('mongoose');

const uniqueLocationSchema = new mongoose.Schema({
    location_name: {
        type: String,
        required: [true, 'Location name is required'],
        unique: true, // This is CRUCIAL to ensure only one entry per city
        trim: true,   // Remove leading/trailing whitespace
        lowercase: true // Store in lowercase for consistent querying/matching
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Optional: Add a pre-save hook to update `updatedAt` for consistency
uniqueLocationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('UniqueLocation', uniqueLocationSchema);