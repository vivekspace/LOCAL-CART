// In your authMiddleware.js file
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError'); // Assuming you have appError.js in utils
const catchAsync = require('../utils/catchAsync'); // Assuming you have catchAsync.js in utils

const protect = catchAsync(async (req, res, next) => {
    let token;

    // 1) Get token and check if it's there
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        // Use AppError and next() for consistent global error handling
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verify token
    // Using promisify is not strictly necessary if jwt.verify is already sync or handled by catchAsync
    // but a common pattern if you want to explicitly await it.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
        return next(
            new AppError('The user belonging to this token no longer exists.', 401)
        );
    }

    // 4) Check if user changed password after the token was issued (optional)
    // if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
    //     return next(new AppError('User recently changed password! Please log in again.', 401));
    // }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser; // Attach the full user document
    next();
});

module.exports = { protect };