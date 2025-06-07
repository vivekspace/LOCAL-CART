import { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiTrendingUp,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const VendorAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("30");
  const [refreshing, setRefreshing] = useState(false);

  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    newCustomers: 0,
    popularProducts: [],
    salesTrend: [],
    recentOrders: [],
  });

  const fetchAnalytics = async () => {
    try {
      const vendorToken = localStorage.getItem("vendorToken");

      if (!vendorToken) {
        throw new Error("Authentication token not found. Please log in.");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/vendor/analytics`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${vendorToken}`,
          },
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Unknown error`;
        try {
          const errorJson = await response.json();
          errorMessage = `HTTP ${response.status}: ${
            errorJson.message || JSON.stringify(errorJson)
          }`;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = `HTTP ${response.status}: ${errorText.substring(
            0,
            200
          )}...`;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        throw new Error(
          `Expected JSON but got ${contentType}. Response: ${responseText.substring(
            0,
            100
          )}...`
        );
      }

      const data = await response.json();

      setAnalyticsData({
        totalRevenue: data.totalRevenue || 0,
        totalOrders: data.totalOrders || 0,
        newCustomers: data.newCustomers || 0,
        popularProducts: data.popularProducts || [],
        salesTrend: data.salesTrend || [],
        recentOrders: (data.recentOrders || []).map((order) => ({
          orderId: order.orderId || "N/A",
          customerName: order.customerName || "Unknown Customer",
          itemsCount: order.itemsCount || 0,
          amount: order.amount || 0,
          status: order.status || "pending",
          createdAt: order.createdAt || new Date().toISOString(),
        })),
      });
    } catch (err) {
      setError(err.message || "Failed to fetch analytics");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // LocalCart theme colors
  const theme = {
    primary: "#4F46E5", // Indigo-600
    primaryLight: "#6366F1", // Indigo-500
    secondary: "#10B981", // Emerald-500
    accent: "#F59E0B", // Amber-500
    background: "#F9FAFB", // Gray-50
    card: "#FFFFFF", // White
    textPrimary: "#111827", // Gray-900
    textSecondary: "#6B7280", // Gray-500
    success: "#10B981", // Emerald-500
    warning: "#F59E0B", // Amber-500
    error: "#EF4444", // Red-500
  };

  const barColors = [
    theme.primary,
    theme.secondary,
    theme.accent,
    "#8884d8",
    "#82ca9d",
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading your analytics...</p>
          <p className="text-sm text-gray-500">
            LocalCart is crunching the numbers
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6">
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error loading analytics
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiRefreshCw className="mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Track your LocalCart store performance
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <FiRefreshCw
                className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Date Range and Export */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <FiCalendar className="text-gray-500" />
            <select
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">This year</option>
            </select>
          </div>
          <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            <FiDownload className="mr-2" />
            Export Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                <FiDollarSign size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${analyticsData.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <FiTrendingUp className="mr-1" /> 12% from last period
                </p>
              </div>
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
                <FiShoppingCart size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.totalOrders.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <FiTrendingUp className="mr-1" /> 8% from last period
                </p>
              </div>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
                <FiUsers size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">New Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.newCustomers.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <FiTrendingUp className="mr-1" /> 5% from last period
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Sales Trend</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Time Period:</span>
              <select
                className="bg-white border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="365">Year</option>
              </select>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analyticsData.salesTrend}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: theme.textSecondary }}
                  tickMargin={10}
                />
                <YAxis tick={{ fill: theme.textSecondary }} tickMargin={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.card,
                    borderColor: theme.primaryLight,
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={theme.primary}
                  strokeWidth={3}
                  dot={{ r: 4, fill: theme.primary }}
                  activeDot={{ r: 6, fill: theme.primaryLight }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Products */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Top Selling Products
              </h2>
              <span className="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">
                View All
              </span>
            </div>
            <div className="h-80 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.popularProducts.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fill: theme.textSecondary }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: theme.textSecondary }}
                    width={150}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.card,
                      borderColor: theme.primaryLight,
                      borderRadius: "0.5rem",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="orders" barSize={24}>
                    {analyticsData.popularProducts
                      .slice(0, 5)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={barColors[index % barColors.length]}
                        />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Product Breakdown
              </h3>
              {(analyticsData.popularProducts || [])
                .slice(0, 5)
                .map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3 w-5 text-right">
                        {index + 1}.
                      </span>
                      <span className="font-medium text-gray-800 truncate max-w-xs">
                        {product.name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-indigo-600 font-medium mr-3">
                        {product.orders} orders
                      </span>
                      <span className="text-gray-500 text-sm">
                        ${(product.price || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Orders
              </h2>
              <span className="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">
                View All
              </span>
            </div>

            {analyticsData.recentOrders &&
            analyticsData.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.recentOrders.map((order, index) => (
                  <div
                    key={order.orderId || index}
                    className="flex items-start p-4 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="p-2 rounded-full bg-gray-100 text-gray-600 mr-3 flex-shrink-0">
                      <FiShoppingCart size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        Order #{order.orderId} from{" "}
                        {order.customerName || "Customer"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {order.itemsCount} items • ${order.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end ml-4">
                      <div className="text-sm font-medium text-green-600 whitespace-nowrap">
                        ${(order.amount || 0).toFixed(2)}{" "}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full mt-1 whitespace-nowrap ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "processing"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FiShoppingCart
                  size={48}
                  className="mx-auto mb-4 opacity-30 text-indigo-200"
                />
                <p className="text-lg font-medium text-gray-600 mb-1">
                  No recent orders
                </p>
                <p className="text-sm max-w-md mx-auto">
                  Orders from your LocalCart store will appear here once
                  customers make purchases
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiRefreshCw className="mr-2" />
                  Refresh Orders
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalytics;
