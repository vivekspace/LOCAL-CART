// src/components/AdminPanel/AdminPanel.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { format } from "date-fns";
import axios from "axios";
import {
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  Search,
  Plus,
  Trash,
  Edit,
  Check,
  X,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth); // State to track screen width

  const [dashboardStats, setDashboardStats] = useState({
    totalSales: "0.00",
    orders: "0",
    customers: "0",
    products: "0",
    salesChange: "+0%",
    salesTrend: "up",
    ordersChange: "+0%",
    ordersTrend: "up",
    customersChange: "+0%",
    customersTrend: "up",
    productsChange: "+0%",
    productsTrend: "down",
  });

  const [salesOverviewData, setSalesOverviewData] = useState({
    labels: [],
    datasets: [],
  });
  const [orderStatusChartData, setOrderStatusChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendorRequests, setVendorRequests] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setAdminToken(token);
    } else {
      console.warn(
        "No adminToken found in localStorage. Admin features may be restricted."
      );
    }
  }, []);

  // Effect to update screenWidth on resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getAuthHeaders = useCallback(() => {
    if (!adminToken) {
      console.error("Authentication token not available.");
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    };
  }, [adminToken]);

  useEffect(() => {
    if (activeTab === "dashboard" && adminToken) {
      const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/admin/dashboard/stats`,
            getAuthHeaders()
          );
          const data = res.data.data;

          setDashboardStats({
            totalSales: `$${
              data.totalSales ? data.totalSales.toFixed(2) : "0.00"
            }`,
            orders: data.totalOrders?.toLocaleString() || "0",
            customers: data.totalCustomers?.toLocaleString() || "0",
            products: data.totalProducts?.toLocaleString() || "0",
            salesChange: data.salesChange || "+0%",
            salesTrend: data.salesTrend || "up",
            ordersChange: data.ordersChange || "+0%",
            ordersTrend: data.ordersTrend || "up",
            customersChange: data.customersChange || "+0%",
            customersTrend: data.customersTrend || "up",
            productsChange: data.productsChange || "+0%",
            productsTrend: data.productsTrend || "down",
          });

          setSalesOverviewData({
            labels: data.salesOverview?.labels || [],
            datasets: [
              {
                label: "Sales ($)",
                data: data.salesOverview?.sales || [],
                backgroundColor: "#10B981",
                borderColor: "#059669",
                borderWidth: 2,
                borderRadius: 8,
              },
            ],
          });

          setOrderStatusChartData({
            labels: data.orderStatus?.labels || [],
            datasets: [
              {
                data: data.orderStatus?.counts || [],
                backgroundColor: [
                  "#10B981",
                  "#F59E0B",
                  "#EF4444",
                  "#3B82F6",
                  "#6366F1",
                  "#A855F7",
                  "#EC4899",
                ],
                borderWidth: 0,
              },
            ],
          });

          setRecentOrders(data.recentOrders || []);
        } catch (err) {
          console.error("Error fetching dashboard data:", err);
          setError("Failed to load dashboard data. Please try again.");
          setDashboardStats({
            totalSales: "$0",
            orders: "0",
            customers: "0",
            products: "0",
          });
          setSalesOverviewData({ labels: [], datasets: [] });
          setOrderStatusChartData({ labels: [], datasets: [] });
          setRecentOrders([]);
          if (err.response && err.response.status === 401) {
            console.log("Admin token invalid or expired. Please log in again.");
          }
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [activeTab, adminToken, API_BASE_URL, getAuthHeaders]);

  useEffect(() => {
    if (activeTab === "products" && adminToken) {
      const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
          const { data } = await axios.get(
            `${API_BASE_URL}/api/products/admin`,
            getAuthHeaders()
          );
          setProducts(data.products);
        } catch (err) {
          console.error("Error fetching products:", err);
          setError("Failed to load product data. Please try again.");
          setProducts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [activeTab, adminToken, API_BASE_URL, getAuthHeaders]);

  useEffect(() => {
    if (activeTab === "vendors" && adminToken) {
      const fetchVendorRequests = async () => {
        setLoading(true);
        setError(null);
        try {
          const { data } = await axios.get(
            `${API_BASE_URL}/api/admin/vendors`,
            getAuthHeaders()
          );
          setVendorRequests(data.vendors);
        } catch (err) {
          console.error("Error fetching vendor requests:", err);
          setError("Failed to load vendor requests. Please try again.");
          setVendorRequests([]);
        } finally {
          setLoading(false);
        }
      };
      fetchVendorRequests();
    }
  }, [activeTab, adminToken, API_BASE_URL, getAuthHeaders]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(
          `${API_BASE_URL}/api/products/${id}`,
          getAuthHeaders()
        );
        setProducts(products.filter((product) => product._id !== id));
      } catch (err) {
        console.error("Error deleting product:", err);
        setError("Failed to delete product.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Base sales chart options
  const baseSalesChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Critical for responsive height
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "rgb(107 114 128)",
        },
      },
      title: {
        display: false,
        text: "Sales Overview",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgb(107 114 128)",
        },
        grid: {
          color: "rgba(107, 114, 128, 0.1)",
        },
      },
      y: {
        ticks: {
          color: "rgb(107 114 128)",
        },
        grid: {
          color: "rgba(107, 114, 128, 0.1)",
        },
      },
    },
  };

  // Dynamically adjust sales chart options based on screen width
  const salesChartOptions = {
    ...baseSalesChartOptions,
    scales: {
      ...baseSalesChartOptions.scales,
      x: {
        ...baseSalesChartOptions.scales.x,
        ticks: {
          ...baseSalesChartOptions.scales.x.ticks,
          autoSkip: true, // Always enable auto-skipping
          maxRotation: screenWidth < 768 ? 45 : 0, // Rotate labels on small screens
          minRotation: screenWidth < 768 ? 45 : 0,
          maxTicksLimit: screenWidth < 768 ? 5 : 10, // Adjust number of ticks
          // You can also reduce font size for very small screens if needed:
          // fontSize: screenWidth < 640 ? 8 : 12,
        },
      },
    },
  };

  const orderStatusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "rgb(107 114 128)",
        },
      },
      title: {
        display: false,
        text: "Order Status",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed !== null) {
              label += context.parsed;
            }
            return label;
          },
        },
      },
    },
  };

  
if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
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
      <div className="p-6 text-center text-red-600">
        <p>Error: {error}</p>
        <button
          onClick={() => {
            setError(null);
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 max-w-screen text-gray-900 duration-300">
      {/* Main content container with max-width and overflow-x-hidden */}
      <div className="p-2 lg:p-6 mx-auto w-full max-w-screen overflow-x-hidden duration-200">
        <div className="flex-1 flex flex-col">
          {/* Dashboard Content */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-6">
                Admin Dashboard
              </h1>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  {
                    icon: <TrendingUp size={24} />,
                    title: "Total Sales",
                    value: dashboardStats.totalSales,
                    change: dashboardStats.salesChange,
                    trend: dashboardStats.salesTrend,
                  },
                  {
                    icon: <ShoppingBag size={24} />,
                    title: "Total Orders",
                    value: dashboardStats.orders,
                    change: dashboardStats.ordersChange,
                    trend: dashboardStats.ordersTrend,
                  },
                  {
                    icon: <Users size={24} />,
                    title: "Total Customers",
                    value: dashboardStats.customers,
                    change: dashboardStats.customersChange,
                    trend: dashboardStats.customersTrend,
                  },
                  {
                    icon: <Package size={24} />,
                    title: "Total Products",
                    value: dashboardStats.products,
                    change: dashboardStats.productsChange,
                    trend: dashboardStats.productsTrend,
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="p-4 sm:p-6 rounded-xl shadow bg-white"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{stat.title}</p>
                        <h3 className="text-xl sm:text-2xl font-bold mt-1 text-gray-900">
                          {stat.value}
                        </h3>
                      </div>
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                          stat.trend === "up"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {stat.icon}
                      </div>
                    </div>
                    <p
                      className={`mt-3 sm:mt-4 text-xs sm:text-sm ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <span className="font-medium">{stat.change}</span> from
                      last month
                    </p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-4 sm:p-6 rounded-xl shadow bg-white lg:col-span-2">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">
                    Sales Overview
                  </h3>
                  {salesOverviewData.labels.length > 0 ? (
                    <div className="h-48 sm:h-64 relative">
                      {" "}
                      {/* Added relative for potential absolute positioning of chart */}
                      <Bar
                        data={salesOverviewData}
                        options={salesChartOptions}
                      />
                    </div>
                  ) : (
                    <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500">
                      <p>No sales data available.</p>
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-6 rounded-xl shadow bg-white">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">
                    Order Status
                  </h3>
                  {orderStatusChartData.labels.length > 0 ? (
                    <div className="h-48 sm:h-64">
                      <Pie
                        data={orderStatusChartData}
                        options={orderStatusChartOptions}
                      />
                    </div>
                  ) : (
                    <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500">
                      <p>No order status data available.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="p-4 sm:p-6 rounded-xl shadow bg-white mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
                    Recent Orders
                  </h3>
                  <button className="text-sm text-green-600 hover:text-green-700">
                    View All
                  </button>
                </div>
                {recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentOrders.map((order) => (
                          <tr
                            key={order.id || order._id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order.orderId || order.id || order._id}
                            </td>
                            <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.customer ||
                                (order.customerId
                                  ? `${order.customerId.firstname} ${order.customerId.lastname}`
                                  : "Guest User")}
                            </td>
                            <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                              ${order.amount ? order.amount.toFixed(2) : "0.00"}
                            </td>
                            <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  order.status === "delivered"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : order.status === "processing"
                                    ? "bg-blue-100 text-blue-800"
                                    : order.status === "shipped"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : order.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.createdAt &&
                              !isNaN(new Date(order.createdAt))
                                ? format(
                                    new Date(order.createdAt),
                                    "MMM dd, yyyy HH:mm"
                                  ) // Adjusted format string here
                                : "N/A"}
                            </td>
                            <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-700 mr-2">
                                <Edit size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No recent orders found.</p>
                )}
              </div>
            </div>
          )}

          {/* Products Management */}
          {activeTab === "products" && (
            <div className="p-4 sm:p-6 rounded-xl shadow bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
                  Products
                </h3>
                <button className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm">
                  <Plus size={16} className="mr-2" />
                  Add Product
                </button>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 space-y-3 md:space-y-0">
                <div className="relative w-full md:w-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
                  <select className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white border-gray-300 text-gray-900 w-full sm:w-auto">
                    <option>All Categories</option>
                    <option>Fruits</option>
                    <option>Vegetables</option>
                    <option>Dairy</option>
                    <option>Bakery</option>
                  </select>
                  <select className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white border-gray-300 text-gray-900 w-full sm:w-auto">
                    <option>Sort By</option>
                    <option>Newest</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                  </select>
                </div>
              </div>
              {products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product ID
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product._id}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.name}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.stock}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                            ${product.price?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm">
                            <button className="text-blue-600 hover:text-blue-700 mr-2">
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No products found.</p>
              )}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-500">
                  Showing 1 to {products.length} of {products.length} entries
                </div>
                <div className="flex space-x-1">
                  <button className="px-2 py-1 sm:px-3 sm:py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm">
                    Previous
                  </button>
                  <button className="px-2 py-1 sm:px-3 sm:py-1 rounded bg-green-500 text-white text-sm">
                    1
                  </button>
                  <button className="px-2 py-1 sm:px-3 sm:py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm">
                    2
                  </button>
                  <button className="px-2 py-1 sm:px-3 sm:py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm">
                    3
                  </button>
                  <button className="px-2 py-1 sm:px-3 sm:py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Vendors Management */}
          {activeTab === "vendors" && (
            <div className="p-4 sm:p-6 rounded-xl shadow bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Vendor Requests
                </h3>
              </div>
              {vendorRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor ID
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendorRequests.map((vendor) => (
                        <tr key={vendor._id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {vendor._id}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                            {vendor.name}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                            {vendor.email}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                vendor.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : vendor.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {vendor.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm">
                            {vendor.status === "Pending" && (
                              <>
                                <button className="text-green-600 hover:text-green-700 mr-2">
                                  <Check size={16} />
                                </button>
                                <button className="text-red-600 hover:text-red-700">
                                  <X size={16} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No vendor requests found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
