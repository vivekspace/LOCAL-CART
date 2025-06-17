const Product = require('../models/Product'); // Assuming your Product Mongoose model path

// Helper function for handling async operations and errors
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Helper function for sending consistent error responses
const sendErrorResponse = (res, statusCode, status, message, error = null) => {
    console.error(`Error in chatbotController: ${message}`, error);
    res.status(statusCode).json({
        status: status,
        message: process.env.NODE_ENV === 'development' && error ? error.message : message
    });
};

/**
 * @desc Get products specifically formatted and filtered for the chatbot.
 * This endpoint aims to provide a lightweight data set for AI consumption.
 * @route GET /api/chatbot/products
 * @access Public
 */
exports.getChatbotProducts = asyncHandler(async (req, res) => {
    console.log('--- HIT: /api/chatbot/products (getChatbotProducts) route ---');
    try {
        // We want to fetch all products but only select fields relevant to the chatbot.
        // This avoids sending unnecessary data to the AI.
        const products = await Product.find({})
            .select('_id name price category description tags images stock location.city')
            .lean(); // Use .lean() for plain JavaScript objects for faster AI processing

        if (!products || products.length === 0) {
            return res.status(200).json({
                status: 'success',
                results: 0,
                message: 'No products available for the chatbot.',
                data: { products: [] }
            });
        }

        res.status(200).json({
            status: 'success',
            results: products.length,
            data: {
                products,
            },
        });
    } catch (err) {
        sendErrorResponse(res, 500, 'error', 'Error fetching products for chatbot', err);
    }
});
