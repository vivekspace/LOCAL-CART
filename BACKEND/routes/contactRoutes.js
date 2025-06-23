const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController'); // We'll create this

router.post('/', contactController.sendContactEmail);

module.exports = router;