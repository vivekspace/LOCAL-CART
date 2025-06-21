// controllers/dashboardController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User'); 
const Vendor = require('../models/Vendor'); 
const mongoose = require('mongoose');

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
            .populate('customerId', 'firstname lastname') // Ensure 'customerId' is the correct field in your Order model
            .select('orderId status totalAmount createdAt cartItems.name cartItems.price cartItems.quantity');

        const formattedRecentOrders = recentOrders.map(order => ({
            id: order.orderId || order._id,
            customer: order.customerId ? `${order.customerId.firstname || ''} ${order.customerId.lastname || ''}`.trim() : 'Guest User', // Correctly access populated fields
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
        // Generate real sales data if possible, or dummy for testing
        const salesOverviewLabels = [];
        const salesOverviewDataValues = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

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
            .populate('customerId', 'firstname lastname') // Ensure 'customerId' is the correct field in your Order model linking to User
            .select('orderId status totalAmount createdAt'); // Select necessary fields for the table

        const formattedRecentOrders = recentOrders.map(order => ({
            id: order.orderId || order._id, // Use orderId if present, else _id
            customer: order.customerId ? `${order.customerId.firstname || ''} ${order.customerId.lastname || ''}`.trim() : 'Guest User',
            amount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt // Or format as needed
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
                    sales: salesOverviewDataValues, // Frontend expects 'sales' array
                },

                // Order Status Chart Data
                orderStatus: {
                    labels: orderStatusLabels,
                    counts: orderStatusValues, // Frontend expects 'counts' array
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
                    from: Order.collection.name, // The collection name for your Order model
                    localField: '_id',          // Field from the User model
                    foreignField: 'customerId', // Field from the Order model that links to User
                    as: 'orders'                // Name of the array field to add to the User documents
                }
            },
            {
                $addFields: {
                    transactionsCount: { $size: '$orders' }, // Count the number of orders
                    // You can calculate other stats here too if needed
                }
            },
            {
                $project: {
                    // Select the fields you want to send to the frontend
                    _id: 1,
                    name: 1,
                    email: 1,
                    role: 1,
                    photo: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    lastLoginAt: 1, // Include the new field
                    transactionsCount: 1, // Include the calculated count
                    // Do NOT include 'password'
                    // addresses: 1, // Include if you want to send addresses
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: usersWithStats.length,
            users: usersWithStats // Send the array of users with added stats
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
        console.log(`getUserByIdForAdmin: Fetching user with ID: ${id}`);

        // You can use aggregation here too if you need transactionsCount for single user
        const userWithStats = await User.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } }, // Match by ID
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
                    status: 1, // Crucial for UserDetailPage also!
                    photo: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    lastLoginAt: 1,
                    transactionsCount: 1,
                    orders: 0, // Remove the intermediate array
                    // Add any other fields you want to display on the detail page
                    addresses: 1, // Example
                    phone: 1 // Example
                }
            }
        ]);

        if (userWithStats.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'Successfully fetched user data.',
            user: userWithStats[0], // Send the single user object
        });
        console.log(`getUserByIdForAdmin: Successfully sent user data for ID: ${id}`);

    } catch (error) {
        console.error('Error in getUserByIdForAdmin:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user data.',
            error: error.message
        });
    }
};

exports.getAllProductsForAdmin = async (req, res) => {
    try {
        // Log to see if this function is even being hit by the request
        console.log("Attempting to fetch all products for admin...");

        // Make sure your Product model is correctly imported and defined
        if (!Product) {
            console.error("ERROR: Product model is not defined!");
            return res.status(500).json({ success: false, message: 'Server configuration error: Product model missing.' });
        }

        const products = await Product.find({}).select('-__v -description');

        // Log the number of products found
        console.log(`Successfully fetched ${products.length} products.`);

        res.status(200).json({
            success: true,
            products,
            message: 'Products fetched successfully for admin.'
        });
    } catch (error) {
        // This catch block will specifically log what's going wrong on the server
        console.error('SERVER ERROR in getAllProductsForAdmin:', error);
        // Include error details in the response for debugging, but remove in production
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products due to an internal server error.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined // Only send detailed error in dev
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
        // Implement logic to save product, handle image uploads etc.
        const newProduct = await Product.create(req.body); // Simplified, assume req.body has all product fields
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