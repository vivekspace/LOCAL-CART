import { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiTrendingUp,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiPieChart,
  FiBarChart2,
  FiPackage
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
  AreaChart,
  Area
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
          console.log("error displaying data in analytics " , e)
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

  // Theme colors with refined palette
  const theme = {
    primary: "#5b6bf5", // Soft indigo
    primaryLight: "#e0e7ff", // Light indigo
    secondary: "#10b981", // Emerald
    accent: "#f59e0b", // Amber
    background: "#f8fafc", // Very light slate
    card: "#FFFFFF", // White
    textPrimary: "#1e293b", // Dark slate
    textSecondary: "#64748b", // Slate
    success: "#10b981", // Emerald
    warning: "#f59e0b", // Amber
    error: "#ef4444", // Red
    info: "#3b82f6", // Blue
  };

  const barColors = [
    theme.primary,
    theme.secondary,
    theme.accent,
    "#8b5cf6", // Violet
    "#ec4899", // Pink
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading your analytics...</p>
          <p className="text-sm text-gray-500 animate-pulse">
            Gathering insights from your LocalCart store
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Error loading analytics
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <FiRefreshCw className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md">
              <FiPieChart size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600">
                Insights to grow your LocalCart business
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all duration-200"
            >
              <FiRefreshCw
                className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Date Range and Export */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
              <FiCalendar size={18} />
            </div>
            <select
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 text-sm md:text-base shadow-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">This year</option>
            </select>
          </div>
          <button className="flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200">
            <FiDownload className="mr-2" />
            Export Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Revenue Card */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-indigo-500 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-start">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 mr-4 group-hover:bg-indigo-100 transition-colors duration-200">
                <FiDollarSign size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${analyticsData.totalRevenue.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <FiTrendingUp className="mr-1" /> 12.5%
                  </span>
                  <span className="text-xs text-gray-500 ml-2">vs last period</span>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-emerald-500 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-start">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 mr-4 group-hover:bg-emerald-100 transition-colors duration-200">
                <FiShoppingCart size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analyticsData.totalOrders.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <FiTrendingUp className="mr-1" /> 8.2%
                  </span>
                  <span className="text-xs text-gray-500 ml-2">vs last period</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-amber-500 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-start">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 mr-4 group-hover:bg-amber-100 transition-colors duration-200">
                <FiUsers size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">New Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analyticsData.newCustomers.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <FiTrendingUp className="mr-1" /> 5.7%
                  </span>
                  <span className="text-xs text-gray-500 ml-2">vs last period</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Sales Performance</h2>
              <p className="text-sm text-gray-500">Revenue trends over time</p>
            </div>
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
              {["7", "30", "90", "365"].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                    dateRange === range
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {range === "365" ? "Year" : `${range}D`}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analyticsData.salesTrend}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.primary} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: theme.textSecondary, fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis
                  tick={{ fill: theme.textSecondary, fontSize: 12 }}
                  tickMargin={10}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.card,
                    borderColor: theme.primaryLight,
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value) => [`$${value}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={theme.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUv)"
                  activeDot={{ r: 6, fill: theme.primary }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Popular Products */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Top Products</h2>
                <p className="text-sm text-gray-500">By number of orders</p>
              </div>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                View All <span className="ml-1">→</span>
              </button>
            </div>
            
            <div className="h-72 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.popularProducts.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    tick={{ fill: theme.textSecondary, fontSize: 12 }}
                    tickFormatter={(value) => `${value} orders`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: theme.textSecondary }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.card,
                      borderColor: theme.primaryLight,
                      borderRadius: "0.5rem",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value) => [`${value} orders`, "Product"]}
                  />
                  <Bar dataKey="orders" barSize={20} radius={[0, 4, 4, 0]}>
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
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <FiBarChart2 className="mr-2" /> Product Performance
              </h3>
              <div className="space-y-3">
                {(analyticsData.popularProducts || [])
                  .slice(0, 5)
                  .map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-3 w-5 text-right font-medium">
                          {index + 1}.
                        </span>
                        <span className="font-medium text-gray-800 truncate max-w-[180px]">
                          {product.name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-indigo-600 font-medium mr-3">
                          {product.orders} orders
                        </span>
                        <span className="text-gray-500 text-sm bg-gray-50 px-2 py-1 rounded">
                          ${(product.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
                <p className="text-sm text-gray-500">Latest customer purchases</p>
              </div>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                View All <span className="ml-1">→</span>
              </button>
            </div>

            {analyticsData.recentOrders && analyticsData.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.recentOrders.map((order, index) => (
                  <div
                    key={order.orderId || index}
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
                  >
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mr-3 flex-shrink-0">
                      <FiPackage size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-800 truncate">
                          Order #{order.orderId}
                        </p>
                        <span className="text-sm font-medium text-gray-900 ml-2 whitespace-nowrap">
                          ${order.amount.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {order.customerName || "Customer"} • {order.itemsCount} items
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
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
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <FiShoppingCart
                    size={32}
                    className="text-indigo-300"
                  />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No recent orders
                </h3>
                <p className="text-sm max-w-md mx-auto text-gray-500 mb-6">
                  Orders from your store will appear here once customers make purchases
                </p>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
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