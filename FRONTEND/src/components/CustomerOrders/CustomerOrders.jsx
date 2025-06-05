import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  CheckCircleIcon,
  TruckIcon,
  ShoppingBagIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const OrderedItemsPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID is required");
        setLoading(false);
        return;
      }

      console.log("Fetching order:", orderId);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/orders/${orderId}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Order response:", response.data);

        // Transform data if needed to match your frontend structure
        const orderData = {
          ...response.data,
          // Ensure all items have images
          items: response.data.items.map((item) => ({
            ...item,
            image: item.image || "/placeholder-product.jpg",
          })),
        };

        setOrder(orderData);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Failed to fetch order"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "processing":
        return <ShoppingBagIcon className="w-5 h-5" />;
      case "shipped":
        return <TruckIcon className="w-5 h-5" />;
      case "delivered":
        return <CheckCircleIcon className="w-5 h-5" />;
      case "cancelled":
        return <ExclamationCircleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getStatusProgress = (status) => {
    switch (status) {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShoppingBagIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600">
            The order you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Order Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Confirmation
          </h1>
          <p className="text-lg text-gray-600">Thank you for your purchase!</p>
          <p className="text-sm text-gray-500 mt-2">
            Order #<span className="font-medium">{order.orderNumber}</span> •
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Order Status Tracker */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 ">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Order Status:{" "}
            <span className="capitalize font-bold text-green-600">
              {order.status}
            </span>
          </h2>

          {order.status !== "cancelled" ? (
            <div className="flex justify-between items-center relative">
              <div
                className={`flex flex-col items-center ${
                  ["processing", "shipped", "delivered"].includes(order.status)
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                    ["processing", "shipped", "delivered"].includes(
                      order.status
                    )
                      ? "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  <ShoppingBagIcon className="w-5 h-5 " />
                </div>
                <span className="text-xs mt-2">Processing</span>
              </div>

              <div
                className={`flex flex-col items-center ${
                  ["shipped", "delivered"].includes(order.status)
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                    ["shipped", "delivered"].includes(order.status)
                      ? "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  <TruckIcon className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2">Shipped</span>
              </div>

              <div
                className={`flex flex-col items-center ${
                  order.status === "delivered"
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                    order.status === "delivered"
                      ? "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2">Delivered</span>
              </div>

              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0">
                <div
                  className={`h-1 bg-green-600 transition-all duration-300 ease-in-out`}
                  style={{
                    width: `${getStatusProgress(order.status)}%`,
                  }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                <ExclamationCircleIcon className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">
                This order has been cancelled
              </p>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Order Items ({order.items.length})
              </h2>
              <div className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex">
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md overflow-hidden">
                      <img
                        src={
                          item.images && item.images.length > 0
                            ? `${import.meta.env.VITE_API_URL}/uploads/${
                                item.images[0]
                              }`
                            : `${
                                import.meta.env.VITE_API_URL
                              }/uploads/default-product.png`
                        }
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = `${
                            import.meta.env.VITE_API_URL
                          }/uploads/default-product.png`; // Full URL from backend
                        }}
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="text-sm font-medium text-gray-900">
                        {item.name}
                      </h3>
                      {item.variant && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.variant}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ₹{item.price.toFixed(2)}
                      </p>
                      {item.originalPrice &&
                        item.originalPrice > item.price && (
                          <p className="text-xs text-gray-500 line-through">
                            ₹{item.originalPrice.toFixed(2)}
                          </p>
                        )}
                      <p className="text-xs text-gray-600 mt-1">
                        Total: ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-medium">
                    ₹{order.subtotal.toFixed(2)}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Discount</span>
                    <span className="text-sm font-medium text-green-600">
                      -₹{order.discount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shipping</span>
                  <span className="text-sm font-medium">
                    {order.shippingCost === 0
                      ? "Free"
                      : `₹${order.shippingCost.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="text-sm font-medium">
                    ₹{order.tax.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-gray-900">
                      Total
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      ₹{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.zip}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Payment Method
                </h3>
                <div className="text-sm text-gray-600">
                  <p className="capitalize">
                    {order.paymentMethod.type} ending in{" "}
                    {order.paymentMethod.last4}
                  </p>
                  {order.paymentMethod.status === "paid" ? (
                    <p className="inline-flex items-center text-green-600 mt-1">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Paid on{" "}
                      {new Date(
                        order.paymentMethod.paidAt
                      ).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="inline-flex items-center text-yellow-600 mt-1">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      Pending
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderedItemsPage;
