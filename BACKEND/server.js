const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet'); // Keep Helmet imported
const vendorRoutes = require('./routes/vendorRoutes');
const path = require('path');
const bodyParser = require('body-parser');
const orderRoutes = require('./routes/orderRoutes');


dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// -----------------------------------------------------
// Modify Helmet configuration
// Disable crossOriginResourcePolicy as it often clashes with CORS for images
// -----------------------------------------------------
app.use(helmet({
  crossOriginResourcePolicy: false, // <--- Add this line
}));

// CORS Configuration (Keep this as is, as it's correctly set for 5173)
const corsOptions = {
  origin: 'http://localhost:5173', // Your Vite frontend URL - confirmed this is correct
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Uploads directory:', path.join(__dirname, 'uploads'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/vendor', vendorRoutes);
app.use('/api/orders', orderRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/localcart', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected');
    // Start server only after DB connection
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });