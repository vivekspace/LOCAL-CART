import { useState, useEffect, useRef } from "react";
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
import { useReactToPrint } from "react-to-print";

const OrderPage = () => {
  // State declarations
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const printRef = useRef();

  // Utility functions
  const safeToFixed = (value, decimals = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0.00" : num.toFixed(decimals);
  };

  const safeParseFloat = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Fetch orders with vendor filtering
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

      if (!response.ok)
        throw new Error(`Failed to fetch orders: ${response.status}`);

      const data = await response.json();

      const ordersArray = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
        ? data.orders
        : Array.isArray(data.data)
        ? data.data
        : [];

      const transformedOrders = ordersArray.map((order) => ({
        _id: order._id || order.id,

        orderId: (order._id || order.id || "")

          .toString()

          .slice(-8)

          .toUpperCase(),

        customer:
          order.customerName ||
          `${order.customerDetails?.firstname || ""} ${
            order.customerDetails?.lastname || ""
          }`.trim() ||
          "Unknown Customer",

        customerEmail: order.customerEmail || order.customerDetails?.email,

        orderDate: new Date(order.createdAt || order.orderDate || Date.now()),

        items: (order.items || order.cartItems || []).map((item) => ({
          ...item,

          price: safeParseFloat(item.price),

          quantity: safeParseFloat(item.quantity) || 1,
        })),

        subtotal: safeParseFloat(order.subtotal),

        shippingCharge: safeParseFloat(
          order.shippingCost || order.shippingCharge
        ),

        totalAmount: safeParseFloat(order.totalAmount || order.total),

        paymentMethod:
          order.paymentMethod || order.paymentDetails?.method || "N/A",

        paymentStatus:
          order.paymentStatus || order.paymentDetails?.status || "pending",

        status: order.status || "pending",

        shippingAddress: order.shippingAddress || {},
      }));

      setOrders(transformedOrders);
    } catch (err) {
      console.error("Order fetch error:", err);

      setUpdateError(err.message || "Failed to load orders.");

      setOrders([]);
    } finally {
      setLoading(false);

      if (showRefresh) setRefreshing(false);
    }
  };

  // Handle status update
  const handleUpdateStatusClick = (order) => {
    setCurrentOrderToUpdate(order);
    setNewOrderStatus(order.status || order.paymentStatus);
    setUpdateError(null);
    setUpdateSuccess(false);
    setShowUpdateModal(true);
  };

  const handleUpdateOrderStatus = async () => {
    if (!currentOrderToUpdate || !newOrderStatus) return;

    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const vendorToken = localStorage.getItem("vendorToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/vendor/orders/${
          currentOrderToUpdate._id
        }/status`,
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

      // Update local state immediately
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === currentOrderToUpdate._id
            ? {
                ...order,
                status: newOrderStatus,
                paymentStatus:
                  newOrderStatus === "completed" || newOrderStatus === "failed"
                    ? newOrderStatus
                    : order.paymentStatus,
              }
            : order
        )
      );

      setUpdateSuccess(true);
      setTimeout(() => {
        setShowUpdateModal(false);
      }, 1500);
    } catch (err) {
      console.error("Error updating order status:", err);
      setUpdateError(err.message || "An unexpected error occurred");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Print and download functions
  const handlePrintOrder = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Order Invoice",
    pageStyle: `
      @page { size: auto; margin: 5mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `,
  });

  const handleDownloadOrder = (order) => {
  // Import jsPDF dynamically
  import('jspdf').then(({ default: jsPDF }) => {
    const doc = new jsPDF();
    
    // LocalCart theme colors
    const primaryColor = [34, 197, 94]; // Green
    const secondaryColor = [60, 60, 60]; // Dark gray
    
    // Define margins and starting y position
    const margin = 15;
    let yPos = margin;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;

    // Set default font
    doc.setFont("helvetica");

    // Function to add a line break with optional spacing
    const addLineBreak = (spacing = 5) => {
      yPos += spacing;
      // Check if we need a new page
      if (yPos > doc.internal.pageSize.getHeight() - margin - 20) {
        doc.addPage();
        yPos = margin;
      }
    };

    // Function to add styled text
    const addStyledText = (text, x, y, size, style = 'normal', color = secondaryColor) => {
      doc.setFontSize(size);
      doc.setFont(undefined, style);
      doc.setTextColor(...color);
      doc.text(text, x, y);
    };

    // Function to add a horizontal line
    const addHorizontalLine = (y, color = [200, 200, 200]) => {
      doc.setDrawColor(...color);
      doc.line(margin, y, pageWidth - margin, y);
    };

    // Header with LocalCart branding
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // LocalCart logo/text
    addStyledText("LocalCart", margin, 20, 20, 'bold', [255, 255, 255]);
    
    // Invoice title
    yPos = 40;
    addStyledText("INVOICE", margin, yPos, 18, 'bold', primaryColor);
    addLineBreak(15);

    // Order details section
    addStyledText("Order Details", margin, yPos, 14, 'bold', secondaryColor);
    addLineBreak(8);
    
    // Two column layout for order details
    const col1 = margin;
    const col2 = margin + 80;
    
    addStyledText("Order ID:", col1, yPos, 12);
    addStyledText(`#${order.orderId}`, col1 + 20, yPos, 12, 'bold');
    addStyledText("Date:", col2, yPos, 12);
    addStyledText(order.orderDate.toLocaleDateString(), col2 + 15, yPos, 12);
    addLineBreak();
    
    addStyledText("Customer:", col1, yPos, 12);
    addStyledText(order.customer, col1 + 20, yPos, 12);
    addStyledText("Status:", col2, yPos, 12);
    addStyledText(order.status, col2 + 15, yPos, 12, order.status === 'Delivered' ? 'bold' : 'normal', 
                 order.status === 'Delivered' ? [0, 150, 0] : secondaryColor);
    addLineBreak(15);

    // Items table header
    addStyledText("Order Items", margin, yPos, 14, 'bold', secondaryColor);
    addLineBreak(8);
    
    // Table headers with background
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPos - 5, contentWidth, 10, 'F');
    
    addStyledText("Product", margin + 5, yPos, 12, 'bold', [255, 255, 255]);
    addStyledText("Qty", 120, yPos, 12, 'bold', [255, 255, 255]);
    addStyledText("Unit Price", 140, yPos, 12, 'bold', [255, 255, 255]);
    addStyledText("Total", 170, yPos, 12, 'bold', [255, 255, 255]);
    addLineBreak(10);

    // Table content
    order.items.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPos - 4, contentWidth, 10, 'F');
      }
      
      addStyledText(item.name.substring(0, 40), margin + 5, yPos, 10);
      addStyledText(item.quantity.toString(), 120, yPos, 10);
      addStyledText(`₹${item.price.toFixed(2)}`, 140, yPos, 10, 'normal', secondaryColor);
      addStyledText(`₹${(item.price * item.quantity).toFixed(2)}`, 170, yPos, 10, 'bold', secondaryColor);
      addLineBreak(8);
    });
    
    addHorizontalLine(yPos - 2);
    addLineBreak(10);

    // Totals section
    const totalsX = 130;
    
    addStyledText("Subtotal:", totalsX, yPos, 12);
    addStyledText(`₹${order.subtotal.toFixed(2)}`, 170, yPos, 12, 'bold');
    addLineBreak(8);
    
    addStyledText("Shipping:", totalsX, yPos, 12);
    addStyledText(`₹${order.shippingCharge.toFixed(2)}`, 170, yPos, 12);
    addLineBreak(8);
    
    if (order.discount > 0) {
      addStyledText("Discount:", totalsX, yPos, 12);
      addStyledText(`-₹${order.discount.toFixed(2)}`, 170, yPos, 12, 'bold', [0, 150, 0]);
      addLineBreak(8);
    }
    
    if (order.tax > 0) {
      addStyledText("Tax:", totalsX, yPos, 12);
      addStyledText(`₹${order.tax.toFixed(2)}`, 170, yPos, 12);
      addLineBreak(8);
    }
    
    addHorizontalLine(yPos);
    addLineBreak(8);
    
    addStyledText("Grand Total:", totalsX, yPos, 14, 'bold', primaryColor);
    addStyledText(`₹${order.totalAmount.toFixed(2)}`, 170, yPos, 14, 'bold', primaryColor);
    addLineBreak(15);

    // Footer
    addHorizontalLine(yPos);
    addLineBreak(5);
    
    addStyledText("Thank you for shopping with LocalCart!", margin, yPos, 10, 'italic', secondaryColor);
    addLineBreak();
    
    addStyledText("For any inquiries, please contact support@localcart.com", margin, yPos, 10, 'normal', secondaryColor);
    addLineBreak();
    
    addStyledText("© " + new Date().getFullYear() + " LocalCart. All rights reserved.", 
                 margin, doc.internal.pageSize.height - margin, 8, 'normal', secondaryColor);

    // Save PDF
    doc.save(`LocalCart_Invoice_${order.orderId}.pdf`);
  });
};

  // View order details
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  // Status badge component
  const getStatusBadge = (order) => {
    const status = order.status || order.paymentStatus || "pending";
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

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const searchText = searchTerm.toLowerCase();
    return (
      order.orderId.toLowerCase().includes(searchText) ||
      (order.customer.toLowerCase().includes(searchText) &&
        (statusFilter === "all" ||
          order.status?.toLowerCase() === statusFilter.toLowerCase() ||
          order.paymentStatus?.toLowerCase() === statusFilter.toLowerCase()))
    );
  });

  // Calculate stats
  const getTotalStats = () => {
    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      shipped: 0,
      cancelled: 0,
      count: filteredOrders.length,
    };

    filteredOrders.forEach((order) => {
      stats.total += safeParseFloat(order.totalAmount);
      if (order.status && stats.hasOwnProperty(order.status.toLowerCase())) {
        stats[order.status.toLowerCase()]++;
      }
    });

    return stats;
  };

  const stats = getTotalStats();

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

   if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading your orders...</p>
          <p className="text-sm text-gray-500">
            LocalCart is crunching the orders
          </p>
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
                  ₹{safeToFixed(stats.total)}
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
                placeholder="Search orders, customers, or emails..."
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
                {updateError ? "Error Loading Orders" : "No Orders Found"}
              </h3>
              <p className="text-gray-600 mb-4">
                {updateError
                  ? updateError
                  : "No orders match your current search criteria."}
              </p>
              {updateError && (
                <button
                  onClick={() => fetchOrders()}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-600 text-white rounded-xl hover:from-green-700 hover:to-green-700 transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-green-50 to-green-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-green-600 to-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                        #{order.orderId}
                      </div>
                      {getStatusBadge(order)}
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <FiUser className="w-4 h-4" />
                        <span className="font-medium">{order.customer}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiCalendar className="w-4 h-4" />
                        <span>{order.orderDate.toLocaleDateString()}</span>
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
                            ₹{safeToFixed(order.subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="font-medium">
                            ₹{safeToFixed(order.shippingCharge)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                          <span className="font-semibold text-gray-800">
                            Total:
                          </span>
                          <span className="font-bold text-green-600">
                            ₹{safeToFixed(order.totalAmount)}
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
                            {order.orderDate.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Items:</span>
                          <span className="font-medium">
                            {order.items.length}
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
                                ₹{safeToFixed(item.price)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-green-600">
                                ₹{safeToFixed(item.quantity * item.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex flex-wrap gap-3 justify-end">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                    >
                      <FiEye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={handlePrintOrder}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                    >
                      <FiPrinter className="w-4 h-4 mr-2" />
                      Print Invoice
                    </button>
                    <button
                      onClick={() => handleDownloadOrder(order)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      Download
                    </button>
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-8" ref={printRef}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order Details
                  </h2>
                  <p className="text-gray-600">#{selectedOrder.orderId}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 no-print"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedOrder.customer}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedOrder.customerEmail || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Order Date:</span>{" "}
                      {selectedOrder.orderDate.toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {selectedOrder.status}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Shipping Address
                  </h3>
                  <div className="space-y-2">
                    <p>{selectedOrder.shippingAddress.street || "N/A"}</p>
                    <p>
                      {selectedOrder.shippingAddress.city},{" "}
                      {selectedOrder.shippingAddress.state}
                    </p>
                    <p>
                      {selectedOrder.shippingAddress.zip},{" "}
                      {selectedOrder.shippingAddress.country}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            ₹{safeToFixed(item.price)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            ₹{safeToFixed(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Payment Information
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Method:</span>{" "}
                      {selectedOrder.paymentMethod}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {selectedOrder.paymentStatus}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{safeToFixed(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>₹{safeToFixed(selectedOrder.shippingCharge)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                      <span className="font-semibold">Total:</span>
                      <span className="font-semibold">
                        ₹{safeToFixed(selectedOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 no-print">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Close
              </button>
              <button
                onClick={handlePrintOrder}
                className="px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Order Status Modal */}
      {showUpdateModal && currentOrderToUpdate && (
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

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Order ID:{" "}
                <span className="font-semibold">
                  #{currentOrderToUpdate.orderId}
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

            {updateError && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4"
                role="alert"
              >
                <span className="block sm:inline">{updateError}</span>
              </div>
            )}

            {updateSuccess && (
              <div
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative mb-4"
                role="alert"
              >
                <span className="block sm:inline">
                  Order status updated successfully!
                </span>
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
