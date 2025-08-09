import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircleIcon,
  TruckIcon,
  ShoppingBagIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  ReceiptRefundIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useAuth } from "../../Context/Context.jsx"; // Import useAuth hook

const OrderedItemsPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authAxios, isLoggedIn } = useAuth(); // Use isLoggedIn to conditionally fetch

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);

      if (!orderId) {
        setError("Order ID is required");
        setLoading(false);
        return;
      }

      // Ensure user is logged in before attempting to fetch private customer orders
      if (!isLoggedIn) {
        setError("You must be logged in to view order details.");
        setLoading(false);
        return;
      }

      try {
        // Use authAxios which already handles token attachment and 401 refresh
        const response = await authAxios.get(`/api/orders/${orderId}`);

        // --- IMPORTANT FIX HERE: Correctly parse the nested API response ---
        // Your backend's getOrderDetails function returns { success: true, data: orderObject }
        if (response.data.success && response.data.data) {
          const backendOrder = response.data.data; // This is the actual order object

          // Map cartItems from backend to 'items' for frontend consistency
          const transformedItems = backendOrder.cartItems.map((item) => ({
            ...item,
            // Adjust image URL based on how your backend's populate returns it
            // Backend's getOrderDetails transforms productId.images to `image` for each item
            // in the response, so `item.image` should directly contain the URL.
            image: item.image || `${import.meta.env.VITE_API_URL}/uploads/default-product.png`,
          }));

          setOrder({
            ...backendOrder, // Spread all properties from the actual order object
            items: transformedItems, // Use the transformed items
            total: backendOrder.totalAmount, // Ensure 'total' property matches backend's 'totalAmount'
            // Ensure paymentMethod is correctly structured based on backend response
            paymentMethod: {
              type: backendOrder.paymentDetails?.method || 'Card',
              last4: backendOrder.paymentDetails?.last4 || 'N/A', // Assuming last4 is directly on paymentDetails
              status: backendOrder.paymentDetails?.status || 'N/A',
              paidAt: backendOrder.paymentDetails?.paidAt || backendOrder.createdAt,
            },
            shippingAddress: {
                name: `${backendOrder.customerDetails?.firstname || ''} ${backendOrder.customerDetails?.lastname || ''}`.trim(),
                street: backendOrder.shippingAddress?.street || backendOrder.customerDetails?.address || 'N/A',
                city: backendOrder.shippingAddress?.city || backendOrder.customerDetails?.city || 'N/A',
                state: backendOrder.shippingAddress?.state || backendOrder.customerDetails?.state || 'N/A',
                zip: backendOrder.shippingAddress?.zip || backendOrder.customerDetails?.zip || 'N/A',
                country: backendOrder.shippingAddress?.country || backendOrder.customerDetails?.country || 'N/A',
                phone: backendOrder.customerDetails?.phone || 'N/A' // Added phone from customerDetails
            }
          });
        } else {
          throw new Error(response.data.message || "Unexpected response format from order details API.");
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        let errorMessage = "Failed to fetch order details.";
        if (err.response) {
          switch (err.response.status) {
            case 404:
              errorMessage = "Order not found or you don't have access to it.";
              break;
            case 401: // Although authAxios handles this, good to have specific message
              errorMessage = "Authentication required. Please log in.";
              break;
            case 403:
              errorMessage = "Access denied. You do not have permission to view this order.";
              break;
            case 500:
              errorMessage = "Server error. Please try again later.";
              break;
            default:
              errorMessage = err.response.data?.message || err.response.data?.error || errorMessage;
          }
        } else if (err.request) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          errorMessage = err.message || errorMessage;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) { // Only attempt to fetch if orderId exists
      fetchOrder();
    }
  }, [orderId, authAxios, isLoggedIn]); // Add isLoggedIn to dependencies

  const getStatusProgress = (status) => {
    switch (status?.toLowerCase()) { // Use optional chaining and lowercase for robustness
      case "processing":
        return 25;
      case "shipped":
        return 66;
      case "delivered":
        return 100;
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) { // Use optional chaining and lowercase
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">
            Loading your order details...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            We're preparing your order information
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-sm">
          <ExclamationCircleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/orders"
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-sm">
          <ShoppingBagIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the order you're looking for.
          </p>
          <Link
            to="/orders"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button and header */}
        <div className="mb-8">
          <Link
            to="/orders"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Back to My Orders
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order Details
              </h1>
              <p className="text-gray-600 mt-1">
                Order #{order.orderNumber || order._id?.slice(-8).toUpperCase() || 'N/A'} • Placed on{" "}
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : 'N/A'}
              </p>
            </div>

            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                order.status
              )}`}
            >
              {order.status === "processing" && (
                <ClockIcon className="w-4 h-4 mr-2" />
              )}
              {order.status === "shipped" && (
                <TruckIcon className="w-4 h-4 mr-2" />
              )}
              {order.status === "delivered" && (
                <CheckCircleIcon className="w-4 h-4 mr-2" />
              )}
              {order.status === "cancelled" && (
                <ExclamationCircleIcon className="w-4 h-4 mr-2" />
              )}
              <span className="capitalize">{order.status}</span>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Order items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order status tracker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Progress
              </h2>

              {order.status !== "cancelled" ? (
                <div className="space-y-8">
                  <div className="flex justify-between items-center relative">
                    {/* Progress bar background */}
                    <div className="absolute top-5 left-0 right-0 h-2 bg-gray-200 rounded-full z-0">
                      <div
                        className={`h-2 bg-green-500 rounded-full transition-all duration-500 ease-out`}
                        style={{
                          width: `${getStatusProgress(order.status)}%`,
                        }}
                      ></div>
                    </div>

                    {/* Processing step */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          ["processing", "shipped", "delivered"].includes(
                            order.status
                          )
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        <ShoppingBagIcon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          ["processing", "shipped", "delivered"].includes(
                            order.status
                          )
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        Processing
                      </span>
                    </div>

                    {/* Shipped step */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          ["shipped", "delivered"].includes(order.status)
                            ? "bg-green-500 text-white"
                            : ["processing"].includes(order.status)
                            ? "bg-gray-200 text-gray-500"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        <TruckIcon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          ["shipped", "delivered"].includes(order.status)
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        Shipped
                      </span>
                    </div>

                    {/* Delivered step */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          order.status === "delivered"
                            ? "bg-green-500 text-white"
                            : ["processing", "shipped"].includes(order.status)
                            ? "bg-gray-200 text-gray-500"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          order.status === "delivered"
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        Delivered
                      </span>
                    </div>
                  </div>

                  {order.status === "processing" && (
                    <p className="text-sm text-gray-600">
                      Your order is being prepared. We'll notify you when it
                      ships.
                    </p>
                  )}
                  {order.status === "shipped" && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800 font-medium">
                        Your order is on the way!
                      </p>
                      {order.trackingNumber && (
                        <p className="text-sm text-blue-700 mt-1">
                          Tracking number:{" "}
                          <span className="font-medium">
                            {order.trackingNumber}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <ExclamationCircleIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-red-600 font-medium">
                    This order has been cancelled
                  </p>
                  {order.cancellationReason && (
                    <p className="text-gray-600 mt-2 text-sm">
                      Reason: {order.cancellationReason}
                    </p>
                  )}
                </div>
              )}
            </motion.div>

            {/* Order items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Items ({order.items?.length || 0}) {/* Added optional chaining */}
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {order.items?.map((item, index) => ( /* Added optional chaining */
                  <motion.div
                    key={item.id || item._id || index} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex">
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white">
                        <img
                          src={item.image.url} // This should directly be the URL now
                          alt={item.name}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            e.target.src = `${
                              import.meta.env.VITE_API_URL
                            }/uploads/default-product.png`;
                          }}
                        />
                      </div>

                      <div className="ml-4 flex-grow">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {item.name}
                            </h3>
                            {item.variant && (
                              <p className="text-xs text-gray-500 mt-1">
                                {item.variant}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ₹{item.price?.toFixed(2)}
                            </p>
                            {item.originalPrice &&
                              item.originalPrice > item.price && (
                                <p className="text-xs text-gray-500 line-through">
                                  ₹{item.originalPrice?.toFixed(2)}
                                </p>
                              )}
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between items-end">
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            ₹{(item.price * item.quantity)?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {order.status === "delivered" && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <button className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center">
                          <ReceiptRefundIcon className="w-4 h-4 mr-2" />
                          Request return
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right column - Order summary */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6 sticky top-8"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-medium">
                    ₹{order.subtotal?.toFixed(2)}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Discount</span>
                    <span className="text-sm font-medium text-green-600">
                      -₹{order.discount?.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shipping</span>
                  <span className="text-sm font-medium">
                    {order.shippingCost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `₹${order.shippingCost?.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="text-sm font-medium">
                    ₹{order.tax?.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      ₹{order.total?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{order.shippingAddress?.name}</p>
                  <p>{order.shippingAddress?.street}</p>
                  <p>
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.state}{" "}
                    {order.shippingAddress?.zip}
                  </p>
                  <p>{order.shippingAddress?.country}</p>
                  <p className="mt-2 font-medium">
                    Phone: {order.shippingAddress?.phone}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Payment Method
                </h3>
                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <p className="capitalize font-medium">
                    {order.paymentMethod?.type} ending in{" "}
                    {order.paymentMethod?.last4}
                  </p>
                  {order.paymentMethod?.status === "paid" ? (
                    <p className="inline-flex items-center text-green-600 mt-2">
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Paid on{" "}
                      {new Date(order.paymentMethod?.paidAt).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="inline-flex items-center text-yellow-600 mt-2">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      Pending
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                  <QuestionMarkCircleIcon className="w-4 h-4 mr-2" />
                  Need Help?
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderedItemsPage;
