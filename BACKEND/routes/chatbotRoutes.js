const express = require('express');
const router = express.Router();
const { getChatbotProducts } = require('../controllers/chatbotController'); 

router.get('/products', getChatbotProducts);

module.exports = router;
