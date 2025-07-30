import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShoppingBag, DollarSign, Truck, CheckCircle, 
  XCircle, Info, Edit, RefreshCw, Mail, 
  Phone, MapPin, MessageSquare, User, Search, 
  ChevronDown, ChevronUp, Filter, Calendar 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../Context/Context';

const AdminOrdersPage = () => {
  const { authAxios, jwtToken, user, isAuthLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  const [updateStatusError, setUpdateStatusError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  console.log(orders)

  const statusMessageTimeoutRef = useRef(null);
  const statusErrorTimeoutRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
    const response = await authAxios.get(`/api/admin/orders`); // Corrected path
      setOrders(response.data.orders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized: Please ensure you are logged in as an admin.");
      } else {
        setError(`Failed to load orders: ${err.message}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  }, [authAxios]);

  useEffect(() => {
    if (!isAuthLoading && jwtToken) {
      fetchOrders();
    }
    if (!isAuthLoading && !jwtToken) {
      setError("You must be logged in to view orders. Please log in as an admin.");
      setLoading(false);
    }
  }, [fetchOrders, isAuthLoading, jwtToken]);

  const openOrderDetailsModal = (order) => {
    setSelectedOrder(order);
    setCurrentStatus(order.status);
    setIsModalOpen(true);
    setStatusUpdateMessage('');
    setUpdateStatusError(null);
  };

  const closeOrderDetailsModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  const handleStatusChange = (e) => {
    setCurrentStatus(e.target.value);
  };

  const updateOrderStatus = useCallback(async () => {
    if (!selectedOrder) return;

    setUpdateStatusLoading(true);
    setUpdateStatusError(null);
    setStatusUpdateMessage('');

    if (statusMessageTimeoutRef.current) {
      clearTimeout(statusMessageTimeoutRef.current);
    }
    if (statusErrorTimeoutRef.current) {
      clearTimeout(statusErrorTimeoutRef.current);
    }

    try {
    await authAxios.put(`/api/admin/orders/${selectedOrder._id}/status`, { status: currentStatus }); // Corrected path
      setStatusUpdateMessage('Order status updated successfully!');
      fetchOrders();
    } catch (err) {
      console.error("Failed to update order status:", err);
      setUpdateStatusError(`Failed to update status: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdateStatusLoading(false);
      statusMessageTimeoutRef.current = setTimeout(() => setStatusUpdateMessage(''), 3000);
      statusErrorTimeoutRef.current = setTimeout(() => setUpdateStatusError(null), 3000);
    }
  }, [selectedOrder, currentStatus, authAxios, fetchOrders]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const filteredAndSortedOrders = React.useMemo(() => {
    let filteredOrders = [...orders];
    
    // Apply search filter
    if (searchTerm) {
      filteredOrders = filteredOrders.filter(order => 
        order.orderNumber.toString().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filteredOrders.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredOrders;
  }, [orders, searchTerm, statusFilter, sortConfig]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'cancelled':
      case 'failed': return <XCircle className="h-4 w-4 mr-1" />;
      case 'shipped': return <Truck className="h-4 w-4 mr-1" />;
      default: return <Info className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans antialiased">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center">
              <ShoppingBag className="mr-3 text-green-600" /> 
              Order Management
            </h1>
            <p className="text-gray-600 mt-1">View and manage customer orders</p>
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all flex items-center justify-center"
            disabled={loading || isAuthLoading || !jwtToken}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${(loading || isAuthLoading) ? 'animate-spin' : ''}`} /> 
            Refresh Orders
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={sortConfig.key}
                onChange={(e) => handleSort(e.target.value)}
              >
                <option value="createdAt">Sort by Date</option>
                <option value="totalAmount">Sort by Amount</option>
                <option value="customerName">Sort by Customer</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {(loading || isAuthLoading) && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="ml-4 text-gray-600 text-lg">Loading orders...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !isAuthLoading && !error && filteredAndSortedOrders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? "Try adjusting your search or filter criteria."
              : "There are currently no orders in the system."}
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
      {!loading && !isAuthLoading && !error && filteredAndSortedOrders.length > 0 && (
        <div className="space-y-4">
          {filteredAndSortedOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Order Summary */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors grid grid-cols-2 md:grid-cols-5 gap-4 items-center"
                onClick={() => toggleExpandOrder(order._id)}
              >
                <div className="col-span-2 md:col-span-1">
                  <p className="text-sm text-gray-500">Order #</p>
                  <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900 truncate">{order.customerName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-bold text-gray-900">
                    ₹{order.totalAmount.toFixed(2)}
                  </p>
                </div>
                
                <div className="flex items-center justify-between md:justify-end">
                  <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openOrderDetailsModal(order);
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                  {expandedOrderId === order._id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 ml-2" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 ml-2" />
                  )}
                </div>
              </div>
              
              {/* Expanded Order Details */}
              <AnimatePresence>
                {expandedOrderId === order._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Customer Info */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          <User className="mr-2 h-5 w-5 text-blue-500" />
                          Customer Details
                        </h3>
                        <div className="space-y-2">
                          <p className="flex items-center text-gray-600">
                            <Mail className="mr-2 h-4 w-4 text-gray-400" />
                            {order.customerEmail}
                          </p>
                          <p className="flex items-center text-gray-600">
                            <Phone className="mr-2 h-4 w-4 text-gray-400" />
                            {order.customerPhone || 'Not provided'}
                          </p>
                          <p className="flex items-center text-gray-600">
                            <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                            {order.shippingAddress?.street}, {order.shippingAddress?.city}
                          </p>
                        </div>
                      </div>
                      
                      {/* Payment Info */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          <DollarSign className="mr-2 h-5 w-5 text-green-500" />
                          Payment Details
                        </h3>
                        <div className="space-y-2">
                          <p className="text-gray-600">
                            <span className="font-medium">Method:</span> {order.paymentMethod}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Status:</span> 
                            <span className={`ml-2 px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                              {order.paymentStatus}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Amount:</span> ₹{order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          <ShoppingBag className="mr-2 h-5 w-5 text-purple-500" />
                          Items ({order.items.length})
                        </h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-start py-2">
                              <img
                                src={item.imageUrl.url}
                                alt={item.name}
                                className="w-10 h-10 rounded-md object-cover mr-3 border border-gray-200"
                                onError={(e) => { e.target.onerror = null; e.target.src = `${import.meta.env.VITE_API_URL}/uploads/default-product.png`; }}
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
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
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeOrderDetailsModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <XCircle className="h-6 w-6" />
              </button>
              
              <div className="border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Order #<span className="text-blue-600">{selectedOrder.orderNumber}</span>
                </h2>
                <p className="text-gray-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <User className="mr-2 h-5 w-5 text-blue-500" />
                      Customer Information
                    </h3>
                    <div className="space-y-2">
                      <p className="flex items-center text-gray-700">
                        <span className="font-medium w-24">Name:</span>
                        {selectedOrder.customerName}
                      </p>
                      <p className="flex items-center text-gray-700">
                        <span className="font-medium w-24">Email:</span>
                        <a href={`mailto:${selectedOrder.customerEmail}`} className="text-blue-600 hover:underline">
                          {selectedOrder.customerEmail}
                        </a>
                      </p>
                      <p className="flex items-center text-gray-700">
                        <span className="font-medium w-24">Phone:</span>
                        <a href={`tel:${selectedOrder.customerPhone}`} className="text-blue-600 hover:underline">
                          {selectedOrder.customerPhone || 'Not provided'}
                        </a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-green-500" />
                      Shipping Address
                    </h3>
                    <div className="space-y-2 text-gray-700">
                      <p>{selectedOrder.shippingAddress?.street}</p>
                      <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                      <p>{selectedOrder.shippingAddress?.zip}</p>
                      <p>{selectedOrder.shippingAddress?.country}</p>
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <DollarSign className="mr-2 h-5 w-5 text-purple-500" />
                      Payment Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-medium">₹0.00</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="text-gray-800 font-medium">Total:</span>
                        <span className="font-bold text-lg">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                          {selectedOrder.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <ShoppingBag className="mr-2 h-5 w-5 text-orange-500" />
                      Order Items ({selectedOrder.items.length})
                    </h3>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                          <img
                            src={item.images[0]?.url}
                            alt={item.name}
                            className="w-16 h-16 rounded-md object-cover mr-4 border border-gray-200"
                            onError={(e) => { e.target.onerror = null; e.target.src = `${import.meta.env.VITE_API_URL}/uploads/default-product.png`; }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
                            <div className="flex justify-between mt-1">
                              <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                              <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status Update Section */}
              <div className="mt-8 bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Edit className="mr-2 h-5 w-5 text-blue-600" />
                  Update Order Status
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <select
                    value={currentStatus}
                    onChange={handleStatusChange}
                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
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
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {updateStatusLoading ? (
                      <>
                        <RefreshCw className="animate-spin mr-2 h-4 w-4" /> Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" /> Confirm Update
                      </>
                    )}
                  </button>
                </div>
                
                {statusUpdateMessage && (
                  <div className="mt-3 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md">
                    {statusUpdateMessage}
                  </div>
                )}
                
                {updateStatusError && (
                  <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">
                    {updateStatusError}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrdersPage;