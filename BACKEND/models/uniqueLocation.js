const mongoose = require('mongoose');

const uniqueLocationSchema = new mongoose.Schema({
    location_name: {
        type: String,
        required: [true, 'Location name is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    latitude: {
        type: Number,
        required: false 
    },
    longitude: {
        type: Number,
        required: false 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

uniqueLocationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('UniqueLocation', uniqueLocationSchema);