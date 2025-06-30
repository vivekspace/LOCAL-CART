const express = require('express');
const router = express.Router();
const UniqueLocation = require('../models/uniqueLocation');
const sendErrorResponse = require('../utils/sendErrorResponse');

const LOCATION_TYPE_PRODUCT_BASED = 'product_based';

router.get('/', async (req, res) => {
    try {
        const uniqueLocations = await UniqueLocation.find({})
                                        .select('location_name latitude longitude -_id')
                                        .sort('location_name')
                                        .lean();

        const formattedLocations = uniqueLocations.map(loc => ({
            name: loc.location_name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            city: loc.location_name,
            type: LOCATION_TYPE_PRODUCT_BASED,
            lat: loc.latitude || null,
            lng: loc.longitude || null,
        }));

        res.status(200).json({
            status: 'success',
            data: {
                locations: formattedLocations
            }
        });

    } catch (error) {
        console.error("Error fetching unique locations:", error);
        sendErrorResponse(res, 500, 'error', 'Failed to retrieve unique locations', error);
    }
});

module.exports = router;
