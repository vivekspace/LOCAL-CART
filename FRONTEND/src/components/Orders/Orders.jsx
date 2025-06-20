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
  EllipsisVerticalIcon, // For the action/settings icon
  ChevronLeftIcon, // For pagination
  ChevronRightIcon, // For pagination
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
  // State for pagination (basic setup)
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5); // You can adjust this

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
        console.log("order is", responseData); // Keep this for debugging

        if (!responseData || !Array.isArray(responseData.orders)) {
          throw new Error("Invalid response format from server");
        }

        const processedOrders = responseData.orders.map((order) => ({
          ...order,
          itemCount: order.cartItems ? order.cartItems.length : 0,
          paymentDetails: order.paymentDetails || {},
          // Extract first product name and image for display, if available
          firstProductName: order.cartItems?.[0]?.name || null,
          firstProductImage:
            order.cartItems?.[0]?.images?.[0]?.url || PLACEHOLDER_IMAGE, // Assuming images array
          // Extract customer name for the table UI
          customerFullName: order.customerDetails
            ? `${order.customerDetails.firstname || ""} ${
                order.customerDetails.lastname || ""
              }`.trim()
            : "N/A",
         
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
        return <ClockIcon className="w-4 h-4 text-amber-500 mr-1" />;
      case "shipped":
        return <TruckIcon className="w-4 h-4 text-blue-500 mr-1" />;
      case "delivered":
        return <CheckCircleIcon className="w-4 h-4 text-green-600 mr-1" />;
      case "cancelled":
        return <ExclamationCircleIcon className="w-4 h-4 text-red-500 mr-1" />;
      default:
        return <ShoppingBagIcon className="w-4 h-4 text-gray-500 mr-1" />;
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
        order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.firstProductName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerFullName.toLowerCase().includes(searchTerm.toLowerCase()); // Search by customer name, no longer by address
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

  // Pagination Logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Helper for generating page numbers
  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`px-3 py-1 mx-1 rounded-md text-sm font-medium ${
            currentPage === i
              ? "bg-green-600 text-white"
              : "bg-green-200 text-green-700 hover:bg-green-300"
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>{" "}
          <p className="text-lg text-black">Loading your orders...</p>
          <p className="text-sm text-black">
            LocalCart is fetching your personalized experience
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
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
      <div className="min-h-screen flex items-center justify-center  p-4">
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
    <div className="min-h-screen  py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 shadow-sm border border-green-200">
            <ShoppingBagIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-green-600 leading-tight">
            Your Order History
          </h1>
          <p className="mt-3 text-lg text-green-600 max-w-2xl mx-auto">
            Track and manage all your purchases with LocalCart
          </p>
        </div>

        {orders.length === 0 && !loading && !error ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-md border border-green-100 max-w-2xl mx-auto">
            <ShoppingBagIcon className="h-16 w-16 text-green-600 mx-auto mb-8" />
            <h3 className="text-2xl font-bold text-green-600 mb-4">
              No Orders Yet
            </h3>
            <p className="text-green-600 mb-8 max-w-sm mx-auto">
              You haven't placed any orders yet. Start exploring our products
              and make your first purchase!
            </p>
            <Link
              to="/shopping" // Assuming your products page is at the root or /products
              className="inline-flex items-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md transform hover:scale-105"
            >
              <ShoppingBagIcon className="w-5 h-5 mr-2" />
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Filters and Search Section */}
            <div className="bg-white rounded-lg shadow-md border border-green-100 p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md w-full">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-400" />
                  <input
                    type="text"
                    placeholder="Search orders by ID, status, customer, or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-green-300 rounded-md focus:ring-green-500 focus:border-green-500 transition-colors placeholder-black font-semibold text-black text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  {/* Status Filter Dropdown */}
                  <div className="relative w-full sm:w-auto">
                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-400 pointer-events-none" />
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                      }} // Reset page on filter change
                      className="pl-10 pr-8 py-2.5  border-2 border-green-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white appearance-none cursor-pointer text-sm text-black font-semibold w-full"
                    >
                      <option value="all">All Status</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {/* Custom arrow for select */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-green-700">
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
                      className="px-4 py-2.5 border-2 border-green-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white appearance-none cursor-pointer text-sm text-black font-semibold w-full"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="amount-high">Highest Amount</option>
                      <option value="amount-low">Lowest Amount</option>
                    </select>
                    {/* Custom arrow for select */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-green-700">
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
              <div className="mt-4 pt-4 border-t border-green-100 flex justify-between items-center text-sm text-green-600">
                <p>
                  <span className="font-semibold">
                    {filteredOrders.length}
                  </span>{" "}
                  orders found
                </p>
                {/* Date range filter mock */}
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-green-400" />
                  <span className="text-green-700">31 Jul 2020</span>
                  <span className="text-green-500">To</span>
                  <CalendarIcon className="w-5 h-5 text-green-400" />
                  <span className="text-green-700">03 Aug 2020</span>
                </div>
              </div>
            </div>

            {currentOrders.length === 0 &&
            (searchTerm || filterStatus !== "all") ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-md border border-green-100 max-w-2xl mx-auto">
                <MagnifyingGlassIcon className="h-16 w-16 text-green-400 mx-auto mb-8" />
                <h3 className="text-2xl font-bold text-green-900 mb-4">
                  No Matching Orders Found
                </h3>
                <p className="text-green-600 mb-8 max-w-sm mx-auto">
                  Try adjusting your search term or filters.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                  }}
                  className="inline-flex items-center px-6 py-3 border border-green-300 text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-all duration-200 shadow-sm"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md border border-green-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-green-200">
                    <thead className="bg-green-500">
                      <tr>
                        {/* New Image Header */}
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                        >
                          Image
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                        >
                          Id
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                        >
                          Name
                        </th>
                        
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                        >
                          Price
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-green-200">
                      {currentOrders.map((order) => (
                        <tr
                          key={order._id}
                          className="hover:bg-green-50 cursor-pointer"
                        >
                          {/* New Image Data Cell */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-md object-cover border border-green-200"
                                src={order.firstProductImage}
                                alt={order.firstProductName || "Product image"}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = PLACEHOLDER_IMAGE;
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-900">
                            <Link
                              to={`/orders/${order._id}`}
                              className="text-green-600 hover:text-green-800"
                            >
                              #{order._id.slice(-8).toUpperCase()}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {/* Avatar/Initial Placeholder */}
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-xs font-semibold text-green-600 uppercase">
                                {order.firstProductName
                                  ? order.firstProductName[0]
                                  : "U"}
                              </div>
                              <div className="ml-4 text-sm font-medium text-green-900">
                                {order.firstProductName || "N/A"} {/* Prioritize customer name */}
                              </div>
                            </div>
                          </td>
                          {/* Removed Address Data Cell */}
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                            {order.customerAddress}
                          </td> */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500">
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900 font-semibold">
                            ₹{(order.totalAmount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {getStatusIcon(order.status)}
                              {order.status
                                ? order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)
                                : "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/orders/${order._id}`}
                              className="text-green-500 hover:text-green-900 inline-flex items-center"
                            >
                              <EllipsisVerticalIcon className="h-5 w-5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredOrders.length > 0 && (
                  <nav
                    className="bg-white px-4 py-3 flex items-center justify-between border-t border-green-200 sm:px-6"
                    aria-label="Pagination"
                  >
                    <div className="hidden sm:block">
                      <p className="text-sm text-green-700">
                        Showing{" "}
                        <span className="font-medium">
                          {indexOfFirstOrder + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(indexOfLastOrder, filteredOrders.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {filteredOrders.length}
                        </span>{" "}
                        results
                      </p>
                    </div>
                    <div className="flex-1 flex justify-between sm:justify-end">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="h-5 w-5 mr-2" /> Previous
                      </button>
                      <div className="hidden sm:flex ml-2">
                        {renderPageNumbers()}
                      </div>
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="ml-2 relative inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next <ChevronRightIcon className="h-5 w-5 ml-2" />
                      </button>
                    </div>
                  </nav>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;