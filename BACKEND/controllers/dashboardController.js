const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

exports.getVendorDashboard = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.vendor._id);
    console.log('Vendor ID:', vendorId);

    // Fix: Change 'vendor' to 'seller' throughout
    const totalProducts = await Product.countDocuments({ seller: vendorId });
    console.log('Total Products:', totalProducts);

    // Also fix the orders query - should match your Order schema
    const totalOrders = await Order.countDocuments({ 'cartItems.seller': vendorId });
    console.log('Total Orders:', totalOrders);

    // Delivered orders
    const deliveredOrders = await Order.countDocuments({
      'cartItems.seller': vendorId,
      status: { $in: ['delivered', 'completed'] }
    });
    console.log('Delivered Orders:', deliveredOrders);

    // Total sales from delivered items
    const salesData = await Order.aggregate([
      {
        $match: {
          'cartItems.seller': vendorId,
          status: 'delivered'
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

    const totalSales = salesData[0]?.total || 0;

    // Get active and out of stock products
    const activeProducts = await Product.countDocuments({
      seller: vendorId,
      stock: { $gt: 0 }
    });

    const outOfStockProducts = await Product.countDocuments({
      seller: vendorId,
      stock: { $lte: 0 }
    });

    // Get top products for the dashboard
    const topProducts = await Product.find({ seller: vendorId })
      .sort({ stock: -1 })
      .limit(5)
      .select('name price stock images category');

    // Conversion Rate
    const conversionRate = totalOrders > 0 ?
      ((deliveredOrders / totalOrders) * 100).toFixed(2) : '0.00';

    // Mock sales chart data (you can replace this with real daily/weekly sales data)
    const salesChartData = [
      { date: '2025-05-26', sales: 1200 },
      { date: '2025-05-27', sales: 1500 },
      { date: '2025-05-28', sales: 800 },
      { date: '2025-05-29', sales: 2000 },
      { date: '2025-05-30', sales: 1700 },
      { date: '2025-06-01', sales: 2200 },
    ];

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        totalOrders,
        deliveredOrders,
        totalSales,
        conversionRate,
        topProducts,
        salesChartData
      }
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};