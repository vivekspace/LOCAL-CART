// server.js or app.js (main Express application file)
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { connect: connectRedis, redisClient: actualRedisClient } = require('./config/redis.js');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
 

// Load environment variables early
dotenv.config();

// Initialize Express
const app = express();

// Enhanced Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https://*.amazonaws.com'] // Allow AWS S3 if used
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" } // For CDN support
}));

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.'
});

// Middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use('/api/', apiLimiter);

// Enhanced CORS Configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://localcart.netlify.app',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400
}));

// Static Files with Cache Control
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    setHeaders: (res, path) => {
        if (path.endsWith('.jpg') || path.endsWith('.png')) {
            res.setHeader('Cache-Control', 'public, max-age=604800');
        }
    }
}));

// API Routes
const apiRoutes = express.Router();
apiRoutes.use('/auth', require('./routes/authRoutes'));
apiRoutes.use('/vendor/products', require('./routes/productRoutes.js'))
apiRoutes.use('/products', require('./routes/productRoutes'));
apiRoutes.use('/vendor', require('./routes/vendorRoutes'));
apiRoutes.use('/orders', require('./routes/orderRoutes'));
apiRoutes.use('/admin', require('./routes/adminAuthRoutes'));
apiRoutes.use('/users', require('./routes/userRoutes'));
apiRoutes.use('/locations', require('./routes/locationRoutes'));
apiRoutes.use('/chatbot', require('./routes/chatbotRoutes'));
apiRoutes.use('/admin/dashboard', require('./routes/dashboardRoutes'));
apiRoutes.use('/admin/products', require('./routes/adminProductRoutes'));
apiRoutes.use('/contact', require('./routes/contactRoutes'));
apiRoutes.use('/marketing', require('./routes/marketingRoutes'));
apiRoutes.use('/wishlist', require('./routes/wishlistRoutes')); // NEW: Mount wishlist routes here
apiRoutes.use('/reviews' , require('./routes/reviewRoutes.js'))

app.use('/api', apiRoutes);

// Health Check Endpoints
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: actualRedisClient && actualRedisClient.status === 'ready' ? 'connected' : 'disconnected' // Use actualRedisClient here
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'LocalCart Backend API',
        version: process.env.npm_package_version,
        environment: process.env.NODE_ENV || 'development',
        docs: '/api-docs' // Add if you implement Swagger
    });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Database Connection with Retry Logic
const connectDB = async () => {
    const MAX_RETRIES = 3;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                maxPoolSize: 50
            });
            console.log('✅ MongoDB connected');
            return;
        } catch (err) {
            retries++;
            console.error(`❌ MongoDB connection failed (attempt ${retries}):`, err.message);
            if (retries < MAX_RETRIES) {
                await new Promise(res => setTimeout(res, 5000));
            } else {
                process.exit(1);
            }
        }
    }
};

// Server Startup
const PORT = process.env.PORT || 5000;

let server; // Declare server variable here

const startServer = async () => {
    try {
        await connectDB();
        await connectRedis(); // Call the connectRedis function (aliased from redis.connect)

        server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Server startup failed:', err);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    if (server) { // Check if server is defined before closing
        server.close(() => {
            console.log('Process terminated');
        });
    } else {
        console.log('Server not running, terminating process directly.');
        process.exit(0);
    }
});

startServer();
