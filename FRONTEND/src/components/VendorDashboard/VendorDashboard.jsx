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
  FiBox, // For total products
  FiClock, // For pending orders
  FiMessageSquare, // For total reviews
  FiAward, // For average rating
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
    pendingOrders: 0, // New
    totalSales: 0,
    totalCustomers: 0, // New
    totalRevenue: 0, // New
    averageOrderValue: 0, // New
    totalReviews: 0, // New
    averageRating: "0.00", // New
    conversionRate: "0.00",
    topProducts: [],
    salesChartData: { labels: [], data: [] }, // Initialize with empty arrays
    recentOrders: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("vendorToken");

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

        // Assuming the API returns data directly or under a 'data' key
        setDashboardData(response.data.data || response.data);
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
  }, []); // Empty dependency array means this effect runs once on mount

  // Prepare data for the sales chart
  const salesChartConfig = {
    labels: dashboardData.salesChartData.labels,
    datasets: [
      {
        label: "Sales",
        data: dashboardData.salesChartData.data,
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.1)", // Green-ish background
        borderColor: "#10b981", // Green border
        tension: 0.4, // Smooth curve
        pointRadius: 4,
        pointBackgroundColor: "#10b981",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allows chart to fill container
    plugins: {
      legend: { display: false }, // Hide legend
      title: { display: false }, // Hide title
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#6b7280" }, // Gray ticks
        grid: { color: "#e5e7eb" }, // Light gray grid lines
      },
      x: {
        ticks: { color: "#6b7280" },
        grid: { display: false }, // Hide x-axis grid lines
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading your dashboard...</p>
          <p className="text-sm text-gray-500">
            LocalCart is crunching the infomation
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg max-w-xl mx-auto mt-10 shadow-md">
        <h2 className="text-lg font-semibold mb-2">Error Loading Dashboard</h2>
        <p>{error}</p>
        <p className="mt-4 text-sm">
          Please ensure you are logged in and the API server is running.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex lg:flex-row flex-col justify-between items-center">
          <div className="flex justify-center items-center gap-3">
          <LayoutDashboard className="inline bg-green-600 text-white rounded p-1" size={35}/>
          <h1 className="text-3xl font-bold text-green-600">Vendor Dashboard</h1>
          </div>
          <div className="flex items-center lg:md:mt-0 mt-2 space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
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
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FiDollarSign className="w-6 h-6" />}
            title="Total Revenue"
            value={`₹${dashboardData?.totalRevenue?.toFixed(2) ?? "0.00"}`}
            change="+12.5%" // Placeholder, ideally from API
            changeType="increase" // Placeholder, ideally from API
          />
          <StatCard
            icon={<FiShoppingCart className="w-6 h-6" />}
            title="Total Orders"
            value={dashboardData?.totalOrders ?? 0}
            change="+5.2%" // Placeholder
            changeType="increase" // Placeholder
          />
          <StatCard
            icon={<FiPackage className="w-6 h-6" />}
            title="Total Products"
            value={dashboardData?.totalProducts ?? 0}
            change="+3.0%" // Placeholder
            changeType="increase" // Placeholder
          />
          <StatCard
            icon={<FiUsers className="w-6 h-6" />}
            title="Total Customers"
            value={dashboardData?.totalCustomers ?? 0}
            change="+8.1%" // Placeholder
            changeType="increase" // Placeholder
          />
          <StatCard
            icon={<FiClock className="w-6 h-6" />}
            title="Pending Orders"
            value={dashboardData?.pendingOrders ?? 0}
            change="-2.1%" // Placeholder
            changeType="decrease" // Placeholder
          />
          <StatCard
            icon={<FiTrendingUp className="w-6 h-6" />}
            title="Conversion Rate"
            value={`${dashboardData?.conversionRate ?? "0.00"}%`}
            change="+0.7%" // Placeholder
            changeType="increase" // Placeholder
          />
          <StatCard
            icon={<FiMessageSquare className="w-6 h-6" />}
            title="Total Reviews"
            value={dashboardData?.totalReviews ?? 0}
            change="+15.0%" // Placeholder
            changeType="increase" // Placeholder
          />
          <StatCard
            icon={<FiStar className="w-6 h-6" />}
            title="Average Rating"
            value={`${dashboardData?.averageRating ?? "0.00"}/5`}
            change="+0.1" // Placeholder
            changeType="increase" // Placeholder
          />
        </div>

        {/* Charts and Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Sales Overview
              </h2>
              <select className="border rounded-md px-3 py-1 text-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="h-80">
              {" "}
              {/* Removed bg-gray-50, Chart.js renders its own background */}
              {dashboardData.salesChartData?.labels?.length > 0 ? (
                <Line data={salesChartConfig} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No sales data available for the selected period.
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Top Products
            </h2>
            <div className="space-y-4">
              {(dashboardData.topProducts &&
              Array.isArray(dashboardData.topProducts)
                ? dashboardData.topProducts
                : []
              ).length > 0 ? (
                (dashboardData.topProducts || []).map((product) => (
                  <div key={product.id} className="flex items-center">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center mr-4 overflow-hidden">
                      <img
                        className="w-full h-full object-cover" // Ensure image covers the area
                        src={
                          product.images?.[0]
                            ? `${import.meta.env.VITE_API_URL}/uploads/${
                                product.images[0]
                              }`
                            : `/default-product.png` // Fallback if no image or error
                        }
                        alt={product.name}
                        onError={(e) => {
                          console.log("Image failed to load:", e.target.src);
                          e.target.src = `/default-product.png`; // Set a local fallback image
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {product.sales} sales
                      </p>
                    </div>
                    <div className="text-green-600 font-medium">
                      ₹{product.price?.toFixed(2) ?? "0.00"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No top products to display.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Recent Orders
            </h2>
            <Link
              to="/vendor/orders" // Changed to a more appropriate route for vendor orders
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {dashboardData.recentOrders &&
            dashboardData.recentOrders.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Order ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(dashboardData.recentOrders || []).map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{order.amount?.toFixed(2) ?? "0.00"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "Shipped"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800" // Default for other statuses
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/vendor/orders/${order.id}`} // Changed to vendor specific order detail route
                          className="text-green-600 hover:text-green-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-gray-500 text-center py-4">
                No recent orders to display.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Stat Card Component (remains largely the same)
const StatCard = ({ icon, title, value, change, changeType }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center">
        <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      <div
        className={`mt-4 text-sm ${
          changeType === "increase" ? "text-green-600" : "text-red-600"
        }`}
      >
        <span className="inline-flex items-center">
          {changeType === "increase" ? (
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          )}
          {change}
        </span>
        <span className="ml-1 text-gray-500">vs last period</span>
      </div>
    </div>
  );
};

export default Dashboard;
