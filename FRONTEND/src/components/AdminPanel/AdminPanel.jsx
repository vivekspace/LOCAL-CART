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
import { useAuth } from "../../Context/Context"; // Correct import for useAuth hook
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; // Assuming you use react-router-dom

// Define a simple LoadingSpinner component if it's not imported
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
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

const AdminPanel = () => {
  // Destructure properties directly from useAuth
  const { user, jwtToken, isAuthLoading, logout } = useAuth();
  const navigate = useNavigate(); // For redirection

  // Initial authentication and authorization check
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || user.role !== 'admin') {
        toast.error("You are not authorized to view the admin panel.");
        // Redirect to a non-admin page, e.g., home or login
        navigate("/"); 
        // Or show a specific unauthorized message and prevent further rendering if you don't redirect
      }
    }
  }, [isAuthLoading, user, navigate]); // Add navigate to dependencies

  // Display loading spinner while auth is loading
  if (isAuthLoading) {
    console.log("AdminPanel: AuthContext loading. Displaying loading state.");
    return <LoadingSpinner />;
  }

  // If auth is loaded but user is not admin, show unauthorized message and stop rendering
  // This handles the case where navigate() might not immediately reroute
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700">You do not have the necessary permissions to view this page.</p>
          <button
            onClick={() => logout()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // State variables
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

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
  const [products, setProducts] = useState([]);
  const [vendorRequests, setVendorRequests] = useState([]);

  // Effect to update screenWidth on resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // getAuthHeaders now uses jwtToken directly from useAuth
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
  }, [jwtToken]); // Dependency is jwtToken

  // Centralized data fetching logic for dashboard, products, and vendors
  const fetchData = useCallback(async (tab) => {
    setLoading(true);
    setError(null);

    // This check is already done at the top of the component, but can be a safeguard
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
        setSalesOverviewData({
          labels: data.salesOverview?.labels || [],
          datasets: [{
            label: "Sales ($)",
            data: data.salesOverview?.sales || [],
            backgroundColor: "#10B981",
            borderColor: "#059669",
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
      } else if (tab === "products") {
        res = await axios.get(`${API_BASE_URL}/api/products/admin`, getAuthHeaders());
        setProducts(res.data.products);
      } else if (tab === "vendors") {
        res = await axios.get(`${API_BASE_URL}/api/admin/vendors`, getAuthHeaders());
        setVendorRequests(res.data.vendors);
      }
    } catch (err) {
      console.error(`Error fetching ${tab} data:`, err);
      let errorMessage = `Failed to load ${tab} data. Please try again.`;
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Your session has expired or you are not authorized. Please log in again.";
          logout(); // Force logout if token is invalid/expired
        } else if (err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, user, logout]); // Depend on getAuthHeaders and user (for role check), and logout

  // UseEffects to trigger data fetching based on activeTab
  useEffect(() => {
    // fetchData is a stable useCallback, so it's safe to include
    fetchData(activeTab);
  }, [activeTab, fetchData]);


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
        toast.success("Product deleted successfully!");
      } catch (err) {
        console.error("Error deleting product:", err);
        setError("Failed to delete product.");
        toast.error("Failed to delete product.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApproveVendor = async (vendorId) => {
    if (!window.confirm("Are you sure you want to approve this vendor?")) {
        return;
    }
    setLoading(true);
    setError(null);
    try {
        await axios.put(
            `${API_BASE_URL}/api/admin/vendors/${vendorId}/approve`,
            {},
            getAuthHeaders()
        );
        toast.success("Vendor approved successfully!");
        fetchData("vendors"); // Re-fetch to update the list
    } catch (err) {
        console.error("Error approving vendor:", err);
        setError("Failed to approve vendor.");
        toast.error("Failed to approve vendor.");
    } finally {
        setLoading(false);
    }
  };

  const handleRejectVendor = async (vendorId) => {
      if (!window.confirm("Are you sure you want to reject this vendor?")) {
          return;
      }
      setLoading(true);
      setError(null);
      try {
          await axios.put(
              `${API_BASE_URL}/api/admin/vendors/${vendorId}/reject`,
              {},
              getAuthHeaders()
          );
          toast.success("Vendor rejected successfully!");
          fetchData("vendors"); // Re-fetch to update the list
      } catch (err) {
          console.error("Error rejecting vendor:", err);
          setError("Failed to reject vendor.");
          toast.error("Failed to reject vendor.");
      } finally {
          setLoading(false);
      }
  };

  const handleEditProduct = (productId) => {
    // Implement navigation to edit product page or open a modal
    console.log("Edit product:", productId);
    navigate(`/admin/products/edit/${productId}`); 
  };

  const handleEditOrder = (orderId) => {
    // Implement navigation to edit order page or open a modal
    console.log("Edit order:", orderId);
    navigate(`/admin/orders/edit/${orderId}`);
  };


  // Base sales chart options (no changes needed here)
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

  // Dynamically adjust sales chart options based on screen width (no changes needed here)
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

  // Conditional rendering for loading and error states for data fetching
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

  // If there's an error and not loading, display the error message
  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>Error: {error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchData(activeTab); // Retry fetching data for the current tab
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Main Admin Panel UI
  return (
    <div className="min-h-screen bg-gray-100 max-w-screen text-gray-900 duration-300">
      {/* Sidebar / Top Nav for tabs could go here */}
      {/* For simplicity, let's assume direct content rendering based on activeTab */}
      <div className="p-2 lg:p-6 mx-auto w-full max-w-screen overflow-x-hidden duration-200">
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation (add this to switch between views) */}
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
              <li className="mr-2" role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === "products" ? "text-green-600 border-green-600" : "text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300"}`}
                  onClick={() => setActiveTab("products")}
                  role="tab"
                  aria-selected={activeTab === "products"}
                >
                  Products
                </button>
              </li>
              <li className="mr-2" role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === "vendors" ? "text-green-600 border-green-600" : "text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300"}`}
                  onClick={() => setActiveTab("vendors")}
                  role="tab"
                  aria-selected={activeTab === "vendors"}
                >
                  Vendors
                </button>
              </li>
              {/* Add more tabs as needed, e.g., Customers, Orders, Settings */}
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
                                  )
                                : "N/A"}
                            </td>
                            <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEditOrder(order._id)}
                                className="text-blue-600 hover:text-blue-700 mr-2"
                                title="Edit Order"
                              >
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
                            <button
                                onClick={() => handleEditProduct(product._id)}
                                className="text-blue-600 hover:text-blue-700 mr-2"
                                title="Edit Product"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Product"
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
                                  : "bg-red-100 text-red-800" // Assuming 'Rejected' or other
                              }`}
                            >
                              {vendor.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm">
                            {vendor.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => handleApproveVendor(vendor._id)}
                                  className="text-green-600 hover:text-green-700 mr-2"
                                  title="Approve Vendor"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => handleRejectVendor(vendor._id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Reject Vendor"
                                >
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