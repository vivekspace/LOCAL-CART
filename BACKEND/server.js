    const express = require('express');
    const dotenv = require('dotenv');
    const mongoose = require('mongoose');
    const cors = require('cors');
    const morgan = require('morgan');
    const helmet = require('helmet');
    const path = require('path');

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
    const marketingRoutes = require('./routes/marketingRoutes');

    dotenv.config();

    const app = express();

    app.use(express.json()); 
    app.use(express.urlencoded({ extended: true })); 
    app.use(morgan('dev')); 

    app.use(helmet({
        crossOriginResourcePolicy: false, 
    }));

    const corsOptions = {
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://localcart.netlify.app',
            process.env.CLIENT_URL
        ].filter(Boolean),
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        credentials: true,
        optionsSuccessStatus: 204,
    };
    app.use(cors(corsOptions));

    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    console.log('Serving static files from:', path.join(__dirname, 'uploads'));

    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/vendor', vendorRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/admin', adminAuthRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/locations', locationRoutes);
    app.use('/api/chatbot', chatbotRoutes);
    app.use('/api/admin/dashboard', dashboardRoutes);
    app.use('/api/admin/products', adminProductRoutes);
    app.use('/api/contact', contactRoutes);
    app.use('/api/marketing', marketingRoutes);

    app.get('/api', (req, res) => {
        res.json({ message: 'LocalCart API is running!' });
    });

    app.get('/', (req, res) => {
        res.json({
            message: 'LocalCart Backend API is running!',
            status: 'Active',
            timestamp: new Date().toISOString()
        });
    });

    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ error: 'Something broke on the server!', details: err.message });
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
