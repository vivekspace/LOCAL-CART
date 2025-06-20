// controllers/dashboardController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User'); // Assuming you have a User model for customers
const Vendor = require('../models/Vendor'); // Assuming you have a Vendor model for vendors
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
