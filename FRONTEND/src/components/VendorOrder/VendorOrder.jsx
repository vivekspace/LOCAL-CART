import { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  ShoppingBag,
  Clock,
  Check,
  X,
  Package,
  Truck,
  CreditCard,
  User,
  Calendar,
  Eye,
  Printer,
  Download,
  AlertCircle,
  ChevronDown,
  Search, // Import Search icon from lucide-react
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isPrintView, setIsPrintView] = useState(false);
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
        customerEmail: order.email || order.customerDetails?.email,
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
    documentTitle: `Order_${selectedOrder?.orderId}_Invoice`,
    pageStyle: `
      @page { size: auto; margin: 5mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
        .print-view { padding: 0 !important; }
      }
    `,
    onBeforeGetContent: () => setIsPrintView(true),
    onAfterPrint: () => setIsPrintView(false),
  });

  const handleDownloadOrder = (order) => {
    import("jspdf").then(({ default: jsPDF }) => {
      const doc = new jsPDF();

      // Theme colors
      const primaryColor = [16, 185, 129]; // Green-500
      const secondaryColor = [75, 85, 99]; // Gray-600

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
      const addStyledText = (
        text,
        x,
        y,
        size,
        style = "normal",
        color = secondaryColor
      ) => {
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

      // Header with branding
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 30, "F");

      // Logo/text
      addStyledText("LocalCart", margin, 20, 20, "bold", [255, 255, 255]);

      // Invoice title
      yPos = 40;
      addStyledText("INVOICE", margin, yPos, 18, "bold", primaryColor);
      addLineBreak(15);

      // Order details section
      addStyledText("Order Details", margin, yPos, 14, "bold", secondaryColor);
      addLineBreak(8);

      // Two column layout for order details
      const col1 = margin;
      const col2 = margin + 80;

      addStyledText("Order ID:", col1, yPos, 12);
      addStyledText(`#${order.orderId}`, col1 + 20, yPos, 12, "bold");
      addStyledText("Date:", col2, yPos, 12);
      addStyledText(order.orderDate.toLocaleDateString(), col2 + 15, yPos, 12);
      addLineBreak();

      addStyledText("Customer:", col1, yPos, 12);
      addStyledText(order.customer, col1 + 20, yPos, 12);
      addStyledText("Status:", col2, yPos, 12);
      addStyledText(
        order.status,
        col2 + 15,
        yPos,
        12,
        order.status === "Delivered" ? "bold" : "normal",
        order.status === "Delivered" ? [0, 150, 0] : secondaryColor
      );
      addLineBreak(15);

      // Items table header
      addStyledText("Order Items", margin, yPos, 14, "bold", secondaryColor);
      addLineBreak(8);

      // Table headers with background
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPos - 5, contentWidth, 10, "F");

      addStyledText("Product", margin + 5, yPos, 12, "bold", [255, 255, 255]);
      addStyledText("Qty", 120, yPos, 12, "bold", [255, 255, 255]);
      addStyledText("Unit Price", 140, yPos, 12, "bold", [255, 255, 255]);
      addStyledText("Total", 170, yPos, 12, "bold", [255, 255, 255]);
      addLineBreak(10);

      // Table content
      order.items.forEach((item, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, yPos - 4, contentWidth, 10, "F");
        }

        addStyledText(item.name.substring(0, 40), margin + 5, yPos, 10);
        addStyledText(item.quantity.toString(), 120, yPos, 10);
        addStyledText(
          `₹${item.price.toFixed(2)}`,
          140,
          yPos,
          10,
          "normal",
          secondaryColor
        );
        addStyledText(
          `₹${(item.price * item.quantity).toFixed(2)}`,
          170,
          yPos,
          10,
          "bold",
          secondaryColor
        );
        addLineBreak(8);
      });

      addHorizontalLine(yPos - 2);
      addLineBreak(10);

      // Totals section
      const totalsX = 130;

      addStyledText("Subtotal:", totalsX, yPos, 12);
      addStyledText(`₹${order.subtotal.toFixed(2)}`, 170, yPos, 12, "bold");
      addLineBreak(8);

      addStyledText("Shipping:", totalsX, yPos, 12);
      addStyledText(
        `₹${order.shippingCharge.toFixed(2)}`,
        170,
        yPos,
        12
      );
      addLineBreak(8);

      if (order.discount > 0) {
        addStyledText("Discount:", totalsX, yPos, 12);
        addStyledText(
          `-₹${order.discount.toFixed(2)}`,
          170,
          yPos,
          12,
          "bold",
          [0, 150, 0]
        );
        addLineBreak(8);
      }

      if (order.tax > 0) {
        addStyledText("Tax:", totalsX, yPos, 12);
        addStyledText(`₹${order.tax.toFixed(2)}`, 170, yPos, 12);
        addLineBreak(8);
      }

      addHorizontalLine(yPos);
      addLineBreak(8);

      addStyledText("Grand Total:", totalsX, yPos, 14, "bold", primaryColor);
      addStyledText(
        `₹${order.totalAmount.toFixed(2)}`,
        170,
        yPos,
        14,
        "bold",
        primaryColor
      );
      addLineBreak(15);

      // Footer
      addHorizontalLine(yPos);
      addLineBreak(5);

      addStyledText(
        "Thank you for shopping with LocalCart!",
        margin,
        yPos,
        10,
        "italic",
        secondaryColor
      );
      addLineBreak();

      addStyledText(
        "For any inquiries, please contact support@localcart.com",
        margin,
        yPos,
        10,
        "normal",
        secondaryColor
      );
      addLineBreak();

      addStyledText(
        "© " + new Date().getFullYear() + " LocalCart. All rights reserved.",
        margin,
        doc.internal.pageSize.height - margin,
        8,
        "normal",
        secondaryColor
      );

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
        bg: "bg-gradient-to-r from-blue-400 to-cyan-500",
        text: "text-white",
        icon: RefreshCw,
        label: "Processing",
      },
      shipped: {
        bg: "bg-gradient-to-r from-purple-400 to-indigo-500",
        text: "text-white",
        icon: Truck,
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
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchText) ||
      order.customer.toLowerCase().includes(searchText) ||
      (order.customerEmail &&
        order.customerEmail.toLowerCase().includes(searchText));

    const matchesFilter =
      statusFilter === "all" ||
      order.status?.toLowerCase() === statusFilter.toLowerCase() ||
      order.paymentStatus?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesFilter;
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"
          />
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-700 font-medium"
          >
            Loading your orders...
          </motion.p>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-gray-500 mt-1"
          >
            Preparing your order dashboard
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-green-50 via-white to-cyan-50 ${
        isPrintView ? "print-view" : ""
      }`}
    >
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 p-2 rounded-xl"
              >
                <ShoppingBag className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Order Management
                </h1>
                <p className="text-gray-600 text-sm">
                  Manage and track your vendor orders
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Total Orders"
            value={stats.count}
            icon={<Package className="w-6 h-6" />}
            color="from-blue-500 to-cyan-500"
            delay={0.1}
          />
          <StatCard
            title="Total Revenue"
            value={`₹${safeToFixed(stats.total)}`}
            icon={<CreditCard className="w-6 h-6" />}
            color="from-green-500 to-emerald-500"
            delay={0.2}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Clock className="w-6 h-6" />}
            color="from-amber-500 to-orange-500"
            delay={0.3}
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<Check className="w-6 h-6" />}
            color="from-emerald-500 to-teal-500"
            delay={0.4}
          />
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-gray-400 w-5 h-5" />{" "}
                {/* Changed FiSearch to Search */}
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
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100"
            >
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Package className="w-10 h-10 text-gray-400" />
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fetchOrders()}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </motion.button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                          #{order.orderId}
                        </div>
                        {getStatusBadge(order)}
                      </div>
                      <div className="mt-3 sm:mt-0 flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{order.customer}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
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
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                          ₹{safeToFixed(order.totalAmount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total Amount Paid
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">
                            Items
                          </h4>
                          <ShoppingBag className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                          {order.items.length}
                        </p>
                        <p className="text-sm text-gray-600">
                          Products in Order
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">
                            Payment
                          </h4>
                          <CreditCard className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-xl font-bold text-gray-900 capitalize">
                          {order.paymentStatus}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.paymentMethod}
                        </p>
                      </div>
                    </div>

                    {/* Order Details Table (Collapsed by default) */}
                    {selectedOrder && selectedOrder._id === order._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-4"
                      >
                        <h4 className="font-semibold text-lg text-gray-800 mb-4">
                          Order Details for #{order.orderId}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-gray-700 mb-6">
                          <div>
                            <p className="font-medium text-gray-900 mb-2">
                              Customer Information:
                            </p>
                            <p>
                              <strong>Name:</strong> {order.customer}
                            </p>
                            <p>
                              <strong>Email:</strong> {order.customerEmail || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 mb-2">
                              Shipping Address:
                            </p>
                            <p>
                              {order.shippingAddress.street || "N/A"},{" "}
                              {order.shippingAddress.city || "N/A"}
                            </p>
                            <p>
                              {order.shippingAddress.state || "N/A"},{" "}
                              {order.shippingAddress.zip || "N/A"}
                            </p>
                            <p>{order.shippingAddress.country || "N/A"}</p>
                          </div>
                        </div>

                        <h5 className="font-medium text-gray-900 mb-3">
                          Items Ordered:
                        </h5>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Product
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Quantity
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Price
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {order.items.map((item, itemIndex) => (
                                <tr key={itemIndex}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.quantity}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ₹{safeToFixed(item.price)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                    ₹{safeToFixed(item.price * item.quantity)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex justify-end mt-6 text-sm font-semibold">
                          <div className="w-full sm:w-1/2 md:w-1/3 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subtotal:</span>
                              <span>₹{safeToFixed(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Shipping:</span>
                              <span>₹{safeToFixed(order.shippingCharge)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 border-gray-200 text-base">
                              <span className="text-gray-900">
                                Grand Total:
                              </span>
                              <span className="text-green-600">
                                ₹{safeToFixed(order.totalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3 no-print">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePrintOrder()}
                            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm font-medium"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDownloadOrder(order)}
                            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Invoice
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex flex-wrap gap-3 justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(order)}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {selectedOrder && selectedOrder._id === order._id
                          ? "Hide Details"
                          : "View Details"}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleUpdateStatusClick(order)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Update Status
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      <AnimatePresence>
        {showUpdateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md border border-gray-100"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Update Order Status
              </h3>
              {currentOrderToUpdate && (
                <p className="text-gray-600 mb-6 text-center">
                  Order ID:{" "}
                  <span className="font-semibold">
                    #{currentOrderToUpdate.orderId}
                  </span>
                </p>
              )}

              <div className="mb-6">
                <label
                  htmlFor="newOrderStatus"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select New Status
                </label>
                <div className="relative">
                  <select
                    id="newOrderStatus"
                    className="mt-1 block w-full py-3 px-4 border border-gray-300 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm appearance-none"
                    value={newOrderStatus}
                    onChange={(e) => setNewOrderStatus(e.target.value)}
                    disabled={updateLoading || updateSuccess}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {updateError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4"
                  role="alert"
                >
                  <AlertCircle className="inline w-5 h-5 mr-2" />
                  <span className="block sm:inline">{updateError}</span>
                </motion.div>
              )}

              {updateSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative mb-4"
                  role="alert"
                >
                  <Check className="inline w-5 h-5 mr-2" />
                  <span className="block sm:inline">
                    Order status updated successfully!
                  </span>
                </motion.div>
              )}

              <div className="flex justify-end space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUpdateModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
                  disabled={updateLoading}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpdateOrderStatus}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-md hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updateLoading || updateSuccess}
                >
                  {updateLoading ? (
                    <span className="flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    "Update"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* This div is for printing only, hidden from normal view */}
      {selectedOrder && (
        <div className="hidden">
          <div ref={printRef} className="p-8 print-view">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              LocalCart Order Invoice
            </h1>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  Order ID: #{selectedOrder.orderId}
                </p>
                <p className="text-gray-600 text-sm">
                  Date: {selectedOrder.orderDate.toLocaleDateString()}
                </p>
                <p className="text-gray-600 text-sm capitalize">
                  Status: {selectedOrder.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-800">
                  Customer: {selectedOrder.customer}
                </p>
                <p className="text-gray-600 text-sm">
                  Email: {selectedOrder.customerEmail || "N/A"}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Shipping Address
              </h2>
              <p className="text-gray-700">
                {selectedOrder.shippingAddress.street || "N/A"}
              </p>
              <p className="text-gray-700">
                {selectedOrder.shippingAddress.city || "N/A"},{" "}
                {selectedOrder.shippingAddress.state || "N/A"}
              </p>
              <p className="text-gray-700">
                {selectedOrder.shippingAddress.zip || "N/A"},{" "}
                {selectedOrder.shippingAddress.country || "N/A"}
              </p>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Order Items
            </h2>
            <table className="min-w-full divide-y divide-gray-200 mb-8">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Quantity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Unit Price
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedOrder.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{safeToFixed(item.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{safeToFixed(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-full sm:w-1/2 md:w-1/3 space-y-2 text-right">
                <div className="flex justify-between text-base text-gray-700">
                  <span>Subtotal:</span>
                  <span>₹{safeToFixed(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-base text-gray-700">
                  <span>Shipping:</span>
                  <span>₹{safeToFixed(selectedOrder.shippingCharge)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-4">
                  <span>Grand Total:</span>
                  <span className="text-green-600">
                    ₹{safeToFixed(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-center text-gray-500 text-xs mt-12">
              Thank you for your business!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// StatCard Component
const StatCard = ({ title, value, icon, color, delay }) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: delay, type: "spring", stiffness: 100, damping: 10 }}
      className={`bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex items-center space-x-4 transform hover:scale-[1.02] transition-transform duration-300`}
    >
      <div
        className={`p-3 rounded-full bg-gradient-to-br ${color} text-white shadow-lg`}
      >
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </motion.div>
  );
};

export default OrderPage;