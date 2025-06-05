import { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";

const VendorAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    newCustomers: 0,
    popularProducts: [],
    salesTrend: [],
  });

  // Fetch analytics data from your API
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/vendor/analytics", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Add authorization header if needed
            // 'Authorization': `Bearer ${your_token}`,
          },
          credentials: "include", // Include cookies if needed for auth
        });

        // Log the response for debugging
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        if (!response.ok) {
          // Get the actual error response
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(
            `HTTP ${response.status}: ${errorText.substring(0, 100)}...`
          );
        }

        // Check if response is actually JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const responseText = await response.text();
          console.error("Non-JSON response:", responseText.substring(0, 200));
          throw new Error(
            `Expected JSON but got ${contentType}. Response: ${responseText.substring(
              0,
              100
            )}...`
          );
        }

        const data = await response.json();
        console.log("API Response:", data);

        // Ensure the response has the expected structure
        setAnalyticsData({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          newCustomers: data.newCustomers || 0,
          popularProducts: data.popularProducts || [],
          salesTrend: data.salesTrend || [],
        });
      } catch (err) {
        setError(err.message || "Failed to fetch analytics");
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Safe chart configuration with null checks
  // const salesChartOptions = {
  //   chart: {
  //     type: "area",
  //     height: 350,
  //     toolbar: {
  //       show: false,
  //     },
  //   },
  //   colors: ["#10B981"],
  //   dataLabels: {
  //     enabled: false,
  //   },
  //   stroke: {
  //     curve: "smooth",
  //   },
  //   xaxis: {
  //     type: "datetime",
  //     categories: (analyticsData.salesTrend || []).map((item) => item.date),
  //   },
  //   tooltip: {
  //     x: {
  //       format: "dd MMM yyyy",
  //     },
  //   },
  // };

  // const salesChartSeries = [
  //   {
  //     name: "Sales",
  //     data: (analyticsData.salesTrend || []).map((item) => item.amount),
  //   },
  // ];

  // const productChartOptions = {
  //   chart: {
  //     type: "bar",
  //     height: 350,
  //     toolbar: {
  //       show: false,
  //     },
  //   },
  //   colors: ["#3B82F6"],
  //   plotOptions: {
  //     bar: {
  //       borderRadius: 4,
  //       horizontal: true,
  //     },
  //   },
  //   dataLabels: {
  //     enabled: false,
  //   },
  //   xaxis: {
  //     categories: (analyticsData.popularProducts || []).map(
  //       (product) => product.name
  //     ),
  //   },
  // };

  // const productChartSeries = [
  //   {
  //     name: "Orders",
  //     data: (analyticsData.popularProducts || []).map(
  //       (product) => product.orders
  //     ),
  //   },
  // ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Analytics Dashboard
      </h1>

      {/* Date Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <FiCalendar className="text-gray-500" />
          <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
        </div>
        <button className="bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
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

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
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

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
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
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Sales Trend
        </h2>
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrendingUp className="text-green-600" size={24} />
            </div>
            <p className="text-gray-600">
              Sales trend chart would display here
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {(analyticsData.salesTrend || []).length} data points available
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Top Selling Products
          </h2>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg mb-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShoppingCart className="text-blue-600" size={24} />
              </div>
              <p className="text-gray-600">Product chart would display here</p>
            </div>
          </div>
          <div className="mt-4">
            {(analyticsData.popularProducts || [])
              .slice(0, 5)
              .map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-100"
                >
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">{index + 1}.</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <span className="text-blue-600 font-medium">
                    {product.orders} orders
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex items-start pb-4 border-b border-gray-100"
              >
                <div className="p-2 rounded-full bg-gray-100 text-gray-600 mr-3">
                  <FiShoppingCart size={16} />
                </div>
                <div>
                  <p className="font-medium">New order #{1000 + item}</p>
                  <p className="text-sm text-gray-500">
                    Customer ordered 3 items
                  </p>
                  <p className="text-xs text-gray-400">2 hours ago</p>
                </div>
                <div className="ml-auto text-sm font-medium text-green-600">
                  ${(25 * item).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalytics;
