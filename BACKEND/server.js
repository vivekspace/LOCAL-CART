// server.js or app.js (main Express application file)
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const http = require('http'); // For explicit server creation
const { Server } = require('socket.io'); // For Socket.IO

// Load environment variables as early as possible
dotenv.config();

// Initialize Express app
const app = express();

// Import configurations and middleware
const { connect: connectRedis, redisClient: actualRedisClient } = require('./config/redis.js');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Import Cloudinary configuration
const { cloudinary } = require('./config/cloudinary');

// =========================================================
// Cloudinary Connection Test
// =========================================================
const testCloudinary = async () => {
    try {
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary connected successfully');
    } catch (error) {
        console.error('❌ Cloudinary connection failed:', error.message);
    }
};

// =========================================================
// Security & Core Middleware
// =========================================================

// Helmet: Enhanced security headers (Updated for Cloudinary)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline often needed for dev, but try to avoid in prod
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: [
                "'self'", 
                'data:', 
                'https://*.amazonaws.com', 
                'https://res.cloudinary.com', // Add Cloudinary CDN
                'https://*.cloudinary.com',   // Additional Cloudinary domains
                `${process.env.VITE_API_URL}`
            ] // Allow Cloudinary images
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" } // For CDN support if needed, or if images are served from a different (sub)domain
}));

// Morgan: HTTP request logger
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body Parsers: Parse JSON and URL-encoded data
app.use(express.json({ limit: '10kb' })); // Parses JSON request bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parses URL-encoded request bodies

// Rate Limiting: Protect against brute-force attacks and abuse
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api/', apiLimiter); // Apply to all routes under /api

// CORS: Cross-Origin Resource Sharing
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', // Vite development server
    'https://localcart.netlify.app', // Frontend deployment URL
    process.env.CLIENT_URL // Dynamic client URL from environment variables
].filter(Boolean); // Filter out any undefined/null values

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl requests) or if origin is in allowed list
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true, // Allow cookies to be sent
    maxAge: 86400 // Cache preflight requests for 24 hours
}));

// =========================================================
// REMOVED: Static Files Serving (No longer needed with Cloudinary)
// =========================================================
// The following code is commented out because we're now using Cloudinary
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
//     maxAge: '7d', // Cache static assets for 7 days
//     setHeaders: (res, path) => {
//         // Specific cache control for image types
//         if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.webp') || path.endsWith('.jpeg') || path.endsWith('.gif')) {
//             res.setHeader('Cache-Control', 'public, max-age=604800');
//         }
//     }
// }));

// =========================================================
// API Routes Configuration
// =========================================================

// Create a main API router
const apiRoutes = express.Router();

// Import all route modules
const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const contactRoutes = require('./routes/contactRoutes');
const marketingRoutes = require('./routes/marketingRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes.js');
const notificationRoutes = require('./routes/notificationRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes.js');

// Define API routes. Order matters: place more specific paths before general ones
// that share a prefix. This is crucial for correct route matching.

// Admin-specific routes (most specific admin paths first)
apiRoutes.use('/admin/dashboard', dashboardRoutes); // Handles /api/admin/dashboard/...
apiRoutes.use('/admin/products', adminProductRoutes); // Handles /api/admin/products/...
apiRoutes.use('/admin/orders', adminOrderRoutes);     // Handles /api/admin/orders/...

// General admin routes (e.g., for admin profile, general settings if not sub-pathed)
// This must come AFTER the more specific admin sub-routes to avoid conflicts.
apiRoutes.use('/admin', adminAuthRoutes); // Handles /api/admin/... (but not the specific sub-paths already defined)

// Other Core API Routes
apiRoutes.use('/auth', authRoutes); // Handles /api/auth/...
apiRoutes.use('/vendor', vendorRoutes); // Handles /api/vendor/...
apiRoutes.use('/products', productRoutes); // Handles /api/products/... (public products)
apiRoutes.use('/orders', orderRoutes); // Handles /api/orders/... (public orders or user's own orders)
apiRoutes.use('/users', userRoutes); // Handles /api/users/...
apiRoutes.use('/locations', locationRoutes); // Handles /api/locations/...
apiRoutes.use('/chatbot', chatbotRoutes); // Handles /api/chatbot/...
apiRoutes.use('/contact', contactRoutes); // Handles /api/contact/...
apiRoutes.use('/marketing', marketingRoutes); // Handles /api/marketing/...
apiRoutes.use('/wishlist', wishlistRoutes); // Handles /api/wishlist/...
apiRoutes.use('/reviews', reviewRoutes); // Handles /api/reviews/...
apiRoutes.use('/notifications', notificationRoutes); // Handles /api/notifications/...

// Apply all defined apiRoutes under the /api base path
app.use('/api', apiRoutes);

// Serve React build files (for production)
app.use(express.static(path.join(__dirname, '../client/build'))); // Serve static files

app.get('*', (req, res) => {  // Catch-all route
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// =========================================================
// Health Checks & Root Route
// =========================================================

// Health Check Endpoint (Updated to include Cloudinary status)
app.get('/api/health', async (req, res) => {
    let cloudinaryStatus = 'disconnected';
    try {
        await cloudinary.api.ping();
        cloudinaryStatus = 'connected';
    } catch (error) {
        cloudinaryStatus = 'disconnected';
    }

    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: actualRedisClient && actualRedisClient.status === 'ready' ? 'connected' : 'disconnected',
        cloudinary: cloudinaryStatus
    });
});

// Root Route
app.get('/', (req, res) => {
    res.json({
        message: 'LocalCart Backend API',
        version: process.env.npm_package_version || '1.0.0', // Use npm_package_version from package.json
        environment: process.env.NODE_ENV || 'development',
        docs: '/api-docs', // Placeholder if you implement Swagger/OpenAPI docs
        storage: 'Cloudinary' // Indicate we're using Cloudinary
    });
});

// =========================================================
// Error Handling Middleware
// =========================================================

// Catch 404 Not Found errors - MUST be after all routes
app.use(notFound);
// General error handling middleware - MUST be last
app.use(errorHandler);

// =========================================================
// Database & Server Startup
// =========================================================

// MongoDB Connection with Retry Logic
const connectDB = async () => {
    const MAX_RETRIES = 3;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                // useNewUrlParser and useUnifiedTopology are default true in Mongoose 6+
                serverSelectionTimeoutMS: 5000, // Timeout after 5s if server not found
                maxPoolSize: 50 // Maintain up to 50 socket connections
            });
            console.log('✅ MongoDB connected successfully');
            return; // Exit loop on successful connection
        } catch (err) {
            retries++;
            console.error(`❌ MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}):`, err.message);
            if (retries < MAX_RETRIES) {
                await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds before retrying
            } else {
                console.error('❌ Max MongoDB connection retries reached. Exiting...');
                process.exit(1); // Exit process with failure code
            }
        }
    }
};

// Server Startup
const PORT = process.env.PORT || 5000;
let serverInstance; // Use a more descriptive name for the HTTP server
let ioInstance; // Socket.IO instance

const startServer = async () => {
    try {
        await connectDB(); // Connect to MongoDB
        await connectRedis(); // Connect to Redis
        await testCloudinary(); // Test Cloudinary connection

        // Create HTTP server and attach Express app to it
        serverInstance = http.createServer(app);

        // Initialize Socket.IO and attach it to the HTTP server
        ioInstance = new Server(serverInstance, {
            cors: {
                origin: allowedOrigins, // Use the same allowed origins as Express CORS
                methods: ["GET", "POST"], // Only methods used for WebSocket handshake
                credentials: true
            }
        });

        // Make the Socket.IO instance accessible throughout the app
        app.set('socketio', ioInstance);

        // Socket.IO event handling
        ioInstance.on('connection', (socket) => {
            console.log(`⚡️ User connected via Socket.IO: ${socket.id}`);

            socket.on('joinRoom', (userId) => {
                socket.join(userId);
                console.log(`User ${socket.id} joined room: ${userId}`);
            });

            socket.on('sendNotification', (data) => {
                // data should contain { userId, notification }
                ioInstance.to(data.userId).emit('newNotification', data.notification);
                console.log(`Notification sent to ${data.userId}: ${data.notification.title}`);
            });

            socket.on('disconnect', () => {
                console.log(`🔴 User disconnected from Socket.IO: ${socket.id}`);
            });
        });

        // Start listening for HTTP requests
        serverInstance.listen(PORT, () => {
            console.log(`🚀 HTTP Server & Socket.IO running on port ${PORT}`);
            console.log(`🖼️  Using Cloudinary for image storage`);
        });

    } catch (err) {
        console.error('❌ Server startup failed:', err);
        process.exit(1); // Exit process if server fails to start
    }
};

// Handle graceful shutdown (e.g., for 'npm stop' or Kubernetes termination signals)
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Initiating graceful shutdown...');
    if (serverInstance) {
        serverInstance.close(() => {
            console.log('HTTP server closed.');
            // Close Socket.IO connections on shutdown
            if (ioInstance) {
                ioInstance.disconnectSockets(true); // Disconnect all connected sockets
                console.log('Socket.IO sockets disconnected.');
            }
            console.log('Process terminated.');
            process.exit(0);
        });
    } else {
        console.log('Server not running, terminating process directly.');
        process.exit(0);
    }
});

// Start the application
startServer();