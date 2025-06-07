import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  IndianRupee,
} from "lucide-react";
import {
  MagnifyingGlassCircleIcon,
  FunnelIcon,
  CalendarIcon,
  ShoppingBagIcon,
  CurrencyRupeeIcon,
} from "@heroicons/react/24/outline";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const userData = localStorage.getItem("user");
        if (!userData) {
          throw new Error("Authentication required. Please login.");
        }

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Session expired. Please login again.");
        }

        const apiUrl = (
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        ).replace(/\/$/, "");
        const endpoint = `${apiUrl}/api/orders`;

        const apiResponse = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${apiResponse.status}`
          );
        }

        const responseData = await apiResponse.json();

        if (!responseData || !Array.isArray(responseData.orders)) {
          throw new Error("Invalid response format from server");
        }

        setOrders(responseData.orders);
      } catch (error) {
        console.error("Fetch error details:", error);

        let errorMessage = "Failed to fetch orders";

        if (error.message.includes("HTTP error! status:")) {
          const statusMatch = error.message.match(/status: (\d+)/);
          const status = statusMatch ? parseInt(statusMatch[1]) : 0;

          switch (status) {
            case 401:
              errorMessage = "Session expired. Please login again.";
              break;
            case 404:
              errorMessage = "No orders found for this account";
              break;
            case 500:
              errorMessage = "Server error. Please try again later.";
              break;
            default:
              errorMessage =
                error.message.replace(/HTTP error! status: \d+/, "").trim() ||
                errorMessage;
          }
        } else if (
          error.message.includes("Network error") ||
          (error.name === "TypeError" && !error.message.includes("HTTP error!"))
        ) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          errorMessage = error.message || errorMessage;
        }

        setError(errorMessage);

        if (errorMessage.includes("Session expired.")) {
          setTimeout(() => window.location.reload(), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "processing":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "cancelled":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <ShoppingBag className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "processing":
        return "text-amber-800 bg-amber-100 border-amber-200";
      case "shipped":
        return "text-blue-800 bg-blue-100 border-blue-200";
      case "delivered":
        return "text-green-800 bg-green-100 border-green-200";
      case "cancelled":
        return "text-red-800 bg-red-100 border-red-200";
      default:
        return "text-gray-800 bg-gray-100 border-gray-200";
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === "all" || order.status?.toLowerCase() === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "amount-high":
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case "amount-low":
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-white mr-3" />
                <h3 className="text-xl font-bold text-white">
                  Unable to Load Orders
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!Array.isArray(orders)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16 bg-white rounded-2xl shadow-xl">
            <AlertCircle className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-6 text-xl font-bold text-gray-900">
              Invalid Data Format
            </h3>
            <p className="mt-3 text-gray-600">
              The server returned an unexpected response format.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl mb-6">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Your Order History
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Track and manage all your purchases with LocalCart
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mb-8">
              <ShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No Orders Yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              You haven't placed any orders yet. Start exploring our products
              and make your first purchase!
            </p>
            <button
              onClick={() => alert("Navigate to products page")}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassCircleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders by ID or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex gap-4">
                  {/* Status Filter */}
                  <div className="relative">
                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white appearance-none cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white appearance-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount-high">Highest Amount</option>
                    <option value="amount-low">Lowest Amount</option>
                  </select>
                </div>
              </div>

              {/* Results count */}
              {(searchTerm || filterStatus !== "all") && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    Showing {filteredOrders.length} of {orders.length} orders
                    {searchTerm && <span> matching "{searchTerm}"</span>}
                    {filterStatus !== "all" && (
                      <span> with status "{filterStatus}"</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Orders List */}
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="block group"
                >
                  <div className="bg-white border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 p-6 hover:border-emerald-200 transform hover:-translate-y-1">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl flex items-center justify-center">
                            {getStatusIcon(order.status)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold text-gray-900">
                              Order #{order._id.slice(-8).toUpperCase()}
                            </h2>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status
                                ? order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)
                                : "Unknown"}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                            <div className="flex items-center">
                              <ShoppingBagIcon className="w-4 h-4 mr-1" />
                              {order.items?.length || 0} item
                              {(order.items?.length || 0) !== 1 ? "s" : ""}
                            </div>
                            {order.paymentMethod && (
                              <div className="flex items-center">
                                <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
                                <span className="capitalize">
                                  {order.paymentMethod} payment
                                </span>
                              </div>
                            )}
                          </div>

                          {order.paymentStatus && (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                                order.paymentStatus === "paid"
                                  ? "text-green-800 bg-green-100 border-green-200"
                                  : "text-amber-800 bg-amber-100 border-amber-200"
                              }`}
                            >
                              Payment{" "}
                              {order.paymentStatus.charAt(0).toUpperCase() +
                                order.paymentStatus.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 lg:mt-0 lg:ml-6 lg:text-right">
                        <div className="flex items-center justify-between lg:flex-col lg:items-end">
                          <div>
                            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                              ₹{(order.totalAmount || 0).toFixed(2)}
                            </p>
                          </div>

                          <div className="flex items-center text-emerald-600 group-hover:text-emerald-700 font-semibold">
                            <span className="text-sm">View Details</span>
                            <svg
                              className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {filteredOrders.length > 0 && (
              <div className="mt-12 text-center">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                  <p className="text-gray-600 mb-6">
                    Showing {filteredOrders.length} order
                    {filteredOrders.length !== 1 ? "s" : ""}
                    {filteredOrders.length !== orders.length &&
                      ` of ${orders.length} total`}
                  </p>
                  <button className="inline-flex items-center px-8 py-4 border-2 border-emerald-500 text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all duration-200 transform hover:scale-105">
                    Load More Orders
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
