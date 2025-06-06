import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBagIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const userData = localStorage.getItem("user");
        if (!userData) {
          throw new Error("Authentication required. Please login.");
        }

        const user = JSON.parse(userData);
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
        return "text-amber-700 bg-amber-100";
      case "shipped":
        return "text-blue-700 bg-blue-100";
      case "delivered":
        return "text-green-700 bg-green-100";
      case "cancelled":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-700">Loading your orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-red-100 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">
                Error loading orders
              </h3>
              <p className="mt-1 text-gray-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 bg-white hover:bg-gray-50 text-red-800 px-4 py-2 rounded-md text-sm font-medium border border-red-200"
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
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Invalid orders data
          </h3>
          <p className="mt-2 text-gray-600">
            The server returned invalid data format.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Order History</h1>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
          Track and manage all your purchases with LocalCart
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
          <ShoppingBagIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-5 text-xl font-medium text-gray-900">
            No orders found
          </h3>
          <p className="mt-2 text-gray-600">
            You haven't placed any orders yet. Start shopping to see your orders
            here.
          </p>
          <div className="mt-8">
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 p-6 hover:border-primary/30"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status
                          ? order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)
                          : "Unknown"}
                      </span>
                      {order.paymentStatus && (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            order.paymentStatus === "paid"
                              ? "text-green-700 bg-green-100"
                              : "text-amber-700 bg-amber-100"
                          }`}
                        >
                          {order.paymentStatus.charAt(0).toUpperCase() +
                            order.paymentStatus.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-0 sm:text-right">
                  <p className="text-xl font-bold text-primary">
                    ₹{(order.totalAmount || 0).toFixed(2)}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {order.items?.length || 0} item
                    {(order.items?.length || 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="capitalize">
                    {order.paymentMethod || "Card"} payment
                  </span>
                </div>
                <div className="flex items-center text-primary group">
                  <span className="text-sm font-semibold group-hover:text-primary-dark">
                    View order details
                  </span>
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
            </Link>
          ))}
        </div>
      )}

      {orders.length > 0 && (
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-600">
            Showing {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
          <div className="mt-6">
            <button className="inline-flex items-center px-5 py-2.5 border border-primary text-sm font-medium rounded-md text-primary bg-white hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50">
              Load More
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;