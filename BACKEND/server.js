    const express = require('express');
    const dotenv = require('dotenv');
    const mongoose = require('mongoose');
    const cors = require('cors');
    const morgan = require('morgan');
    const helmet = require('helmet');
    const path = require('path');

    // Import your route files
    const vendorRoutes = require('./routes/vendorRoutes');
    const orderRoutes = require('./routes/orderRoutes');
    const adminAuthRoutes = require('./routes/adminAuthRoutes');
    const authRoutes = require('./routes/authRoutes');
    const productRoutes = require('./routes/productRoutes');
    const userRoutes = require('./routes/userRoutes')
    const locationRoutes = require('./routes/locationRoutes'); 
    const chatbotRoutes = require('./routes/chatbotRoutes');
    const dashboardRoutes = require('./routes/dashboardRoutes');
    const adminProductRoutes = require('./routes/adminProductRoutes')
    const contactRoutes = require('./routes/contactRoutes'); 




    dotenv.config(); // Load environment variables from .env file

    const app = express();

    // --- Middleware ---
    // Parse JSON request bodies
    app.use(express.json()); 
    // Parse URL-encoded bodies (for form data)
    app.use(express.urlencoded({ extended: true })); 
    // HTTP request logger (e.g., for development to see requests in console)
    app.use(morgan('dev')); 

    // Security middleware
    app.use(helmet({
        // crossOriginResourcePolicy: false is important if you're serving images
        // from a different origin (e.g., your frontend on localhost:3000 and backend on localhost:5000)
        crossOriginResourcePolicy: false, 
    }));

    // CORS Configuration
    // This allows your frontend (e.g., React app) to make requests to this backend.
    const corsOptions = {
        origin: [
            'http://localhost:3000',           // React dev server (standard create-react-app)
            'http://localhost:5173',           // Vite dev server (common for modern React setups)
            'https://localcart.netlify.app',   // Your Netlify deployment URL
            process.env.CLIENT_URL             // Environment variable for other client URLs
        ].filter(Boolean), // Filter out any null/undefined values if env variable is not set
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        credentials: true, // Allow cookies and authorization headers to be sent
        optionsSuccessStatus: 204, // For preflight requests
    };
    app.use(cors(corsOptions));

    // Serve static files from the 'uploads' directory
    // This makes files in './uploads' accessible via '/uploads' URL (e.g., /uploads/image.jpg)
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    console.log('Serving static files from:', path.join(__dirname, 'uploads'));

    // --- ROUTES ---
    // Mount your API routes. The order here matters for route specificity.
    app.use('/api/auth', authRoutes); // Handles user authentication
    app.use('/api/products', productRoutes); // Handles all product-related API calls
    app.use('/api/vendor', vendorRoutes);   // Handles vendor-related API calls
    app.use('/api/orders', orderRoutes);   // Handles order-related API calls
    app.use('/api/admin', adminAuthRoutes); // Handles admin authentication
    app.use('/api/users', userRoutes);     // Handles user-related API calls
    app.use('/api/locations', locationRoutes); // Mount location routes (assuming they are under /api/locations)
    app.use('/api/chatbot', chatbotRoutes); // <--- NEW: Mount chatbot specific routes here
    app.use('/api/admin/dashboard', dashboardRoutes);
    app.use('/api/admin/products', adminProductRoutes);
    app.use('/api/contact', contactRoutes);
    // A basic root route for API status check
    app.get('/api', (req, res) => {
        res.json({ message: 'LocalCart API is running!' });
    });

    // Add a root route (for direct access to backend base URL)
    app.get('/', (req, res) => {
        res.json({
            message: 'LocalCart Backend API is running!',
            status: 'Active',
            timestamp: new Date().toISOString()
        });
    });


    // Error handling middleware (should be the last middleware)
    app.use((err, req, res, next) => {
        console.error(err.stack); // Log the error stack for debugging
        res.status(500).json({ error: 'Something broke on the server!', details: err.message });
    });

    // --- Database Connection & Server Start ---
    const PORT = process.env.PORT || 5000; // Use port from environment or default to 5000

    mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/localcart', {
        useNewUrlParser: true,      // Deprecated in new versions, but good for compatibility
        useUnifiedTopology: true,   // Recommended for new connections
    })
        .then(() => {
            console.log('✅ MongoDB connected');
            // Start the Express server only after successful database connection
            app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
        })
        .catch((err) => {
            console.error('❌ MongoDB connection error:', err.message);
            process.exit(1); // Exit the process if unable to connect to DB
        });

