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

dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies
app.use(morgan('dev')); // Logging HTTP requests

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows serving images/files from 'uploads'
}));

// CORS Configuration - UPDATED
const corsOptions = {
  origin: [
    'http://localhost:3000',           // React dev server
    'http://localhost:5173',           // Vite dev server
    'https://localcart.netlify.app',   // Your Netlify deployment
    process.env.CLIENT_URL             // Keep your env variable for flexibility
  ].filter(Boolean), // Remove any undefined values
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// Serve static files from the 'uploads' directory
// This line tells Express to make the 'uploads' directory accessible via the '/uploads' URL prefix.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// This console log is key to debugging what path Render sees!
console.log('Serving static files from:', path.join(__dirname, 'uploads'));

// --- ROUTES ---
// Mount your API routes.
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/users', userRoutes);

// Optional: A basic root route for API status check
app.get('/api', (req, res) => {
  res.json({ message: 'LocalCart API is running!' });
});

// Add a root route
app.get('/', (req, res) => {
  res.json({
    message: 'LocalCart Backend API is running!',
    status: 'Active',
    timestamp: new Date().toISOString()
  });
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke on the server!' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/localcart', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });