  import { useEffect, useState } from "react";
  import { Link } from "react-router-dom";
  import { motion } from "framer-motion";
  import { Helmet } from "react-helmet-async";
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
    ArrowRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowPathIcon,
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
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(8);
    const [refreshing, setRefreshing] = useState(false);
    console.log(orders)

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        setRefreshing(true);

        // --- FIX: Change 'token' to 'jwtToken' when retrieving from localStorage ---
        const jwtToken = localStorage.getItem("jwtToken"); // Corrected key
        if (!jwtToken) { // Check for jwtToken
          throw new Error("Session expired. Please login again.");
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/orders/my-orders`,
          {
            headers: {
              Authorization: `Bearer ${jwtToken}`, // Use jwtToken here
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const processedOrders = data.orders.map((order) => ({
          ...order,
          itemCount: order.itemCount || 0,
          firstProductName: order.cartItems?.[0]?.name || "N/A",
          firstProductImage: order.cartItems?.[0]?.imageUrl || PLACEHOLDER_IMAGE,
          customerFullName: order.shippingAddress?.name || "N/A",
        }));

        setOrders(processedOrders);
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    useEffect(() => {
      fetchOrders();
    }, []);

    const getStatusIcon = (status) => {
      switch (status?.toLowerCase()) {
        case "processing":
          return <ClockIcon className="w-4 h-4 mr-1.5" />;
        case "shipped":
          return <TruckIcon className="w-4 h-4 mr-1.5" />;
        case "delivered":
          return <CheckCircleIcon className="w-4 h-4 mr-1.5" />;
        case "cancelled":
          return <ExclamationCircleIcon className="w-4 h-4 mr-1.5" />;
        default:
          return <ShoppingBagIcon className="w-4 h-4 mr-1.5" />;
      }
    };

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case "processing":
          return "bg-blue-50 text-blue-700";
        case "shipped":
          return "bg-purple-50 text-purple-700";
        case "delivered":
          return "bg-green-50 text-green-700";
        case "cancelled":
          return "bg-red-50 text-red-700";
        default:
          return "bg-gray-50 text-gray-700";
      }
    };

    const filteredOrders = orders
      .filter((order) => {
        const matchesSearch =
          order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.firstProductName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.customerFullName.toLowerCase().includes(searchTerm.toLowerCase());
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

    // Pagination
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(
      indexOfFirstOrder,
      indexOfLastOrder
    );
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading && !refreshing) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-medium text-gray-800">
              Loading your orders
            </h2>
            <p className="text-gray-500 mt-1">
              Please wait while we fetch your order history
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md bg-white p-8 rounded-xl shadow-sm text-center">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <Helmet>
          <title>My Orders - Order History | EcoHarvest</title>
          <meta
            name="description"
            content={`View your complete order history with EcoHarvest. Track your processing, shipped, and delivered orders, and manage your past purchases.`}
          />
          <link rel="canonical" href={window.location.href} />

          <meta
            property="og:title"
            content="My Orders - Order History | EcoHarvest"
          />
          <meta
            property="og:description"
            content="View your complete order history with EcoHarvest. Track your processing, shipped, and delivered orders, and manage your past purchases."
          />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:type" content="website" />

          <meta name="twitter:card" content="summary" />
          <meta
            name="twitter:title"
            content="My Orders - Order History | EcoHarvest"
          />
          <meta
            name="twitter:description"
            content="View your complete order history with EcoHarvest. Track your processing, shipped, and delivered orders, and manage your past purchases."
          />
        </Helmet>
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">My Orders</h1>
                <p className="text-green-100 mt-2">
                  View and manage all your orders in one place
                </p>
              </div>
              <button
                onClick={fetchOrders}
                disabled={refreshing}
                className="flex items-center text-green-50 bg-green-800 bg-opacity-30 px-4 py-2 rounded-lg hover:bg-opacity-40 transition-all"
              >
                <ArrowPathIcon
                  className={`w-5 h-5 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          {/* Filters Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-xl shadow-md p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
                  >
                    <option value="all">All Status</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Highest Amount</option>
                  <option value="amount-low">Lowest Amount</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
              <p className="text-gray-600">
                Showing{" "}
                <span className="font-medium">{filteredOrders.length}</span>{" "}
                orders
              </p>
              <div className="flex items-center space-x-2 text-gray-500">
                <CalendarIcon className="w-4 h-4" />
                <span>All time</span>
              </div>
            </div>
          </motion.div>

          {/* Empty State */}
          {orders.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-12 text-center"
            >
              <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                No orders yet
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                You haven't placed any orders yet. Start shopping to see your
                orders here.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <ShoppingBagIcon className="w-5 h-5 mr-2" />
                Browse Products
              </Link>
            </motion.div>
          )}

          {/* No Results State */}
          {orders.length > 0 && currentOrders.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-12 text-center"
            >
              <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                No matching orders
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </motion.div>
          )}

          {/* Orders Grid */}
          {currentOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {currentOrders.map((order) => (
                <motion.div
                  key={order._id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all"
                >
                  <Link to={`/orders/${order._id}`} className="block">
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Order #{order._id.slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status?.charAt(0).toUpperCase() +
                            order.status?.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0">
                          <img
                            className="h-auto w-12 rounded-md object-cover border border-gray-200"
                            src={`${import.meta.env.VITE_API_URL}/uploads/${
                              order.images?.[0]?.url || order.firstProductImage
                            }`}
                            alt={order.firstProductName}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = PLACEHOLDER_IMAGE;
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {order.firstProductName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {order.itemCount}{" "}
                            {order.itemCount === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ₹{order.totalAmount?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                        <div className="text-green-600 hover:text-green-800 transition-colors">
                          <ArrowRightIcon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {filteredOrders.length > ordersPerPage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex items-center justify-between"
            >
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-2" />
                Previous
              </button>

              <div className="hidden sm:flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                        currentPage === number
                          ? "bg-green-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {number}
                    </button>
                  )
                )}
              </div>

              <div className="sm:hidden text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="h-5 w-5 ml-2" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  export default Orders;
