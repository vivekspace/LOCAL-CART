import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag, Send, MessageSquare, RefreshCw, XCircle, ChevronDown, User, Calendar, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../Context/Context';

const VendorMessagesPage = () => {
  const { authAxios, jwtToken, isAuthLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);
  const [messageFeedback, setMessageFeedback] = useState('');
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);

  const messageFeedbackTimeoutRef = useRef(null);

  const fetchVendorOrders = useCallback(async () => {
    if (isAuthLoading) {
      setLoadingOrders(true);
      return;
    }
    if (!jwtToken) {
      setOrdersError("Please log in as a vendor to view your orders.");
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    setOrdersError(null);

    try {
      const response = await authAxios.get('/api/orders/vendor/orders');

      // Ensure that each order object has an 'orderNumber' property.
      // Assuming your API response has an '_id' or 'id' field that can serve as an order number.
      // If your API provides a different field for order number, adjust accordingly.
      const fetchedOrders = (response.data.orders || []).map(order => ({
        ...order,
        // Use order._id as orderNumber, or generate a short ID if orderNumber is not directly available
        orderNumber: order.orderId || order._id?.slice(-8).toUpperCase() || 'N/A', // Assuming order.orderId or order._id exists
        customerName: order.customerName || `${order.customerDetails?.firstname || ''} ${order.customerDetails?.lastname || ''}`.trim() || 'Unknown Customer',
        totalAmount: order.totalAmount || order.total || 0, // Ensure totalAmount is available
        createdAt: order.createdAt || order.orderDate || new Date().toISOString(), // Ensure createdAt is available
      }));

      setOrders(fetchedOrders);

      if (!fetchedOrders || fetchedOrders.length === 0) {
        setOrdersError("No orders found for your vendor account.");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrdersError(err.response?.data?.message || "Failed to load orders. Please try again.");
    } finally {
      setLoadingOrders(false);
    }
  }, [authAxios, isAuthLoading, jwtToken]);

  useEffect(() => {
    fetchVendorOrders();
  }, [fetchVendorOrders]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSendingMessage(true);
    setMessageStatus(null);
    setMessageFeedback('');

    if (messageFeedbackTimeoutRef.current) {
      clearTimeout(messageFeedbackTimeoutRef.current);
    }

    if (!selectedOrderId || !messageContent.trim()) {
      setMessageStatus('error');
      setMessageFeedback(!selectedOrderId
        ? 'Please select an order'
        : 'Message cannot be empty');
      setSendingMessage(false);
      messageFeedbackTimeoutRef.current = setTimeout(() => setMessageFeedback(''), 5000);
      return;
    }

    if (!authAxios) {
      setMessageStatus('error');
      setMessageFeedback("Authentication client not available. Please log in.");
      setSendingMessage(false);
      messageFeedbackTimeoutRef.current = setTimeout(() => setMessageFeedback(''), 5000);
      return;
    }

    try {
      const response = await authAxios.post('/api/orders/vendor/message-customer', {
        orderId: selectedOrderId,
        messageContent: messageContent.trim()
      });

      setMessageStatus('success');
      setMessageFeedback("Message sent successfully!");
      setMessageContent('');
    } catch (err) {
      console.error("Error sending message:", err);
      setMessageStatus('error');
      setMessageFeedback(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
      messageFeedbackTimeoutRef.current = setTimeout(() => setMessageFeedback(''), 5000);
    }
  };

  const selectedOrder = orders.find(order => order._id === selectedOrderId);

  const overallLoading = loadingOrders || isAuthLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <MessageSquare className="mr-3 text-indigo-600 w-8 h-8" />
              Customer Messages
            </h1>
            <p className="text-gray-500 mt-2">
              Communicate with customers about their orders
            </p>
          </div>

          <button
            onClick={fetchVendorOrders}
            disabled={overallLoading}
            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-gray-700 font-medium"
          >
            {overallLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 mr-2" />
            )}
            Refresh Orders
          </button>
        </div>

        {/* Error Message */}
        {(ordersError || (!jwtToken && !isAuthLoading)) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg"
          >
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 font-medium">
                {ordersError || "You are not logged in as a vendor. Please log in."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 h-fit"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Select Order
            </h2>

            {overallLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No orders available</p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <button
                    onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)}
                    className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
                  >
                    {selectedOrder ? (
                      <span>Order #{selectedOrder.orderNumber}</span>
                    ) : (
                      <span>Select an order</span>
                    )}
                    <ChevronDown className={`w-5 h-5 transition-transform ${isOrderDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isOrderDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                      >
                        {orders.map(order => {
                          const orderDate = order.createdAt ? new Date(order.createdAt) : null;
                          const displayDate = orderDate?.toLocaleDateString() || 'N/A';

                          return (
                            <button
                              key={order._id}
                              onClick={() => {
                                setSelectedOrderId(order._id);
                                setIsOrderDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selectedOrderId === order._id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium">#{order.orderNumber}</span>
                                <span className="text-xs text-gray-500">{displayDate}</span>
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {order.customerName || 'Unknown customer'}
                              </div>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {selectedOrder && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center mb-3">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="font-medium">{selectedOrder.customerName || 'Customer'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span>
                        Ordered on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700">Order Total:</p>
                      <p className="text-lg font-bold text-indigo-600">
                        ₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>

          {/* Message Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Compose Message
            </h2>

            <form onSubmit={handleSendMessage} className="space-y-6">
              <div>
                <label htmlFor="messageContent" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  id="messageContent"
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Write your message to the customer..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  disabled={!selectedOrderId || sendingMessage || overallLoading || !jwtToken}
                ></textarea>
              </div>

              <AnimatePresence>
                {messageFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-4 rounded-lg ${messageStatus === 'success' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'}`}
                  >
                    <div className="flex items-center">
                      {messageStatus === 'success' ? (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 mr-2" />
                      )}
                      <p>{messageFeedback}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedOrderId || !messageContent.trim() || sendingMessage || overallLoading || !jwtToken}
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VendorMessagesPage;