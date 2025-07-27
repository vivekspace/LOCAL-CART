import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
  TrendingUp,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  User,
  Package,
  Mail,
  Phone,
} from "lucide-react";
import { useAuth } from "../../Context/Context";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Define a simple LoadingSpinner component if it's not imported
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
      <p className="text-lg text-gray-700">Loading your analytics...</p>
      <p className="text-sm text-gray-500">LocalCart is crunching the numbers</p>
    </div>
  </div>
);

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

const OrderActionModal = ({ isOpen, onClose, order, onSave }) => {
  const [status, setStatus] = useState(order?.status || "");
  const [amount, setAmount] = useState(order?.amount || 0);
  const [customer, setCustomer] = useState(order?.customer || "");

  useEffect(() => {
    if (order) {
      setStatus(order.status || "");
      setAmount(order.amount || 0);
      setCustomer(order.customer || (order.customerId ? `${order.customerId.firstname} ${order.customerId.lastname}` : ""));
    }
  }, [order]);

  const handleSave = () => {
    onSave(order._id, { status, amount, customer });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        {order ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Order ID:</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{order.orderId || order._id}</p>
            </div>
            <div>
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700">Customer:</label>
              <input
                type="text"
                id="customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount:</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status:</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Order Date:</label>
              <p className="mt-1 text-gray-900">
                {order.createdAt && !isNaN(new Date(order.createdAt))
                  ? format(new Date(order.createdAt), "MMM dd, yyyy HH:mm")
                  : "N/A"}
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No order details to display.</p>
        )}
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { user, jwtToken, isAuthLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

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
    customersTrend: "+0%",
    productsChange: "+0%",
    totalProductsTrend: "down",
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

  // State for Order Action Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Initial authentication and authorization check
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || user.role !== 'admin') {
        toast.error("You are not authorized to view the admin panel.");
        navigate("/");
      }
    }
  }, [isAuthLoading, user, navigate]);

  if (isAuthLoading) {
    return <LoadingSpinner />;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700">You do not have the necessary permissions to view this page.</p>
          <button
            onClick={() => logout()}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded hover:bg-blue-600"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getAuthHeaders = useCallback(() => {
    if (!jwtToken) {
      console.error("Authentication token not available in AdminPanel.");
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    };
  }, [jwtToken]);

  const fetchData = useCallback(async (tab) => {
    setLoading(true);
    setError(null);

    if (!user || user.role !== 'admin') {
        console.log(`AdminPanel: fetchData skipped - user not authorized.`);
        setError("You are not authorized to view this panel.");
        setLoading(false);
        return;
    }

    try {
      let res;
      if (tab === "dashboard") {
        res = await axios.get(`${API_BASE_URL}/api/admin/dashboard/stats`, getAuthHeaders());
        const data = res.data.data;
        console.log(data)
        setDashboardStats({
          totalSales: `$${data.totalSales ? data.totalSales.toFixed(2) : "0.00"}`,
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
          totalProductsTrend: data.productsTrend || "down",
        });
        const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const gradient = ctx.createLinearGradient(0, 0, 0, 400);
gradient.addColorStop(0, '#2563eb'); // blue-600
gradient.addColorStop(1, '#3b82f6'); // blue-500

setSalesOverviewData({
  labels: data.salesOverview?.labels || [],
  datasets: [{
    label: "Sales ($)",
    data: data.salesOverview?.sales || [],
    backgroundColor: gradient,
    borderColor: "#1d4ed8", // blue-700 for border
    borderWidth: 2,
    borderRadius: 8,
  }],
});
        setOrderStatusChartData({
          labels: data.orderStatus?.labels || [],
          datasets: [{
            data: data.orderStatus?.counts || [],
            backgroundColor: ["#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#6366F1", "#A855F7", "#EC4899"],
            borderWidth: 0,
          }],
        });
        setRecentOrders(data.recentOrders || []);
      }
    } catch (err) {
      console.error(`Error fetching ${tab} data:`, err);
      let errorMessage = `Failed to load ${tab} data. Please try again.`;
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Your session has expired or you are not authorized. Please log in again.";
          logout();
        } else if (err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, user, logout]);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleOpenOrderModal = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setSelectedOrder(null);
  };

  const handleUpdateOrder = async (orderId, updatedData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/orders/${orderId}`,
        updatedData,
        getAuthHeaders()
      );
      if (response.status === 200) {
        toast.success("Order updated successfully!");
        setRecentOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId ? { ...order, ...updatedData } : order
          )
        );
      } else {
        toast.error("Failed to update order.");
      }
    } catch (err) {
      console.error("Error updating order:", err);
      let errorMessage = "Failed to update order. Please try again.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-indigo-100 text-indigo-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const baseSalesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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

  const salesChartOptions = {
    ...baseSalesChartOptions,
    scales: {
      ...baseSalesChartOptions.scales,
      x: {
        ...baseSalesChartOptions.scales.x,
        ticks: {
          ...baseSalesChartOptions.scales.x.ticks,
          autoSkip: true,
          maxRotation: screenWidth < 768 ? 45 : 0,
          minRotation: screenWidth < 768 ? 45 : 0,
          maxTicksLimit: screenWidth < 768 ? 5 : 10,
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
          <p className="text-lg text-gray-700">Loading {activeTab} data...</p>
          <p className="text-sm text-gray-500">
            Fetching latest information
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
            fetchData(activeTab);
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 max-w-screen text-gray-900 duration-300">
      <div className="p-2 lg:p-6 mx-auto w-full max-w-screen overflow-x-hidden duration-200">
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation (only Dashboard tab) */}
          <div className="mb-6 border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
              <li className="mr-2" role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === "dashboard" ? "text-green-600 border-green-600" : "text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300"}`}
                  onClick={() => setActiveTab("dashboard")}
                  role="tab"
                  aria-selected={activeTab === "dashboard"}
                >
                  Dashboard
                </button>
              </li>
            </ul>
          </div>

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
                    trend: dashboardStats.totalProductsTrend,
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="p-4 sm:p-6 rounded-xl shadow-sm bg-white"
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

              {/* Sales Chart - Full Width */}
              <div className="p-4 sm:p-6 rounded-xl shadow-sm bg-white">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">
                  Sales Overview
                </h3>
                {salesOverviewData.labels.length > 0 ? (
                  <div className="h-64 sm:h-80 relative">
                    <Bar
                      data={salesOverviewData}
                      options={salesChartOptions}
                    />
                  </div>
                ) : (
                  <div className="h-64 sm:h-80 flex items-center justify-center text-gray-500">
                    <p>No sales data available.</p>
                  </div>
                )}
              </div>

              {/* Recent Orders and Order Status Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Recent Orders - Takes 2/3 width */}
                <div className="lg:col-span-2 p-4 sm:p-6 rounded-xl shadow-sm bg-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
                      Recent Orders
                    </h3>
                    <Link to={'/admin/orders'} className="text-sm text-green-600 hover:text-green-700">
                      View All
                    </Link>
                  </div>
                  {recentOrders.length > 0 ? (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <div key={order.id || order._id} className="bg-gray-50 rounded-lg shadow-sm overflow-hidden">
                          {/* Order Summary */}
                          <div
                            className="p-4 cursor-pointer hover:bg-gray-100 transition-colors grid grid-cols-2 md:grid-cols-4 gap-4 items-center"
                            onClick={() => toggleExpandOrder(order._id || order.id)}
                          >
                            <div>
                              <p className="text-sm text-gray-500">Order ID</p>
                              <p className="font-medium text-gray-900 truncate">
                                {(order.orderId || order.id || order._id).substring(0, 8)}...
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500">Customer</p>
                              <p className="font-medium text-gray-900 truncate">
                                {order.customer ||
                                  (order.customerId
                                    ? `${order.customerId.firstname} ${order.customerId.lastname}`
                                    : "Guest User")}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500">Amount</p>
                              <p className="font-medium text-gray-900">
                                ${order.amount ? order.amount.toFixed(2) : "0.00"}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}
                              >
                                {order.status}
                              </span>
                              {expandedOrderId === (order._id || order.id) ? (
                                <ChevronUp className="h-5 w-5 text-gray-400 ml-2" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400 ml-2" />
                              )}
                            </div>
                          </div>
                          
                          {/* Expanded Order Details */}
                          <AnimatePresence>
                            {expandedOrderId === (order._id || order.id) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-gray-200 p-4 bg-white">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Order Details */}
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4 text-green-600" />
                                        Order Information
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                          <Package className="w-3 h-3 text-gray-400" />
                                          <span className="text-gray-600">Full Order ID:</span>
                                          <span className="text-gray-900 text-xs font-mono">
                                            {order.orderId || order.id || order._id}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-3 h-3 text-gray-400" />
                                          <span className="text-gray-600">Date:</span>
                                          <span className="text-gray-900">
                                            {order.createdAt && !isNaN(new Date(order.createdAt))
                                              ? format(new Date(order.createdAt), "MMM dd, yyyy HH:mm")
                                              : "N/A"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <DollarSign className="w-3 h-3 text-gray-400" />
                                          <span className="text-gray-600">Total Amount:</span>
                                          <span className="text-gray-900 font-semibold">
                                            ${order.amount ? order.amount.toFixed(2) : "0.00"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Customer Details */}
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <User className="w-4 h-4 text-green-600" />
                                        Customer Details
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                          <User className="w-3 h-3 text-gray-400" />
                                          <span className="text-gray-600">Name:</span>
                                          <span className="text-gray-900">
                                            {order.customer ||
                                              (order.customerId
                                                ? `${order.customerId.firstname} ${order.customerId.lastname}`
                                                : "Guest User")}
                                          </span>
                                        </div>
                                        {order.customerId?.email && (
                                          <div className="flex items-center gap-2">
                                            <Mail className="w-3 h-3 text-gray-400" />
                                            <span className="text-gray-600">Email:</span>
                                            <span className="text-gray-900">{order.customerId.email}</span>
                                          </div>
                                        )}
                                        {order.customerId?.phone && (
                                          <div className="flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-gray-400" />
                                            <span className="text-gray-600">Phone:</span>
                                            <span className="text-gray-900">{order.customerId.phone}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenOrderModal(order);
                                      }}
                                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit Order
                                    </button>
                                    <Link
                                      to={`/admin/orders/${order._id || order.id}`}
                                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Package className="w-4 h-4" />
                                      View Details
                                    </Link>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>No recent orders found.</p>
                    </div>
                  )}
                </div>

                {/* Order Status Chart - Takes 1/3 width */}
                <div className="p-4 sm:p-6 rounded-xl shadow-sm bg-white">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">
                    Order Status
                  </h3>
                  {orderStatusChartData.labels.length > 0 ? (
                    <div className="h-64 relative">
                      <Pie
                        data={orderStatusChartData}
                        options={orderStatusChartOptions}
                      />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <p>No order status data available.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Action Modal */}
      <OrderActionModal
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        order={selectedOrder}
        onSave={handleUpdateOrder}
      />
    </div>
  );
};

export default AdminPanel;