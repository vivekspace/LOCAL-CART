// controllers/dashboardController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User'); 
const Vendor = require('../models/Vendor'); 
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

// Helper function to filter allowed fields (Used by updateMe)
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// --- MULTER CONFIGURATION FOR IMAGE UPLOADS ---
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    const outputPath = path.join(__dirname, '../uploads', req.file.filename);
    console.log('Saving processed image to:', outputPath);

    await sharp(req.file.buffer)
        .resize(500, 500, {
            fit: sharp.fit.cover,
            withoutEnlargement: true
        })
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(outputPath);

    next();
});

// --- Controller Function for updating profile including photo ---
exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword.',
                400
            )
        );
    }

    const filteredBody = filterObj(req.body, 'name', 'email', 'bio');

    if (req.file && req.file.filename) {
        filteredBody.photo = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    }).select('-password');

    if (!updatedUser) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

// 1. Get Me (Logged-in user's data) - Existing
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

// Generic get user by ID - Existing (This is the one from userController.js, keep it distinct from getUserByIdForAdmin)
exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

// >>> MODIFIED FUNCTIONS <<<

// Function to fetch addresses for the logged-in user
exports.getAddresses = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            addresses: user.addresses || []
        }
    });
});


exports.addAddress = catchAsync(async (req, res, next) => {
    const { name, street, apartment, city, state, zipCode , phone , isDefault} = req.body;

    const newAddressData = {
        name,
        street,
        apartment,
        city,
        state,
        phone,
        zipCode,
        isDefault
    };
    console.log('newAddressData:', newAddressData);

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    console.log('User addresses before push:', user.addresses);

    user.addresses.push(newAddressData);
    console.log('User addresses after push:', user.addresses);

    await user.save();

    res.status(201).json({
        status: 'success',
        message: 'Address added successfully',
        data: {
            address: user.addresses[user.addresses.length - 1]
        }
    });
});

// Function to update an existing address
exports.updateAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;
    const { name, street, apartment, city, state, zipCode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const address = user.addresses.id(addressId);
    
    if (!address) {
        return next(new AppError('Address not found', 404));
    }

    address.set({
        name: name || address.name,
        street: street || address.street,
        apartment: apartment || address.apartment,
        city: city || address.city,
        state: state || address.state,
        zipCode: zipCode || address.zipCode
    });

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Address updated successfully',
        data: {
            address: address
        }
    });
});

// Function to delete an address
exports.deleteAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;
    console.log('deleteAddress: addressId from params:', addressId);

    const user = await User.findById(req.user.id);
    console.log('deleteAddress: user found:', user ? true : false);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const initialAddressCount = user.addresses.length;

    user.addresses.pull({ _id: addressId });

    if (user.addresses.length === initialAddressCount) {
        return next(new AppError('Address not found or already deleted', 404));
    }
    
    await user.save();
    console.log('deleteAddress: user saved after removal');

    res.status(204).json({
        status: 'success',
        message: 'Address deleted successfully',
        data: null
    });
});

exports.setAsDefaultAddress = async (req, res, next) => {
    try {
        const { addressId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressToSetDefault = user.addresses.id(addressId);
        if (!addressToSetDefault) {
            return res.status(404).json({ message: 'Address not found' });
        }

        user.addresses.forEach(addr => {
            if (addr._id.toString() !== addressId) {
                addr.isDefault = false;
            }
        });

        addressToSetDefault.isDefault = true;

        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Default address set successfully',
            data: {
                address: addressToSetDefault
            }
        });

    } catch (error) {
        console.error("Error setting default address:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to set default address',
            error: error.message
        });
    }
};

// Existing Vendor Dashboard Controller
exports.getVendorDashboard = async (req, res) => {
    try {
        const vendorId = new mongoose.Types.ObjectId(req.vendor._id);
        console.log('Vendor ID:', vendorId);

        const totalProducts = await Product.countDocuments({ seller: vendorId });
        console.log('Total Products:', totalProducts);

        const totalOrders = await Order.countDocuments({ 'cartItems.seller': vendorId });
        console.log('Total Orders:', totalOrders);

        const deliveredOrders = await Order.countDocuments({
            'cartItems.seller': vendorId,
            status: { $in: ['delivered', 'completed'] }
        });
        console.log('Delivered Orders:', deliveredOrders);

        const pendingOrders = await Order.countDocuments({
            'cartItems.seller': vendorId,
            status: { $in: ['pending', 'processing', 'shipped'] }
        });
        console.log('Pending Orders:', pendingOrders);

        const salesAggregationResult = await Order.aggregate([
            {
                $match: {
                    'cartItems.seller': vendorId,
                    status: { $in: ['delivered', 'completed'] }
                }
            },
            { $unwind: '$cartItems' },
            {
                $match: {
                    'cartItems.seller': vendorId
                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $multiply: ['$cartItems.quantity', '$cartItems.price']
                        }
                    }
                }
            }
        ]);

        const totalSales = salesAggregationResult[0]?.total || 0;
        console.log('Total Sales:', totalSales);

        const activeProducts = await Product.countDocuments({
            seller: vendorId,
            stock: { $gt: 0 }
        });
        console.log('Active Products:', activeProducts);

        const outOfStockProducts = await Product.countDocuments({
            seller: vendorId,
            stock: { $lte: 0 }
        });
        console.log('Out of Stock Products:', outOfStockProducts);

        const topProducts = await Product.find({ seller: vendorId })
            .sort({ salesCount: -1 })
            .limit(5)
            .select('name price images stock');

        const formattedTopProducts = topProducts.map(p => ({
            id: p._id,
            name: p.name,
            price: p.price,
            sales: p.salesCount || 0,
            images: p.images,
        }));
        console.log('Top Products:', formattedTopProducts);

        const conversionRate = totalOrders > 0 ?
            ((deliveredOrders / totalOrders) * 100).toFixed(2) : '0.00';
        console.log('Conversion Rate:', conversionRate);

        const salesChartLabels = [];
        const salesChartDataValues = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateString = `${d.getMonth() + 1}/${d.getDate()}`;
            salesChartLabels.push(dateString);
            salesChartDataValues.push(Math.floor(Math.random() * (2500 - 500 + 1)) + 500); // Dummy data
        }

        const recentOrders = await Order.find({ 'cartItems.seller': vendorId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'firstname lastname')
            .select('orderId status totalAmount createdAt cartItems.name cartItems.price cartItems.quantity');

        const formattedRecentOrders = recentOrders.map(order => ({
            id: order.orderId || order._id,
            customer: order.customerId ? `${order.customerId.firstname || ''} ${order.customerId.lastname || ''}`.trim() : 'Guest User',
            amount: order.totalAmount,
            status: order.status,
        }));
        console.log('Recent Orders:', formattedRecentOrders);

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                activeProducts,
                outOfStockProducts,
                totalOrders,
                deliveredOrders,
                pendingOrders,
                totalSales,
                conversionRate,
                topProducts: formattedTopProducts,
                salesChartData: {
                    labels: salesChartLabels,
                    data: salesChartDataValues
                },
                recentOrders: formattedRecentOrders,
                totalCustomers: 0, // Placeholder
                totalRevenue: totalSales,
                averageOrderValue: totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : '0.00',
                totalReviews: 0, // Placeholder
                averageRating: '0.00' // Placeholder
            }
        });

    } catch (error) {
        console.error('Vendor Dashboard Error:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
};

exports.getAdminDashboardStats = async (req, res) => {
    try {
        // --- 1. Overall Stats ---
        const totalSalesResult = await Order.aggregate([
            { $match: { status: { $in: ['delivered', 'completed'] } } },
            { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
        ]);
        const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0;

        const totalOrders = await Order.countDocuments();
        const totalCustomers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalVendors = await Vendor.countDocuments();

        // --- 2. Sales Overview Data (for the chart) ---
        const salesOverviewLabels = [];
        const salesOverviewDataValues = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) { // Last 7 days, including today
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateString = `${d.getMonth() + 1}/${d.getDate()}`; // MM/DD format
            salesOverviewLabels.push(dateString);
            // Example: A random value for demonstration (REPLACE WITH REAL AGGREGATION)
            salesOverviewDataValues.push(Math.floor(Math.random() * (2500 - 500 + 1)) + 500);
        }

        // --- 3. Order Status Data (for the pie chart) ---
        const orderStatusCounts = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        // Format for frontend (assuming it expects {labels: [], counts: []})
        const orderStatusLabels = orderStatusCounts.map(item => item._id);
        const orderStatusValues = orderStatusCounts.map(item => item.count);


        // --- 4. Recent Orders ---
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'firstname lastname')
            .select('orderId status totalAmount createdAt');

        const formattedRecentOrders = recentOrders.map(order => ({
            id: order.orderId || order._id,
            customer: order.customerId ? `${order.customerId.firstname || ''} ${order.customerId.lastname || ''}`.trim() : 'Guest User',
            amount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
        }));


        res.status(200).json({
            status: 'success',
            data: {
                // Overall Stats
                totalSales,
                totalOrders,
                totalCustomers,
                totalProducts,
                totalVendors,

                // Sales Overview Chart Data
                salesOverview: {
                    labels: salesOverviewLabels,
                    sales: salesOverviewDataValues,
                },

                // Order Status Chart Data
                orderStatus: {
                    labels: orderStatusLabels,
                    counts: orderStatusValues,
                },

                // Recent Orders
                recentOrders: formattedRecentOrders,
            }
        });

    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch admin dashboard data', error: error.message });
    }
};


exports.getAllUsersForAdmin = async (req, res) => {
    try {
        console.log('getAllUsersForAdmin: Fetching all users for admin.');

        const usersWithStats = await User.aggregate([
            {
                $lookup: {
                    from: Order.collection.name,
                    localField: '_id',
                    foreignField: 'customerId',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    transactionsCount: { $size: '$orders' },
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    role: 1,
                    photo: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    lastLoginAt: 1,
                    transactionsCount: 1,
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: usersWithStats.length,
            users: usersWithStats
        });
        console.log('getAllUsersForAdmin: Successfully sent users data. Users count:', usersWithStats.length);

    } catch (error) {
        console.error('Error in getAllUsersForAdmin:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user data for administration.',
            error: error.message
        });
    }
};


exports.getUserByIdForAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`getUserByIdForAdmin: Attempting to fetch user with ID: ${id}`);

        // --- NEW: Validate ID format before using it in ObjectId constructor ---
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`Invalid User ID format: ${id}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format.'
            });
        }

        const userObjectId = new mongoose.Types.ObjectId(id);

        const userWithStats = await User.aggregate([
            { $match: { _id: userObjectId } },
            {
                $lookup: {
                    from: Order.collection.name,
                    localField: '_id',
                    foreignField: 'customerId',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    transactionsCount: { $size: '$orders' },
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    role: 1,
                    status: 1,
                    photo: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    lastLoginAt: 1,
                    transactionsCount: 1,
                    // REMOVED: orders: 0, // This was the cause of the error!
                    addresses: 1,
                    phone: 1
                }
            }
        ]);

        if (userWithStats.length === 0) {
            console.warn(`User with ID ${id} not found.`);
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'Successfully fetched user data.',
            user: userWithStats[0],
        });
        console.log(`getUserByIdForAdmin: Successfully sent user data for ID: ${id}`);

    } catch (error) {
        console.error('Error in getUserByIdForAdmin:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user data due to a server error.',
            error: error.message
        });
    }
};

exports.getAllProductsForAdmin = async (req, res) => {
    try {
        console.log("Attempting to fetch all products for admin...");

        if (!Product) {
            console.error("ERROR: Product model is not defined!");
            return res.status(500).json({ success: false, message: 'Server configuration error: Product model missing.' });
        }

        const products = await Product.find({}).select('-__v -description');

        console.log(`Successfully fetched ${products.length} products.`);

        res.status(200).json({
            success: true,
            products,
            message: 'Products fetched successfully for admin.'
        });
    } catch (error) {
        console.error('SERVER ERROR in getAllProductsForAdmin:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products due to an internal server error.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getProductByIdForAdmin = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }
        res.status(200).json({ success: true, product });
    } catch (error) {
        console.error('Error in getProductByIdForAdmin:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
    }
};

// Create a new product
exports.createProduct = async (req, res) => {
    try {
        const newProduct = await Product.create(req.body);
        res.status(201).json({ success: true, message: 'Product created successfully.', product: newProduct });
    } catch (error) {
        console.error('Error in createProduct:', error);
        res.status(400).json({ success: false, message: 'Failed to create product.', error: error.message });
    }
};

// Update a product
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }
        res.status(200).json({ success: true, message: 'Product updated successfully.', product });
    } catch (error) {
        console.error('Error in updateProduct:', error);
        res.status(400).json({ success: false, message: 'Failed to update product.', error: error.message });
    }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }
        res.status(200).json({ success: true, message: 'Product deleted successfully.' });
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        res.status(500).json({ success: false, message: 'Failed to delete product.' });
    }
};
