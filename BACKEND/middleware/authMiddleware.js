        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const AppError = require('../utils/appError');
        const catchAsync = require('../utils/catchAsync');

        exports.protect = catchAsync(async (req, res, next) => {
            let token;

            // --- DEBUGGING LOGS START ---
            console.log("\n--- Auth Middleware Protect Debugging ---");
            console.log("Request Headers:", req.headers);
            console.log("Request Cookies:", req.cookies);
            // --- DEBUGGING LOGS END ---

            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
                console.log("Token found in Authorization header:", token ? "Yes" : "No");
            } else if (req.cookies && req.cookies.jwt) {
                token = req.cookies.jwt;
                console.log("Token found in Cookies:", token ? "Yes" : "No");
            }

            if (!token) {
                console.log("No token found. Returning 401.");
                return next(new AppError('You are not logged in! Please log in to get access.', 401));
            }

            try {
                console.log("Attempting to verify token...");
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log("Token decoded successfully. Decoded ID:", decoded.id, "Role:", decoded.role);

                console.log("Attempting to find user by ID:", decoded.id);
                const currentUser = await User.findById(decoded.id).select('-password');
                
                if (!currentUser) {
                    console.log("User not found for decoded ID:", decoded.id, ". Returning 401.");
                    return next(
                        new AppError('The user belonging to this token no longer exists.', 401)
                    );
                }

                console.log("User found:", currentUser.email, "Attaching to req.user.");
                req.user = currentUser;
                res.locals.user = currentUser; // Often used for templating engines, good to keep.
                console.log("req.user is now set. Calling next().");
                next();
            } catch (err) {
                console.error("Error during token verification or user lookup in protect middleware:", err.message);
                // You might want to distinguish between JWT errors and other errors
                if (err.name === 'JsonWebTokenError') {
                    return next(new AppError('Invalid token. Please log in again.', 401));
                }
                if (err.name === 'TokenExpiredError') {
                    return next(new AppError('Your token has expired! Please log in again.', 401));
                }
                return next(new AppError('Authentication failed. Please try again.', 500));
            }
        });

        exports.authorizeRoles = (...roles) => {
            return (req, res, next) => {
                // Add a check here too, in case protect fails to set req.user
                if (!req.user) {
                    console.log("AuthorizeRoles: req.user is undefined. This should not happen if protect ran correctly.");
                    return next(new AppError('Authentication required for this action.', 401));
                }

                if (!roles.includes(req.user.role)) {
                    console.log(`Access denied: User with role '${req.user?.role}' tried to access a route requiring roles: ${roles.join(', ')}`);
                    return next(new AppError('You do not have permission to perform this action.', 403));
                }
                next();
            };
        };

        exports.restrictTo = (...roles) => {
            return (req, res, next) => {
                // Add a check here too, in case protect fails to set req.user
                if (!req.user) {
                    console.log("RestrictTo: req.user is undefined. This should not happen if protect ran correctly.");
                    return next(new AppError('Authentication required for this action.', 401));
                }

                if (!roles.includes(req.user.role)) {
                    return next(
                        new AppError('You do not have permission to perform this action', 403)
                    );
                }
                next();
            };
        };
