import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    CheckCircleIcon,
    TruckIcon,
    ShoppingBagIcon,
    ClockIcon,
    ExclamationCircleIcon,
    ArrowLeftIcon,
    QuestionMarkCircleIcon, // Using Heroicons for a consistent look
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion"; // For subtle animations
import { useAuth } from "../../Context/Context.jsx";
import { toast } from "react-toastify";

const SellerOrderDetailsPage = () => {
    const { orderId } = useParams();
    const { authAxios, isSeller, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false); // State for update operations
    console.log(order?.cartItems.image)

    // Redirect if not logged in or not a seller
    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/login");
            toast.error("Please log in to view seller orders.");
            return;
        }
        if (!isSeller) {
            navigate("/");
            toast.error("Access denied. Seller privileges required.");
            return;
        }
    }, [isLoggedIn, isSeller, navigate]);


    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log(`Fetching seller order details for ID: ${orderId}`);
                // Call the new seller-specific endpoint
                // This endpoint in orderController.js: `exports.getSellerOrderDetails`
                const response = await authAxios.get(`/api/orders/seller/${orderId}`);

                console.log("Raw Seller Order details response:", response.data);

                // Assuming your backend returns { success: true, data: orderObject }
                if (response.data.success && response.data.data) {
                    setOrder(response.data.data); // Set the entire tailored order object
                } else {
                    throw new Error(response.data.message || "Unexpected response format from seller order details API.");
                }

            } catch (err) {
                console.error('Error fetching seller order details:', err);
                let errorMessage = "Failed to load order details.";
                if (err.response) {
                    switch (err.response.status) {
                        case 404:
                            errorMessage = "Order not found or you do not have permission to view this order.";
                            break;
                        case 403:
                            errorMessage = "Access denied. You can only view orders containing your products.";
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

        if (orderId && isLoggedIn && isSeller) {
            fetchOrderDetails();
        }
    }, [orderId, authAxios, isLoggedIn, isSeller]);

    // Function to update order status
    const updateOrderStatus = async (newStatus) => {
        setUpdating(true);
        try {
            const response = await authAxios.put(`/api/orders/vendor/${orderId}/status`, {
                status: newStatus,
            });

            if (response.data.success) {
                setOrder((prev) => ({ ...prev, status: newStatus })); // Optimistic UI update
                toast.success(`Order status updated to ${newStatus}!`);
            } else {
                throw new Error(response.data.message || "Failed to update status.");
            }
        } catch (err) {
            console.error("Error updating order status:", err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to update order status.";
            toast.error(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    // Helper to get status progress for the visual tracker (3 steps: processing, shipped, delivered)
    const getStatusProgress = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return 0; // Order is placed but not yet processing
            case "processing":
                return 33;
            case "shipped":
                return 66;
            case "delivered":
                return 100;
            case "cancelled":
                return 0; // Cancelled means no progress on delivery
            default:
                return 0;
        }
    };

    // Helper to get status color for labels
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "processing":
                return "bg-blue-100 text-blue-800";
            case "shipped":
                return "bg-purple-100 text-purple-800";
            case "delivered":
                return "bg-green-100 text-green-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            case "pending":
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Conditional rendering based on auth state, loading, error, and order data
    if (!isLoggedIn || !isSeller) {
        return null; // Initial redirect handled by useEffect
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700 font-medium">
                        Loading seller order details...
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Fetching your order information
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
                            to="/seller/orders"
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
                        We couldn't find the order you're looking for or it doesn't contain your products.
                    </p>
                    <Link
                        to="/seller/orders"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <ArrowLeftIcon className="w-5 h-5 mr-1" />
                        Back to My Orders
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-inter">
            <div className="max-w-6xl mx-auto">
                {/* Back button and header */}
                <div className="mb-8">
                    <Link
                        to="/seller/orders"
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
                                Order #{(order.orderNumber || order._id?.slice(-8).toUpperCase()) || "N/A"} • Placed on{" "}
                                {order.createdAt
                                    ? new Date(order.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    : "N/A"}
                            </p>
                        </div>

                        <div
                            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                                order.status
                            )}`}
                        >
                            {order.status === "pending" && <ClockIcon className="w-4 h-4 mr-2" />}
                            {order.status === "processing" && <ShoppingBagIcon className="w-4 h-4 mr-2" />}
                            {order.status === "shipped" && <TruckIcon className="w-4 h-4 mr-2" />}
                            {order.status === "delivered" && <CheckCircleIcon className="w-4 h-4 mr-2" />}
                            {order.status === "cancelled" && <ExclamationCircleIcon className="w-4 h-4 mr-2" />}
                            <span className="capitalize">{order.status}</span>
                        </div>
                    </div>
                </div>

                {/* Main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column - Order progress and items */}
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

                                        {/* Pending/Processing step */}
                                        <div className="flex flex-col items-center z-10">
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                                                    ["pending", "processing", "shipped", "delivered"].includes(
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
                                                    ["pending", "processing", "shipped", "delivered"].includes(
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
                                                        : ["processing", "pending"].includes(order.status)
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
                                                        : ["pending", "processing", "shipped"].includes(order.status)
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

                                    {(order.status === "pending" || order.status === "processing") && (
                                        <p className="text-sm text-gray-600">
                                            Your order is being prepared. We'll notify the customer when it ships.
                                        </p>
                                    )}
                                    {order.status === "shipped" && (
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <p className="text-sm text-blue-800 font-medium">
                                                Your order is on the way to the customer!
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

                        {/* Order actions for sellers */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="bg-white rounded-xl shadow-sm p-6"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                Update Order Status
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {order.status !== "cancelled" && order.status !== "delivered" && (
                                    <>
                                        {/* Only show 'Mark as Processing' if current status is 'pending' */}
                                        {order.status === "pending" && (
                                            <button
                                                onClick={() => updateOrderStatus("processing")}
                                                disabled={updating}
                                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md transition duration-300 ease-in-out"
                                            >
                                                {updating ? "Updating..." : "Mark as Processing"}
                                            </button>
                                        )}
                                        {/* Only show 'Mark as Shipped' if current status is 'processing' */}
                                        {order.status === "processing" && (
                                            <button
                                                onClick={() => updateOrderStatus("shipped")}
                                                disabled={updating}
                                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md transition duration-300 ease-in-out"
                                            >
                                                {updating ? "Updating..." : "Mark as Shipped"}
                                            </button>
                                        )}
                                        {/* Only show 'Mark as Delivered' if current status is 'shipped' */}
                                        {order.status === "shipped" && (
                                            <button
                                                onClick={() => updateOrderStatus("delivered")}
                                                disabled={updating}
                                                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md transition duration-300 ease-in-out"
                                            >
                                                {updating ? "Updating..." : "Mark as Delivered"}
                                            </button>
                                        )}
                                        {/* Allow cancellation if not already delivered/cancelled */}
                                        {(order.status === "pending" || order.status === "processing" || order.status === "shipped") && (
                                            <button
                                                onClick={() => updateOrderStatus("cancelled")}
                                                disabled={updating}
                                                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md transition duration-300 ease-in-out"
                                            >
                                                {updating ? "Updating..." : "Cancel Order"}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>

                        {/* Your Order Items (filtered for seller) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-white rounded-xl shadow-sm overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Your Order Items ({order.cartItems?.length || 0})
                                </h2>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {order.cartItems?.map((item, index) => (
                                    <motion.div
                                        key={item._id || index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="p-6 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white mr-4">
                                                <img
                                                    src={item.image.url || `${import.meta.env.VITE_API_URL}/uploads/default-product.png`}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain p-2"
                                                    onError={(e) => {
                                                        e.target.src = `${import.meta.env.VITE_API_URL}/uploads/default-product.png`;
                                                    }}
                                                />
                                            </div>

                                            <div className="flex-grow">
                                                <div className="flex justify-between items-baseline">
                                                    <div>
                                                        <h3 className="text-base font-medium text-gray-900">
                                                            {item.name}
                                                        </h3>
                                                        {item.variant && (
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {item.variant}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            ₹{item.price?.toFixed(2)}
                                                        </p>
                                                        {item.originalPrice && item.originalPrice > item.price && (
                                                            <p className="text-xs text-gray-500 line-through">
                                                                ₹{item.originalPrice?.toFixed(2)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex justify-between items-end">
                                                    <p className="text-sm text-gray-500">
                                                        Qty: {item.quantity}
                                                    </p>
                                                    <p className="text-base font-medium text-gray-900">
                                                        ₹{(item.price * item.quantity)?.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right column - Customer Info, Shipping, Order Summary & Payment */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Customer Information (Detailed for Seller) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                            className="bg-white rounded-xl shadow-sm p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Customer Information
                            </h2>
                            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                                <p className="font-medium">
                                    Name: {order.customerDetails?.firstname}{" "}
                                    {order.customerDetails?.lastname || "N/A"}
                                </p>
                                <p>Email: {order.customerDetails?.email || "N/A"}</p>
                                <p>Phone: {order.customerDetails?.phone || "N/A"}</p>
                            </div>
                        </motion.div>

                        {/* Shipping Address */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-white rounded-xl shadow-sm p-6"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                Shipping Address
                            </h3>
                            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                                <p className="font-medium">
                                    {`${order.customerDetails?.firstname || ''} ${order.customerDetails?.lastname || ''}`.trim() || 'N/A'}
                                </p>
                                <p>{order.shippingAddress?.street || 'N/A'}</p>
                                <p>
                                    {order.shippingAddress?.city || 'N/A'},{" "}
                                    {order.shippingAddress?.state || 'N/A'}{" "}
                                    {order.shippingAddress?.zip || ''}
                                </p>
                                <p>{order.shippingAddress?.country || 'N/A'}</p>
                            </div>
                        </motion.div>

                        {/* Order Summary (Seller's Portion) - Made sticky */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.35 }}
                            className="bg-white rounded-xl shadow-sm p-6 sticky lg:top-8"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Your Order Summary
                            </h2>

                            <div className="space-y-3">
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
                                            Total for Your Items
                                        </span>
                                        <span className="text-base font-bold text-gray-900">
                                            ₹{order.totalAmount?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Payment Details */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="bg-white rounded-xl shadow-sm p-6"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                Payment Details
                            </h3>
                            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                                <p className="capitalize font-medium">
                                    Method: {order.paymentDetails?.method || 'N/A'}{" "}
                                    {/* Assuming no 'last4' or 'paidAt' for seller's view on paymentDetails based on backend definition */}
                                </p>
                                <p className="inline-flex items-center mt-2">
                                    {order.paymentDetails?.status?.toLowerCase() === "paid" ? (
                                        <>
                                            <CheckCircleIcon className="w-4 h-4 mr-2 text-green-600" />
                                            <span className="text-green-600">Status: Paid</span>
                                        </>
                                    ) : (
                                        <>
                                            <ClockIcon className="w-4 h-4 mr-2 text-yellow-600" />
                                            <span className="text-yellow-600">Status: {order.paymentDetails?.status || 'Pending'}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </motion.div>


                        <div className="mt-8">
                            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                                <QuestionMarkCircleIcon className="w-4 h-4 mr-2" />
                                Need Help?
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center text-sm text-gray-600 border-t border-gray-200 pt-6 mt-8">
                    <p>
                        <strong>Order Date:</strong>{" "}
                        {order.createdAt
                            ? new Date(order.createdAt).toLocaleString()
                            : "N/A"}
                    </p>
                    {order.updatedAt && order.updatedAt !== order.createdAt && (
                        <p>
                            <strong>Last Updated:</strong>{" "}
                            {new Date(order.updatedAt).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerOrderDetailsPage;
