const express = require('express');
const router = express.Router();
const UniqueLocation = require('../models/uniqueLocation');
const sendErrorResponse = require('../utils/sendErrorResponse'); 

router.get('/', async (req, res) => { 
    try {
        const locations = await UniqueLocation.find({})
                                            .select('location_name -_id') 
                                            .sort('location_name')      
                                            .lean(); 
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