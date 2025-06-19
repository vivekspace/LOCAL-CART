import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  ShoppingBagIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const PLACEHOLDER_IMAGE = `${
  import.meta.env.VITE_API_URL
}/uploads/default-product.png`;

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
        console.log("order is", responseData);

        if (!responseData || !Array.isArray(responseData.orders)) {
          throw new Error("Invalid response format from server");
        }

        // Add a placeholder for itemCount and paymentDetails if they are sometimes missing
        const processedOrders = responseData.orders.map((order) => ({
          ...order,
          itemCount: order.items ? order.items.length : 0, // Ensure itemCount is present
          paymentDetails: order.paymentDetails || {}, // Ensure paymentDetails is an object
        }));

        setOrders(processedOrders);
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
        return <ClockIcon className="w-5 h-5 text-amber-500" />;
      case "shipped":
        return <TruckIcon className="w-5 h-5 text-blue-500" />;
      case "delivered":
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case "cancelled":
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ShoppingBagIcon className="w-5 h-5 text-gray-500" />;
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
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div> {/* Changed color to blue for user side */}
          <p className="text-lg text-gray-700">Loading your orders...</p> 
          <p className="text-sm text-gray-500">
            LocalCart is fetching your personalized experience
          </p> {/* Changed text */}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <ExclamationCircleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!Array.isArray(orders)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <ExclamationCircleIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Data Format
          </h3>
          <p className="text-gray-600">
            The server returned an unexpected response format.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 shadow-sm border border-green-200">
            <ShoppingBagIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
            Your Order History
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
            Track and manage all your purchases with LocalCart
          </p>
        </div>

        {orders.length === 0 && !loading && !error ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-md border border-gray-100 max-w-2xl mx-auto">
            <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-8" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No Orders Yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              You haven't placed any orders yet. Start exploring our products
              and make your first purchase!
            </p>
            <Link
              to="/" // Assuming your products page is at the root or /products
              className="inline-flex items-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md transform hover:scale-105"
            >
              <ShoppingBagIcon className="w-5 h-5 mr-2" />
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Filters and Search Section */}
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md w-full">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders by ID or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 transition-colors placeholder-gray-400 text-gray-800 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  {/* Status Filter Dropdown */}
                  <div className="relative w-full sm:w-auto">
                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white appearance-none cursor-pointer text-sm text-gray-800 w-full"
                    >
                      <option value="all">All Status</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {/* Custom arrow for select */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg
                        className="fill-current h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>

                  {/* Sort By Dropdown */}
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white appearance-none cursor-pointer text-sm text-gray-800 w-full"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="amount-high">Highest Amount</option>
                      <option value="amount-low">Lowest Amount</option>
                    </select>
                    {/* Custom arrow for select */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg
                        className="fill-current h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results count */}
              {(searchTerm ||
                filterStatus !== "all" ||
                filteredOrders.length !== orders.length) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold">
                      {filteredOrders.length}
                    </span>{" "}
                    of <span className="font-semibold">{orders.length}</span>{" "}
                    orders
                    {searchTerm && (
                      <span>
                        {" "}
                        matching "
                        <span className="font-semibold">{searchTerm}</span>"
                      </span>
                    )}
                    {filterStatus !== "all" && (
                      <span>
                        {" "}
                        with status "
                        <span className="font-semibold">{filterStatus}</span>"
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {filteredOrders.length === 0 &&
            (searchTerm || filterStatus !== "all") ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-md border border-gray-100 max-w-2xl mx-auto">
                <MagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-8" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  No Matching Orders Found
                </h3>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                  Try adjusting your search term or filters.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                  }}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => (
                  <Link
                    key={order._id}
                    to={`/orders/${order._id}`}
                    className="block group"
                  >
                    <div className="bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 p-6 transform hover:-translate-y-0.5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Product Image Section */}
                        <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                          <img
                            src={order.items?.[0]?.image || PLACEHOLDER_IMAGE}
                            alt={order.items?.[0]?.name || "Product image"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null; // prevents looping
                              e.target.src = PLACEHOLDER_IMAGE;
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
                            <h2 className="text-lg font-bold text-gray-900 truncate">
                               {order.firstProductName || `Order #${order._id.slice(-8).toUpperCase()}`}

                            </h2>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status
                                ? order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)
                                : "Unknown"}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1 text-gray-500" />
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </div>
                            <div className="flex items-center">
                              <ShoppingBagIcon className="w-4 h-4 mr-1 text-gray-500" />
                              {order.itemCount || 0} item
                              {(order.itemCount || 0) !== 1 ? "s" : ""}
                            </div>
                            {order.paymentDetails?.method && (
                              <div className="flex items-center">
                                <CurrencyRupeeIcon className="w-4 h-4 mr-1 text-gray-500" />
                                <span className="capitalize">
                                  {order.paymentDetails.method} payment
                                </span>
                              </div>
                            )}
                          </div>

                          {order.paymentDetails?.status && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                order.paymentDetails.status === "paid"
                                  ? "text-green-700 bg-green-100 border-green-200"
                                  : "text-amber-800 bg-amber-100 border-amber-200"
                              }`}
                            >
                              Payment{" "}
                              {order.paymentDetails.status
                                .charAt(0)
                                .toUpperCase() +
                                order.paymentDetails.status.slice(1)}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 sm:mt-0 sm:ml-6 sm:text-right flex flex-col items-start sm:items-end">
                          <p className="text-2xl font-bold text-green-700">
                            ₹{(order.totalAmount || 0).toFixed(2)}
                          </p>
                          <div className="flex items-center text-green-600 group-hover:text-green-700 font-semibold mt-2">
                            <span className="text-sm">View Details</span>
                            <svg
                              className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1"
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
                  </Link>
                ))}
              </div>
            )}

            {/* Load More Button (Conditional based on filtered results vs total) */}
            {filteredOrders.length > 0 &&
              filteredOrders.length < orders.length && (
                <div className="mt-12 text-center">
                  <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8">
                    <p className="text-gray-600 mb-6">
                      You've viewed {filteredOrders.length} of {orders.length}{" "}
                      total orders.
                    </p>
                    <button className="inline-flex items-center px-8 py-4 border-2 border-green-500 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-all duration-200 transform hover:scale-105 shadow-sm">
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
