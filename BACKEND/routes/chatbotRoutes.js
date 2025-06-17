const express = require('express');
const router = express.Router();
const { getChatbotProducts } = require('../controllers/chatbotController'); // Import the chatbot controller

// Define the route for fetching products specifically for the chatbot
// This route will be accessible at /api/chatbot/products
router.get('/products', getChatbotProducts);

module.exports = router;
