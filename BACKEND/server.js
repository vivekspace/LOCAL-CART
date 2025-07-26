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

// =========================================================
// Security & Core Middleware
// =========================================================

// Helmet: Enhanced security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline often needed for dev, but try to avoid in prod
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https://*.amazonaws.com'] // Allow AWS S3 if used
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" } // For CDN support
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

// Static Files: Serve uploaded images/files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d', // Cache static assets for 7 days
    setHeaders: (res, path) => {
        // Specific cache control for image types
        if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.webp')) {
            res.setHeader('Cache-Control', 'public, max-age=604800');
        }
    }
}));

// =========================================================
// API Routes Configuration
// =========================================================
const apiRoutes = express.Router();

// Define API routes. Order matters for conflicting paths.
// More specific paths should generally come before more general ones if they share a base.

// 1. Authentication Routes (e.g., /api/auth/register, /api/auth/login)
apiRoutes.use('/auth', require('./routes/authRoutes'));

// 2. Vendor-Specific Routes (e.g., /api/vendor/products, /api/vendor/orders)
//    Place this BEFORE '/products' to ensure '/api/vendor/products' is handled by vendorRoutes.
apiRoutes.use('/vendor', require('./routes/vendorRoutes'));

// 3. Admin Product Management Routes (if distinct from general product routes)
//    These typically handle CRUD for all products by an admin.
apiRoutes.use('/admin/products', require('./routes/adminProductRoutes'));

// 4. Public/General Product Routes (e.g., /api/products for Browse all products)
//    This should usually contain `getAllProducts` for public view, and possibly admin-level CRUD
//    if 'adminProductRoutes' is not used or if you manage some admin aspects here.
apiRoutes.use('/products', require('./routes/productRoutes'));

// 5. Other Main API Routes
apiRoutes.use('/orders', require('./routes/orderRoutes'));
apiRoutes.use('/admin', require('./routes/adminAuthRoutes')); // For admin-specific auth or dashboard access
apiRoutes.use('/users', require('./routes/userRoutes'));
apiRoutes.use('/locations', require('./routes/locationRoutes'));
apiRoutes.use('/chatbot', require('./routes/chatbotRoutes'));
apiRoutes.use('/admin/dashboard', require('./routes/dashboardRoutes')); // Specific admin dashboard
apiRoutes.use('/contact', require('./routes/contactRoutes'));
apiRoutes.use('/marketing', require('./routes/marketingRoutes'));
apiRoutes.use('/wishlist', require('./routes/wishlistRoutes'));
apiRoutes.use('/reviews', require('./routes/reviewRoutes.js'));
apiRoutes.use('/notifications', require('./routes/notificationRoutes'));


// Apply all defined apiRoutes under the /api base path
app.use('/api', apiRoutes);

// =========================================================
// Health Checks & Root Route
// =========================================================

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: actualRedisClient && actualRedisClient.status === 'ready' ? 'connected' : 'disconnected'
    });
});

// Root Route
app.get('/', (req, res) => {
    res.json({
        message: 'LocalCart Backend API',
        version: process.env.npm_package_version || '1.0.0', // Use npm_package_version from package.json
        environment: process.env.NODE_ENV || 'development',
        docs: '/api-docs' // Placeholder if you implement Swagger/OpenAPI docs
    });
});

// =========================================================
// Error Handling Middleware
// =========================================================

// Catch 404 Not Found errors
app.use(notFound);
// General error handling middleware
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