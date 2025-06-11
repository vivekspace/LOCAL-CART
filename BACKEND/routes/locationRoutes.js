const express = require('express');
const router = express.Router();
const UniqueLocation = require('../models/uniqueLocation'); // Path to your UniqueLocation model
const sendErrorResponse = require('../utils/sendErrorResponse'); // Assuming your error handler

router.get('/api/locations', async (req, res) => {
    try {
        // Fetch all unique locations, sorted alphabetically by location_name
        const locations = await UniqueLocation.find({})
                                              .select('location_name -_id') // Only project the location_name field, exclude _id
                                              .sort('location_name')       // Sort alphabetically
                                              .lean(); // Return plain JavaScript objects for performance

        // Map the results to an array of strings (e.g., ["mumbai", "navi mumbai"])
        const locationNames = locations.map(loc => loc.location_name);

        res.status(200).json({
            status: 'success',
            data: {
                locations: locationNames
            }
        });

    } catch (error) {
        console.error("Error fetching unique locations:", error);
        sendErrorResponse(res, 500, 'error', 'Failed to retrieve unique locations', error);
    }
});

module.exports = router;