const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

exports.getVendorDashboard = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.vendor._id);
    console.log('Vendor ID:', vendorId);

    // Assuming your Product schema has 'seller' field
    const totalProducts = await Product.countDocuments({ seller: vendorId });
    console.log('Total Products:', totalProducts);

    // Assuming your Order schema has 'cartItems' which is an array
    // and each item in cartItems has a 'seller' field
    const totalOrders = await Order.countDocuments({ 'cartItems.seller': vendorId });
    console.log('Total Orders:', totalOrders);

    // Delivered orders (considering 'delivered' and 'completed' as final states)
    const deliveredOrders = await Order.countDocuments({
      'cartItems.seller': vendorId,
      status: { $in: ['delivered', 'completed'] } // Use actual statuses from your DB
    });
    console.log('Delivered Orders:', deliveredOrders);

    // Pending orders
    const pendingOrders = await Order.countDocuments({
      'cartItems.seller': vendorId,
      status: { $in: ['pending', 'processing', 'shipped'] } // Adjust based on your actual pending/in-progress statuses
    });
    console.log('Pending Orders:', pendingOrders);


    // Total sales from delivered items for this vendor
    const salesAggregationResult = await Order.aggregate([
      {
        $match: {
          'cartItems.seller': vendorId,
          status: { $in: ['delivered', 'completed'] } // Only count sales from delivered/completed orders
        }
      },
      { $unwind: '$cartItems' }, // Deconstruct the cartItems array
      {
        $match: {
          'cartItems.seller': vendorId // Make sure we only sum for this vendor's items
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

    // Get active and out of stock products
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
      .sort({ salesCount: -1 }) // Sort by actual sales count if available
      // .sort({ stock: -1 }) // Fallback if no salesCount, shows highest stock
      .limit(5)
      .select('name price images stock'); // Include stock if sorting by it


    const formattedTopProducts = topProducts.map(p => ({
      id: p._id,
      name: p.name,
      price: p.price,
      sales: p.salesCount || 0, // Assume salesCount exists, otherwise adjust
      images: p.images, // Assuming images is an array of strings
    }));
    console.log('Top Products:', formattedTopProducts);


    // Conversion Rate
    const conversionRate = totalOrders > 0 ?
      ((deliveredOrders / totalOrders) * 100).toFixed(2) : '0.00';
    console.log('Conversion Rate:', conversionRate);


    // --- Sales Chart Data (Generate dummy data for the last 7 days for now) ---
    // You would typically fetch and aggregate real daily/weekly sales data here
    const salesChartLabels = [];
    const salesChartDataValues = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    for (let i = 6; i >= 0; i--) { // Last 7 days, including today
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = `${d.getMonth() + 1}/${d.getDate()}`; // MM/DD format
      salesChartLabels.push(dateString);
      // Assign some dummy sales value or integrate real data aggregation here
      // Example: A random value for demonstration
      salesChartDataValues.push(Math.floor(Math.random() * (2500 - 500 + 1)) + 500);
    }



    // --- Recent Orders ---
    // Fetch recent orders for this vendor's items
    const recentOrders = await Order.find({ 'cartItems.seller': vendorId })
      .sort({ createdAt: -1 }) // Latest orders first
      .limit(5) // Get the 5 most recent
      .populate('customerId', 'firstname lastname') // <-- CHANGE THIS LINE
      .select('orderId status totalAmount createdAt cartItems.name cartItems.price cartItems.quantity'); // Select relevant fields

    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.orderId || order._id, // Use orderId if present, else _id
      customer: order.user ? order.user.name : 'Guest User', // Get customer name
      amount: order.totalAmount, // Assuming totalAmount is available on Order
      status: order.status,
      // You might want to include a summary of items, but the frontend table only shows ID, Customer, Amount, Status
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
        pendingOrders, // Added pending orders
        totalSales,
        conversionRate,
        topProducts: formattedTopProducts, // Ensure this is formatted
        salesChartData: { // Correct format for frontend
          labels: salesChartLabels,
          data: salesChartDataValues
        },
        recentOrders: formattedRecentOrders, // Added recent orders
        // Add any other dashboard metrics you need
        totalCustomers: 0, // Placeholder, implement logic if needed
        totalRevenue: totalSales, // Use totalSales as totalRevenue
        averageOrderValue: totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : '0.00',
        totalReviews: 0, // Placeholder
        averageRating: '0.00' // Placeholder
      }
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};