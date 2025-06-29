
const express = require('express');
const router = express.Router(); 
const marketingController = require('../controllers/marketingController'); // Import your controller

router.get('/hero-slides', marketingController.getHeroSlides);



module.exports = router;