// one_time_migration_script.js
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path as necessary
require('dotenv').config();

// Replace with your actual MongoDB URI
const MONGODB_URI = process.env.MONGO_URI; // e.g., 'mongodb://localhost:27017/localcart'

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('MongoDB connected for migration.');
        try {
            // Find users where 'addresses' field does not exist or is null
            const result = await User.updateMany(
                { $or: [{ addresses: { $exists: false } }, { addresses: null }] },
                { $set: { addresses: [] } }
            );
            console.log(`Migration complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
        } catch (error) {
            console.error('Error during migration:', error);
        } finally {
            mongoose.disconnect();
            console.log('MongoDB disconnected.');
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));