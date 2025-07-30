import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  FiPackage,
  FiDollarSign,
  FiUsers,
  FiShoppingCart,
  FiStar,
  FiTrendingUp,
  FiBox,
  FiClock,
  FiMessageSquare,
  FiAward,
} from "react-icons/fi";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { LayoutDashboard } from "lucide-react";
import { motion ,AnimatePresence } from "framer-motion";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    activeProducts: 0,
    outOfStockProducts: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalReviews: 0,
    averageRating: "0.00",
    conversionRate: "0.00",
    topProducts: [],
    salesChartData: { labels: [], data: [] },
    recentOrders: [],
  });

  console.log(dashboardData)

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("Last 7 days");

  // New states for the Order Details Modal
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        // --- FIX START ---
        // Change "vendorToken" to "jwtToken" to match what's stored in localStorage
        const token = localStorage.getItem("jwtToken"); 
        // --- FIX END ---

        if (!token) {
          setError("Authentication token not found. Please log in.");
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/vendor/dashboard`,
          config
        );

        setDashboardData(response.data.data || response.data);
        console.log("Dashboard data fetched successfully:", response.data.data || response.data);
      } catch (error) {
        console.error(
          "Dashboard fetch error:",
          error.response?.data || error.message
        );
        setError(
          error.response?.data?.message ||
            "Failed to fetch dashboard data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Function to handle opening the order details modal
  const handleViewDetailsClick = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  // Function to handle closing the order details modal
  const closeOrderDetailsModal = () => {
    setShowOrderDetailsModal(false);
    setSelectedOrder(null);
  };

  // Prepare data for the sales chart
  const salesChartConfig = {
    labels: dashboardData.salesChartData.labels,
    datasets: [
      {
        label: "Sales",
        data: dashboardData.salesChartData.data,
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "#10b981",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#10b981",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1F2937",
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `₹${context.raw.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          color: "#6b7280",
          callback: function(value) {
            return `₹${value}`;
          }
        },
        grid: { 
          color: "#e5e7eb",
          drawBorder: false,
        },
      },
      x: {
        ticks: { color: "#6b7280" },
        grid: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <div className="text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"
          />
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-700 font-medium"
          >
            Loading your dashboard...
          </motion.p>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-gray-500 mt-1"
          >
            LocalCart is crunching the information
          </motion.p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-6 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-xl max-w-xl mx-auto mt-10 shadow-lg border border-red-100"
      >
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Error Loading Dashboard
        </h2>
        <p className="mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm"
      >
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex lg:flex-row flex-col justify-between items-center">
          <div className="flex justify-center items-center gap-3">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <LayoutDashboard className="inline bg-gradient-to-r from-indigo-500 to-indigo-500 text-white rounded-lg p-2" size={35}/>
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
              Vendor Dashboard
            </h1>
          </div>
          <div className="flex items-center lg:md:mt-0 mt-2 space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64 transition-all duration-200 focus:w-72"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors relative">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
            </button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            icon={<FiDollarSign className="w-6 h-6" />}
            title="Total Revenue"
            value={`₹${dashboardData?.totalRevenue?.toLocaleString('en-IN') ?? "0"}`}
            change="+12.5%"
            changeType="increase"
            color="from-indigo-500 to-indigo-500"
            delay={0.1}
          />
          <StatCard
            icon={<FiShoppingCart className="w-6 h-6" />}
            title="Total Orders"
            value={dashboardData?.totalOrders?.toLocaleString('en-IN') ?? 0}
            change="+5.2%"
            changeType="increase"
            color="from-blue-500 to-cyan-500"
            delay={0.2}
          />
          <StatCard
            icon={<FiPackage className="w-6 h-6" />}
            title="Total Products"
            value={dashboardData?.totalProducts?.toLocaleString('en-IN') ?? 0}
            change="+3.0%"
            changeType="increase"
            color="from-purple-500 to-indigo-500"
            delay={0.3}
          />
          <StatCard
            icon={<FiUsers className="w-6 h-6" />}
            title="Total Customers"
            value={dashboardData?.totalCustomers?.toLocaleString('en-IN') ?? 0}
            change="+8.1%"
            changeType="increase"
            color="from-amber-500 to-yellow-500"
            delay={0.4}
          />
          <StatCard
            icon={<FiClock className="w-6 h-6" />}
            title="Pending Orders"
            value={dashboardData?.pendingOrders?.toLocaleString('en-IN') ?? 0}
            change="-2.1%"
            changeType="decrease"
            color="from-orange-500 to-red-500"
            delay={0.5}
          />
          <StatCard
            icon={<FiTrendingUp className="w-6 h-6" />}
            title="Conversion Rate"
            value={`${dashboardData?.conversionRate ?? "0.00"}%`}
            change="+0.7%"
            changeType="increase"
            color="from-cyan-500 to-blue-500"
            delay={0.6}
          />
          <StatCard
            icon={<FiMessageSquare className="w-6 h-6" />}
            title="Total Reviews"
            value={dashboardData?.totalReviews?.toLocaleString('en-IN') ?? 0}
            change="+15.0%"
            changeType="increase"
            color="from-violet-500 to-purple-500"
            delay={0.7}
          />
          <StatCard
            icon={<FiStar className="w-6 h-6" />}
            title="Average Rating"
            value={`${dashboardData?.averageRating ?? "0.00"}/5`}
            change="+0.1"
            changeType="increase"
            color="from-pink-500 to-rose-500"
            delay={0.8}
          />
        </motion.div>

        {/* Charts and Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow lg:col-span-2 border border-gray-100"
                >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                  Sales Overview
                  </h2>
                  <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="border rounded-md px-3 py-1 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>This Year</option>
                  </select>
                </div>
                <div className="h-80 ">
                  {dashboardData.salesChartData?.labels?.length > 0 ? (
                  <Line 
                    data={{
                    ...salesChartConfig,
                    datasets: [
                      {
                      ...salesChartConfig.datasets[0],
                  borderColor: "#6366f1", 
                  pointBackgroundColor: "#6366f1",
                      },
                    ],
                    }} 
                    options={chartOptions} 
                  />
                  ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2">No sales data available</p>
                    <p className="text-sm text-gray-400">for the selected period</p>
                    </div>
                  </div>
                  )}
                </div>
                </motion.div>

                {/* Top Products */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Top Products
              </h2>
              <Link
                to="/vendor/products"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {(dashboardData.topProducts || []).length > 0 ? (
                (dashboardData.topProducts || []).map((product, index) => (
                  <motion.div 
                    key={product.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="relative w-12 h-12 rounded-md flex-shrink-0 overflow-hidden bg-gray-100">
                      <img
                        className="w-full h-full object-cover"
                        src={
                          product.images?.[0]
                            ? product.images[0]?.url
                            : `/default-product.png`
                        }
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = `${import.meta.env.VITE_API_URL}/uploads/default-product.png`;
                        }}
                      />
                      {index < 3 && (
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white 
                          ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'}`}>
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 ml-4 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center text-yellow-400">
                          <FiStar className="w-3 h-3 fill-current" />
                          <span className="text-xs text-gray-500 ml-1">
                            {product.rating || "0.0"}
                          </span>
                        </div>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-xs text-gray-500">
                          {product.sales || 0} sales
                        </span>
                      </div>
                    </div>
                    <div className="text-indigo-600 font-medium ml-4">
                      ₹{product.price?.toLocaleString('en-IN') || "0"}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="mt-2 text-gray-500">No top products to display</p>
                  <p className="text-sm text-gray-400">for the selected period</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Orders */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100 ">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FiBox className="text-indigo-500" /> Recent Orders
            </h2>
            <Link
              to="/vendor/order"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider rounded-tl-xl">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider rounded-tr-xl">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {(dashboardData.recentOrders || []).map((order, index) => (
                    <motion.tr 
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 * index }}
                      className="hover:bg-indigo-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                        <span className="inline-block bg-indigo-100 rounded-full px-3 py-1 text-xs font-semibold shadow">
                          #{order.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400 flex items-center justify-center text-white font-bold shadow">
                            {order.customer?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {order.customer || "Customer Name Unavailable"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.customerEmail || order.email || "Email Unavailable"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.createdAt ? (
                          <span className="bg-gray-50 rounded px-2 py-1 text-xs font-medium">
                            {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        ) : "Date Unavailable"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700">
                        ₹{order.amount?.toLocaleString('en-IN') || "0"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetailsClick(order)}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-white hover:bg-indigo-600 transition-colors px-3 py-1 rounded-lg border border-indigo-100 shadow-sm font-semibold"
                        >
                          <FiAward className="w-4 h-4" />
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-lg font-bold text-indigo-700">No orders yet</h3>
                <p className="mt-1 text-gray-500">Your recent orders will appear here</p>
              </div>
            )}
          </div>
        </motion.div>
        </main>

      {showOrderDetailsModal && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={closeOrderDetailsModal} />
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    Delivered: {
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      icon: (
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ),
    },
    Shipped: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      icon: (
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
        </svg>
      ),
    },
    Pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      icon: (
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
    },
    Cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: (
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      ),
    },
    default: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      icon: (
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const config = statusConfig[status] || statusConfig.default;

  return (
    <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.icon}
      {status || "Processing"}
    </span>
  );
};

const StatCard = ({ icon, title, value, change, changeType, color = "from-indigo-500 to-indigo-500", delay = 0 }) => {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${color} text-white mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
      </div>
      <div
        className={`mt-4 text-sm flex items-center ${
          changeType === "increase" ? "text-indigo-600" : "text-red-600"
        }`}
      >
        {changeType === "increase" ? (
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span>{change}</span>
        <span className="ml-1 text-gray-500">vs last period</span>
      </div>
    </motion.div>
  );
};

// New Modal Component for Order Details
const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null; // Ensure an order object is provided

  // Fallback for image URL if VITE_API_URL is not set
  const apiBaseUrl = import.meta.env.VITE_API_URL || ''; 
  const defaultProductImage = `${apiBaseUrl}/uploads/default-product.png`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50 overflow-y-auto" // Added overflow-y-auto for smaller screens
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md md:max-w-xl lg:max-w-3xl relative max-h-[95vh] overflow-y-auto transform scale-100" // Increased max-width, padding
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors duration-200 text-3xl font-light leading-none"
            aria-label="Close"
          >
            &times;
          </button>

          {/* Header */}
          <h2 className="text-3xl font-extrabold mb-6 text-gray-900 border-b-2 border-indigo-500 pb-3">
            Order Details <span className="text-indigo-600">#{order.id.slice(0, 12)}....</span>
          </h2>

          {/* Order Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-6 text-gray-700 mb-8">
            {/* Customer Details */}
            <div>
              <p className="font-bold text-gray-800 mb-1">Customer Name:</p>
              <p className="text-lg">{order.customer || "N/A"}</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Customer Email:</p>
              <p className="text-lg">{order.customerEmail || "N/A"}</p>
            </div>

            {/* Order Info */}
            <div>
              <p className="font-bold text-gray-800 mb-1">Order Date:</p>
              <p className="text-lg">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : "N/A"}
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Order Status:</p>
              <StatusBadge status={order.status} className="inline-block mt-1" /> {/* Add margin-top for alignment */}
            </div>

            {/* Payment Info */}
            <div>
              <p className="font-bold text-gray-800 mb-1">Payment Method:</p>
              <p className="text-lg capitalize">{order.paymentMethod || "N/A"}</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Payment Status:</p>
              <StatusBadge status={order.paymentStatus} className="inline-block mt-1" />
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-gray-50 p-5 rounded-lg mb-8 shadow-inner">
              <h3 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">Shipping Address:</h3>
              <p>{order.shippingAddress.street || "N/A"}</p>
              <p>{order.shippingAddress.city || "N/A"}, {order.shippingAddress.state || "N/A"} - {order.shippingAddress.zip || "N/A"}</p>
              <p>{order.shippingAddress.country || "India"}</p>
            </div>
          )}

          {/* Ordered Items */}
          {order.items && order.items.length > 0 ? (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Items in this Order:</h3>
              <ul className="space-y-4">
                {order.items.map((item, index) => (
                  <li key={index} className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                    <img 
                      src={item.image ? `${apiBaseUrl}/uploads/${item.image}` : defaultProductImage} 
                      alt={item.name} 
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-gray-200" 
                      onError={(e) => { e.target.src = defaultProductImage; }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-lg">{item.name}</p>
                      <p className="text-md text-gray-600">Quantity: <span className="font-medium">{item.quantity}</span></p>
                      <p className="text-md text-gray-600">Unit Price: <span className="font-medium">₹{(item.price || 0).toLocaleString('en-IN')}</span></p>
                    </div>
                    <div className="flex-shrink-0 text-right sm:w-auto w-full">
                        <span className="font-bold text-indigo-700 text-xl">
                            ₹{((item.quantity || 0) * (item.price || 0)).toLocaleString('en-IN')}
                        </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-6 text-gray-500 text-center text-lg py-4 border-t">No items listed for this order.</p>
          )}

          {/* Pricing Summary (Optional - if you want to show overall subtotal, tax, etc.) */}
          {order.overallSubtotal !== undefined && ( // Check for existence of any pricing field
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Order Pricing Summary:</h3>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between items-center text-lg">
                  <p>Subtotal:</p>
                  <p>₹{(order.overallSubtotal || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <p>Tax:</p>
                  <p>₹{(order.overallTax || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <p>Shipping Cost:</p>
                  <p>₹{(order.overallShippingCost || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <p>Discount:</p>
                  <p>-₹{(order.overallDiscount || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex justify-between items-center font-bold text-xl text-indigo-700 border-t pt-3 mt-3">
                  <p>Total Paid:</p>
                  <p>₹{(order.overallTotalAmount || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );


};

export default Dashboard;