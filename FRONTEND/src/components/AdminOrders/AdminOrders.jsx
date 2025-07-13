import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import { ShoppingBag, DollarSign, Truck, CheckCircle, XCircle, Info, Edit, RefreshCw, Mail, Phone, MapPin, MessageSquare, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../Context/Context';
const AdminOrdersPage = () => {
  const { authAxios, jwtToken, user, isAuthLoading } = useAuth(); // Destructure authAxios and jwtToken from context

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  const [updateStatusError, setUpdateStatusError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');

  // Refs for managing timeouts
  const statusMessageTimeoutRef = useRef(null);
  const statusErrorTimeoutRef = useRef(null);

  // Define your API base URL here - it's already available via authAxios baseURL
  // const API_BASE_URL = import.meta.env.VITE_API_URL; // No longer strictly needed for authAxios calls

  // Removed getAdminToken as authAxios handles the token
  // const getAdminToken = () => {
  //   return localStorage.getItem('adminToken');
  // };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    // No need to manually get token here, authAxios handles it

    try {
      // Use authAxios for authenticated requests
      const response = await authAxios.get(`/api/orders/admin`);
      
      // authAxios automatically throws on !response.ok, so direct data access
      setOrders(response.data.orders);
      console.log("Fetched orders:", response.data.orders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      // Check if it's an AxiosError and handle specific statuses
      if (err.response?.status === 401) {
        setError("Unauthorized: Please ensure you are logged in as an admin and have a valid token.");
      } else {
        setError(`Failed to load orders: ${err.message}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  }, [authAxios]); // Dependency for useCallback now includes authAxios

  useEffect(() => {
    // Only fetch orders if authentication is not loading and a token exists
    if (!isAuthLoading && jwtToken) {
      fetchOrders();
    }
    // If no token and not loading, set error immediately
    if (!isAuthLoading && !jwtToken) {
        setError("You must be logged in to view orders. Please log in as an admin.");
        setLoading(false);
    }
  }, [fetchOrders, isAuthLoading, jwtToken]); // Dependencies include auth loading and token

  const openOrderDetailsModal = (order) => {
    setSelectedOrder(order);
    setCurrentStatus(order.status);
    setIsModalOpen(true);
    setStatusUpdateMessage(''); // Clear any previous update messages
    setUpdateStatusError(null);
  };

  const closeOrderDetailsModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  const handleStatusChange = (e) => {
    setCurrentStatus(e.target.value);
  };

  const updateOrderStatus = useCallback(async () => { // Made useCallback
    if (!selectedOrder) return;

    setUpdateStatusLoading(true);
    setUpdateStatusError(null);
    setStatusUpdateMessage('');

    // Clear any existing timeouts before setting new messages/errors
    if (statusMessageTimeoutRef.current) {
        clearTimeout(statusMessageTimeoutRef.current);
    }
    if (statusErrorTimeoutRef.current) {
        clearTimeout(statusErrorTimeoutRef.current);
    }

    try {
      // Use authAxios for authenticated requests
      // Corrected API endpoint to include /api/
      const response = await authAxios.put(`/api/orders/${selectedOrder._id}/status`, { status: currentStatus });

      // authAxios automatically throws on !response.ok
      setStatusUpdateMessage('Order status updated successfully!');
      setIsModalOpen(false); // Close modal on success

      // Re-fetch orders to reflect the update immediately
      fetchOrders();
    } catch (err) {
      console.error("Failed to update order status:", err);
      setUpdateStatusError(`Failed to update status: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdateStatusLoading(false);
      // Set new timeouts
      statusMessageTimeoutRef.current = setTimeout(() => setStatusUpdateMessage(''), 3000);
      statusErrorTimeoutRef.current = setTimeout(() => setUpdateStatusError(null), 3000);
    }
  }, [selectedOrder, currentStatus, authAxios, fetchOrders]); // Dependencies for useCallback


  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans antialiased">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800 flex items-center">
          <ShoppingBag className="mr-3 text-green-600" /> All Orders
        </h1>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center"
          disabled={loading || isAuthLoading || !jwtToken} // Disable if auth is loading or no token
        >
          <RefreshCw className={`mr-2 ${(loading || isAuthLoading) ? 'animate-spin' : ''}`} /> Refresh Orders
        </button>
      </div>

      {(loading || isAuthLoading) && ( // Show loading if auth is still initializing
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
          <p className="ml-4 text-gray-600 text-lg">Loading orders...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {!loading && !isAuthLoading && !error && orders.length === 0 && ( // Add isAuthLoading condition
        <div className="text-center py-10">
          <p className="text-gray-500 text-xl">No orders found.</p>
        </div>
      )}

      {!loading && !isAuthLoading && !error && orders.length > 0 && ( // Add isAuthLoading condition
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items (Summary)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.customerName} <br />
                      <span className="text-gray-500 text-xs">{order.customerEmail}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.items.slice(0, 2).map((item, index) => (
                        <p key={index} className="flex items-center text-gray-600 mb-1">
                          {/* Access API_BASE_URL via import.meta.env, as authAxios doesn't expose it directly */}
                          <img src={`${import.meta.env.VITE_API_URL}/uploads/${item.imageUrl}`} alt={item.name} className="w-6 h-auto rounded-full mr-2 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `${import.meta.env.VITE_API_URL}/uploads/default-product.png`; }} />
                          {item.name} (x{item.quantity})
                        </p>
                      ))}
                      {order.items.length > 2 && (
                        <span className="text-xs text-gray-500">+{order.items.length - 2} more items</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                      ₹{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus} ({order.paymentMethod})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openOrderDetailsModal(order)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title="View Details"
                      >
                        <Info className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={closeOrderDetailsModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <button
                onClick={closeOrderDetailsModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
                Order Details #<span className="text-green-600">{selectedOrder.orderNumber}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Customer Info</h3>
                  <p className="text-gray-600"><strong className="font-medium">Name:</strong> {selectedOrder.customerName}</p>
                  <p className="text-gray-600"><strong className="font-medium">Email:</strong> {selectedOrder.customerEmail}</p>
                  <p className="text-gray-600"><strong className="font-medium">Phone:</strong> {selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Order Summary</h3>
                  <p className="text-gray-600"><strong className="font-medium">Total Amount:</strong> ₹{selectedOrder.totalAmount.toFixed(2)}</p>
                  <p className="text-gray-600"><strong className="font-medium">Payment:</strong> {selectedOrder.paymentStatus} ({selectedOrder.paymentMethod})</p>
                  <p className="text-gray-600"><strong className="font-medium">Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p className="text-gray-600"><strong className="font-medium">Shipping Address:</strong> {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zip}</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-700 mb-3">Items</h3>
              <div className="space-y-4 mb-6">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm">
                    <img
                      src={`${import.meta.env.VITE_API_URL}/uploads/${item.imageUrl}`}
                      alt={item.name}
                      className="w-16 h-auto rounded-lg object-cover mr-4 border border-gray-200"
                      onError={(e) => { e.target.onerror = null; e.target.src = `${import.meta.env.VITE_API_URL}/uploads/default-product.png`; }}
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Price: ₹{item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-semibold text-gray-700 mb-3">Update Order Status</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <select
                  value={currentStatus}
                  onChange={handleStatusChange}
                  className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-700 bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
                <button
                  onClick={updateOrderStatus}
                  disabled={updateStatusLoading || currentStatus === selectedOrder.status}
                  className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {updateStatusLoading ? (
                    <>
                      <RefreshCw className="animate-spin mr-2" /> Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2" /> Update Status
                    </>
                  )}
                </button>
              </div>
              {statusUpdateMessage && (
                <p className="text-green-600 text-center mt-2 font-medium">{statusUpdateMessage}</p>
              )}
              {updateStatusError && (
                <p className="text-red-600 text-center mt-2 font-medium">{updateStatusError}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrdersPage;