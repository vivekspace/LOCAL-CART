import { useState, useEffect } from "react";
import { RefreshCw, ShoppingBag, Clock, Check, X } from "lucide-react";
import {
  FiPackage,
  FiDollarSign,
  FiClock,
  FiCheck,
  FiSearch,
  FiChevronDown,
  FiUser,
  FiCalendar,
  FiCreditCard,
  FiEye,
  FiPrinter,
  FiDownload,
  FiTruck,
  FiAlertCircle,
} from "react-icons/fi";

const OrderPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentOrderToUpdate, setCurrentOrderToUpdate] = useState(null);
  const [newOrderStatus, setNewOrderStatus] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const vendorToken = localStorage.getItem("vendorToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/vendor/orders`,
        {
          headers: { Authorization: `Bearer ${vendorToken}` },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders", err);
      // Optionally, set an error state here to display to the user
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  const handleUpdateStatusClick = (order) => {
    setCurrentOrderToUpdate(order);
    setNewOrderStatus(order.paymentStatus); // Pre-fill with current status
    setUpdateError(null);
    setUpdateSuccess(false);
    setShowUpdateModal(true);
  };

  const handleUpdateOrderStatus = async () => {
    // Make sure currentOrderToUpdate and newOrderStatus are available
    if (!currentOrderToUpdate || !newOrderStatus) return;

    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const vendorToken = localStorage.getItem("vendorToken");
      const response = await fetch(
        // **THIS IS THE CRUCIAL CHANGE:** Use currentOrderToUpdate._id
        `${import.meta.env.VITE_API_URL}/api/vendor/orders/${currentOrderToUpdate._id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${vendorToken}`,
          },
          body: JSON.stringify({ status: newOrderStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }

      // Update the order in the local state immediately
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === currentOrderToUpdate._id // Use _id for comparison here too
            ? { ...order, paymentStatus: newOrderStatus }
            : order
        )
      );
      setUpdateSuccess(true);
      setTimeout(() => {
        setShowUpdateModal(false);
        setCurrentOrderToUpdate(null);
      }, 1500); // Close modal after 1.5 seconds
    } catch (err) {
      console.error("Error updating order status:", err);
      setUpdateError(err.message || "An unexpected error occurred.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    // You can still use orderId for search and display, as it's for UI purposes
    const orderId = order?.orderId || "";
    const customerName = order?.customer || "";

    const matchesSearch =
      orderId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (order?.paymentStatus &&
        order.paymentStatus.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-gradient-to-r from-yellow-400 to-orange-500",
        text: "text-white",
        icon: Clock,
        label: "Pending",
      },
      completed: {
        bg: "bg-gradient-to-r from-green-400 to-emerald-500",
        text: "text-white",
        icon: Check,
        label: "Completed",
      },
      failed: {
        bg: "bg-gradient-to-r from-red-400 to-pink-500",
        text: "text-white",
        icon: X,
        label: "Failed",
      },
      processing: {
        bg: "bg-gradient-to-r from-blue-400 to-green-500",
        text: "text-white",
        icon: RefreshCw,
        label: "Processing",
      },
      shipped: {
        bg: "bg-gradient-to-r from-purple-400 to-indigo-500",
        text: "text-white",
        icon: FiTruck,
        label: "Shipped",
      },
      cancelled: {
        bg: "bg-gradient-to-r from-gray-400 to-gray-500",
        text: "text-white",
        icon: X,
        label: "Cancelled",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} shadow-sm`}
      >
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getTotalStats = () => {
    const total = filteredOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );
    const pending = filteredOrders.filter(
      (order) => order.paymentStatus === "pending"
    ).length;
    const completed = filteredOrders.filter(
      (order) => order.paymentStatus === "completed"
    ).length;

    return { total, pending, completed, count: filteredOrders.length };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-600 to-green-600 p-2 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-600 bg-clip-text text-transparent">
                  Order Management
                </h1>
                <p className="text-gray-600 text-sm">
                  Manage and track your vendor orders
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-600 text-white rounded-xl hover:from-green-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Orders
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.count}
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
                <FiPackage className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{stats.total.toFixed(2)}
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
                <FiDollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.pending}
                </p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-yellow-600 p-3 rounded-xl">
                <FiClock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
                <FiCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400 w-5 h-5" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200"
                placeholder="Search orders or customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-gray-50 border border-gray-200 pl-4 pr-10 py-3 rounded-xl leading-5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200 min-w-[160px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FiChevronDown className="text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FiPackage className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Orders Found
              </h3>
              <p className="text-gray-600">
                No orders match your current search criteria.
              </p>
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <div
                key={order._id} // Using _id as key is generally safer for MongoDB data
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-green-50 to-green-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-green-600 to-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                        #{order.orderId} {/* Display the short orderId here */}
                      </div>
                      {order.paymentStatus &&
                        getStatusBadge(order.paymentStatus)}
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <FiUser className="w-4 h-4" />
                        <span className="font-medium">{order.customer}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiCalendar className="w-4 h-4" />
                        <span>{new Date(order.orderDate).toLocaleDateString()}</span> {/* Changed to orderDate */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">
                          Order Summary
                        </h4>
                        <FiDollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">
                            ₹{order.subtotal?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="font-medium">
                            ₹{order.shippingCharge?.toFixed(2) || "0.00"} {/* Changed to shippingCharge */}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                          <span className="font-semibold text-gray-800">
                            Total:
                          </span>
                          <span className="font-bold text-green-600">
                            ₹{order.totalAmount?.toFixed(2) || "0.00"} {/* Changed to totalAmount */}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">
                          Payment Info
                        </h4>
                        <FiCreditCard className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Method:</span>
                          <span className="font-medium capitalize">
                            {order.paymentMethod}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium capitalize">
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">
                          Order Details
                        </h4>
                        <FiPackage className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span className="font-medium">
                            {new Date(order.orderDate).toLocaleDateString()} {/* Changed to orderDate */}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Items:</span>
                          <span className="font-medium">
                            {order.items?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Section */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <FiPackage className="w-5 h-5 mr-2 text-gray-600" />
                      Order Items
                    </h4>
                    {order.items?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-white rounded-lg">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-tl-lg">
                                Product
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Qty
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-tr-lg">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {order.items.map((item, itemIndex) => (
                              <tr
                                key={itemIndex}
                                className="hover:bg-white transition-colors duration-150"
                              >
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                                    {item.quantity}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                  ₹{item.price?.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-green-600">
                                  ₹{(item.quantity * item.price)?.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                        <div className="flex items-center">
                          <FiAlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                          <p className="text-sm text-yellow-800 font-medium">
                            No item details available for this order
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div className="flex flex-wrap gap-3 justify-end">
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200">
                      <FiEye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200">
                      <FiPrinter className="w-4 h-4 mr-2" />
                      Print Invoice
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200">
                      <FiDownload className="w-4 h-4 mr-2" />
                      Download
                    </button>
                    {/* Update Status Button */}
                    <button
                      onClick={() => handleUpdateStatusClick(order)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                    >
                      <FiTruck className="w-4 h-4 mr-2" />
                      Update Status
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Update Order Status Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white rounded-2xl shadow-xl max-w-md mx-auto animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Update Order Status
            </h3>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setShowUpdateModal(false)}
            >
              <X className="w-6 h-6" />
            </button>

            {currentOrderToUpdate && (
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Order ID:{" "}
                  <span className="font-semibold">
                    #{currentOrderToUpdate.orderId} {/* Display the human-readable orderId */}
                  </span>
                </p>
                <p className="text-gray-700 mb-4">
                  Customer:{" "}
                  <span className="font-semibold">
                    {currentOrderToUpdate.customer}
                  </span>
                </p>

                <label
                  htmlFor="order-status"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New Status
                </label>
                <div className="relative">
                  <select
                    id="order-status"
                    className="block w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none transition-all duration-200"
                    value={newOrderStatus}
                    onChange={(e) => setNewOrderStatus(e.target.value)}
                    disabled={updateLoading}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiChevronDown className="text-gray-400 w-5 h-5" />
                  </div>
                </div>
              </div>
            )}

            {updateError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4" role="alert">
                <span className="block sm:inline">{updateError}</span>
              </div>
            )}

            {updateSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative mb-4" role="alert">
                <span className="block sm:inline">Order status updated successfully!</span>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-5 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                onClick={() => setShowUpdateModal(false)}
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUpdateOrderStatus}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <FiCheck className="w-4 h-4 mr-2" />
                )}
                {updateLoading ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;