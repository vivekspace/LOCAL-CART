// D:\LOCALCART-WEB\BACKEND\utils\sendErrorResponse.js

const sendErrorResponse = (res, statusCode, status, message, error = null) => {
    console.error(`Error: ${message}`, error); // Log the full error in development
    res.status(statusCode).json({
        status: status,
        message: process.env.NODE_ENV === 'development' && error ? error.message : message
    });
};

module.exports = sendErrorResponse;