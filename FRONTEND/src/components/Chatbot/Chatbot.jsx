import React, { useState, useEffect, useRef, memo } from "react";
import {
  ShoppingCart,
  Send,
  Package,
  Sparkles,
  Heart,
  Star,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Calendar,
  Truck,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub Flavored Markdown (tables, task lists)
import rehypeHighlight from "rehype-highlight"; // For code syntax highlighting
import "highlight.js/styles/github.css"; // Basic highlight.js theme

// Custom components for ReactMarkdown
const MarkdownComponents = {
  a: (props) => (
    <a
      {...props}
      className="text-emerald-600 hover:text-emerald-700 underline font-medium"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  ul: (props) => (
    <ul {...props} className="list-disc pl-5 space-y-1 my-2" />
  ),
  ol: (props) => (
    <ol {...props} className="list-decimal pl-5 space-y-1 my-2" />
  ),
  li: (props) => <li {...props} className="pl-2" />,
  table: (props) => (
    <div className="overflow-auto">
      <table {...props} className="min-w-full border border-gray-200 my-2" />
    </div>
  ),
  th: (props) => (
    <th
      {...props}
      className="px-4 py-2 bg-gray-100 border border-gray-200 font-semibold"
    />
  ),
  td: (props) => (
    <td {...props} className="px-4 py-2 border border-gray-200" />
  ),
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">
          {children}
        </code>
      );
    }
    return (
      <pre
        className={`bg-gray-100 p-3 rounded overflow-x-auto text-sm my-2 ${className}`}
      >
        <code {...props}>{children}</code>
      </pre>
    );
  },
  blockquote: (props) => (
    <blockquote
      {...props}
      className="border-l-4 border-emerald-400 pl-4 italic text-gray-600 my-2"
    />
  ),
};

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex space-x-1.5">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-emerald-400 rounded-full"
        style={{ animation: `bounce 1.5s infinite ${i * 0.2}s` }}
      />
    ))}
  </div>
);

// Enhanced Order Status Component
const OrderStatusCard = ({ order }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!order || Object.keys(order).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 my-3 shadow-sm text-gray-700">
        <p className="font-semibold text-gray-800 mb-2">Order Details Not Found</p>
        <p className="text-sm">We couldn't retrieve the details for this order. Please ensure the Order ID is correct.</p>
      </div>
    );
  }

  // Safely access shipping address, handling both string and object formats
  const displayAddress = typeof order.shippingAddress === 'string'
    ? order.shippingAddress
    : (order.shippingAddress
      ? `${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.pincode || ''}`
      : 'N/A');

  const orderIdToDisplay = order.orderId || order._id || 'N/A';
  const totalAmountToDisplay = order.totalAmount ? `₹${order.totalAmount.toFixed(2)}` : 'N/A';
  const estimatedDeliveryDate = order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'N/A';


  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 my-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Order Details
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
          {order.status || 'Unknown'}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Order ID:</span>
          <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">{orderIdToDisplay}</code>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-medium">{totalAmountToDisplay}</span>
        </div>

        {displayAddress !== 'N/A' && (
          <div className="flex items-start gap-2 pt-2 border-t">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="text-gray-600 text-xs">{displayAddress}</div>
          </div>
        )}

        {order.estimatedDelivery && (
          <div className="flex items-center gap-2 pt-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600 text-xs">
              Est. Delivery: {estimatedDeliveryDate}
            </span>
          </div>
        )}

        {order.trackingNumber && (
          <div className="flex items-center gap-2 pt-1">
            <Truck className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600 text-xs">
              Tracking: <code className="bg-gray-100 px-1 rounded">{order.trackingNumber}</code>
            </span>
          </div>
        )}
        {order.cartItems && order.cartItems.length > 0 && (
          <div className="pt-2 border-t mt-2">
            <p className="font-medium text-gray-700 mb-1">Items:</p>
            <ul className="list-disc list-inside text-xs text-gray-600">
              {order.cartItems.map((item, index) => (
                <li key={index}>
                  {item.productName || item.name} ({item.quantity}) - ₹{item.price}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};


// Chat message bubble with markdown support
const ChatBubble = ({ message, isUser }) => {
  // imageFilenameRegex is not used, so can be removed or used in ReactMarkdown's img component override

  return (
    <div
      className={`max-w-[90%] sm:max-w-md p-4 rounded-2xl shadow-md transition-all duration-300 ${
        isUser
          ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-br-sm hover:shadow-lg"
          : "bg-white text-gray-800 rounded-bl-sm border border-gray-200/50 hover:shadow-lg"
      }`}
    >
      <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-emerald">
        {message.sender === "bot" ? (
          <>
            <ReactMarkdown
              components={MarkdownComponents}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {message.text}
            </ReactMarkdown>
            {message.orderData && (
              <OrderStatusCard order={message.orderData} />
            )}
          </>
        ) : (
          message.text
        )}
      </div>
      {message.sender === "bot" && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/30">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
            <span className="text-xs text-gray-500 font-medium">
              Local Cart AI
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}
    </div>
  );
};

// ChatbotContent component
const ChatbotContent = memo(
  ({
    messages,
    isLoading,
    isProductsLoaded,
    userInput,
    setUserInput,
    sendMessage,
    handleKeyPress,
    isInToggle,
    isMobile,
  }) => {
    const chatMessagesRef = useRef(null);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    useEffect(() => {
      const smoothScroll = () => {
        if (chatMessagesRef.current) {
          const { scrollHeight, clientHeight, scrollTop } =
            chatMessagesRef.current;
          const distance = scrollHeight - clientHeight - scrollTop;

          // Only scroll if we are near the bottom or at the very top (initial load)
          if (distance < 300 || scrollTop === 0) {
            chatMessagesRef.current.scrollTo({
              top: scrollHeight,
              behavior: "smooth",
            });
          }
        }
      };
      smoothScroll();
    }, [messages]);

    return (
      <div className="flex h-full flex-col overflow-hidden">
        {(!isInToggle && !isMobile) && (
          <div
            className={`relative bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 p-4 sm:p-5 transition-all duration-300 ${
              isHeaderVisible ? "" : "pb-2"
            }`}
            onClick={() => setIsHeaderVisible(!isHeaderVisible)}
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-center space-x-3 cursor-pointer">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-300 rounded-full animate-pulse"></div>
              </div>
              <div className="text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  Local Cart Assistant
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200 animate-pulse" />
                </h1>
                {isHeaderVisible && (
                  <p className="text-green-100 text-xs sm:text-sm font-medium flex items-center gap-1 transition-opacity duration-200">
                    <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-200" />
                    Your neighborhood shopping companion
                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-200" />
                  </p>
                )}
              </div>
              <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white opacity-80" />
            </div>

            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isProductsLoaded ? "bg-emerald-300" : "bg-green-300"
                } animate-pulse`}
              ></div>
              <span className="text-xs text-white/80">
                {isProductsLoaded ? "Online" : "Loading..."}
              </span>
            </div>

            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-white/70">
              {isHeaderVisible ? (
                <ChevronUp className="w-4 h-4 animate-bounce" />
              ) : (
                <ChevronDown className="w-4 h-4 animate-bounce" />
              )}
            </div>
          </div>
        )}

        <div
          ref={chatMessagesRef}
          className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-green-50/50 to-emerald-50/30"
        >
          {!isProductsLoaded && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 p-4 rounded-2xl rounded-bl-md shadow-md border border-green-200/50 flex items-center space-x-3 max-w-xs">
                <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">
                  Loading fresh products...
                </span>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              } animate-fade-in`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <ChatBubble message={msg} isUser={msg.sender === "user"} />
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white text-gray-800 p-3 rounded-2xl rounded-bl-sm shadow-md border border-gray-200/50 flex items-center space-x-3 max-w-xs">
                <TypingIndicator />
                <span className="text-sm text-gray-600">
                  Thinking...
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 bg-white/95 backdrop-blur-sm border-t border-gray-200/30">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Ask about products, orders, returns, or anything else!"
                className="w-full p-3 pl-4 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white/90 text-gray-800 placeholder-gray-400 text-sm transition-all duration-300 hover:border-gray-300"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || !isProductsLoaded}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <ShoppingCart className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <button
              className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white p-3 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
              onClick={sendMessage}
              disabled={isLoading || !isProductsLoaded || !userInput.trim()}
            >
              <Send className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {[
              "Track my order",
              "Return policy",
              "How to order",
              "Daily deals",
              "Contact support",
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setUserInput(suggestion)}
                className="px-3 py-1.5 text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all duration-300 border border-green-200/50 shadow-sm hover:shadow"
                disabled={isLoading || !isProductsLoaded}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

// Main ChatBot component with enhanced database integration
const ChatBot = ({ isInToggle = false, isMobile = false }) => {
  // Initialize messages from localStorage or a default welcome message
  const [messages, setMessages] = useState(() => {
    try {
      const storedMessages = localStorage.getItem('chatMessages');
      return storedMessages ? JSON.parse(storedMessages) : [];
    } catch (error) {
      console.error("Failed to parse stored messages from localStorage:", error);
      return []; // Return empty array on error
    }
  });

  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);

  // Effect to save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save messages to local storage:", error);
    }
  }, [messages]); // Dependency array: runs whenever 'messages' state changes

  // Enhanced API configuration
  const API_CONFIG = {
    baseUrl: import.meta.env.VITE_API_URL, 
    endpoints: {
      products: "/api/chatbot/products",
      orders: "/api/orders/track",
    },
  };

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // Enhanced knowledge base with more comprehensive information
  const KNOWLEDGE_BASE = {
    howToOrder: `**How to Place an Order on Local Cart:**

1.  **Browse Products:** Use the search bar or categories to find items you need.
2.  **Add to Cart:** Click the "Add to Cart" button on the product page for desired items.
3.  **Review Cart:** Go to your shopping cart icon to review selected items, quantities, and estimated total.
4.  **Proceed to Checkout:** Click "Proceed to Checkout" to finalize your purchase.
5.  **Login/Register:** Log in if you're an existing customer, or easily register a new account if you're new.
6.  **Enter Delivery Details:** Provide or confirm your delivery address and choose a convenient delivery slot.
7.  **Choose Payment Method:** Select from our secure payment options: Credit/Debit Card, UPI (Google Pay, PhonePe, Paytm), or Cash on Delivery (COD).
8.  **Confirm Order:** Carefully review your entire order summary and click "Place Order" to complete.

You'll receive an instant order confirmation via email and SMS with your unique Order ID!
    `,

    returnPolicy: `**Local Cart Return Policy:**

**Eligibility:**
* Perishable items (fruits, vegetables, dairy, baked goods) must be returned within **24 hours** of delivery.
* Non-perishable items can be returned within **7 days** of delivery.
* Items must be unused, unopened, in original packaging with all tags/labels intact.
* Valid proof of purchase (Order ID or digital receipt) is mandatory.

**Non-Returnable Items:**
* Items explicitly marked as non-returnable on the product page.
* Opened or partially consumed perishable goods.
* Personal care/hygiene products with broken seals.
* Gift cards, vouchers, or digital products.

**Return Process:**
1.  **Initiate Return:** Contact our customer support team within the specified return window. You can do this by typing "I want to return an item" here in the chat, or call our helpline.
2.  **Provide Details:** Be ready with your **Order ID**, the specific item(s) you wish to return, and a brief reason for the return.
3.  **Pickup/Drop-off:** Depending on your location and the item type, a pickup will be scheduled by our delivery partner at your convenience, or you may be guided to drop the item off at the nearest Local Cart collection hub.

**Refunds:**
* Once the returned item is received by us and successfully passes our quality inspection (typically within 2-3 business days), your refund will be processed.
* Refunds are issued to the original payment method used for the purchase. For Cash on Delivery orders, a bank transfer will be initiated after collecting your bank details securely.
* Please allow **3-5 business days** for the refund to reflect in your bank account or credit card statement.
* Original delivery charges are generally non-refundable unless the return is a direct result of our error.
* For any inquiries regarding your refund status or delays, please reach out to our support team.
    `,

    faqs: `**Frequently Asked Questions:**

* **Store Hours:** Our online store is accessible 24/7. Delivery slots are available from **8:00 AM to 9:00 PM IST** daily.
* **Payment Methods:** We accept a variety of secure and convenient payment options:
    * Major Credit/Debit Cards (Visa, Mastercard, RuPay)
    * UPI (Unified Payments Interface) payments via popular apps like Google Pay, PhonePe, Paytm, etc.
    * Cash on Delivery (COD) - available for eligible pincodes and order values.
* **Delivery Locations:** We currently offer fast and reliable delivery services across **Navi Mumbai** and specific, expanding areas within **Thane**, Maharashtra, India. To verify delivery to your exact location, please enter your pincode on any product page or during checkout.
* **Minimum Order Value:** There is **no minimum order value** required to place an order.
* **Delivery Fees:** Standard delivery charges apply based on your location and order size. However, orders with a total value above **₹500** are eligible for **free standard delivery**!
* **Customer Support:** For immediate assistance, general inquiries, or to report any issues or complaints, you can easily reach our dedicated customer support team:
    * **Phone:** +91-98765-43210 (Available 9 AM - 7 PM daily)
    * **Email:** support@localcart.in (We aim to respond to all emails within 24 hours)
    * **Live Chat:** (You are currently in our live chat! Just ask your question.)
* **About Local Cart:** Local Cart is more than just an online store; we are your trusted local partner dedicated to bringing you the freshest, high-quality produce and essential goods directly from local vendors in your neighborhood. Our mission is to support local businesses while providing unparalleled convenience and quality to our customers.
* **Privacy Policy:** Your data security and privacy are of utmost importance to us. Please refer to our detailed Privacy Policy, accessible via a link at the bottom of our website, for comprehensive information on how we collect, use, and protect your personal data.
* **Terms and Conditions:** By utilizing our services, you agree to abide by our Terms and Conditions. These are also linked conveniently in the footer section of our website.
    `,
  };

  // Helper for making API calls
  const fetchFromAPI = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        let errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  };

  // Fetch products from backend
  const fetchProductsData = async () => {
    try {
      const result = await fetchFromAPI(API_CONFIG.endpoints.products);
      const fetchedProducts = Array.isArray(result.data?.products)
        ? result.data.products
        : [];
      const enhancedProducts = fetchedProducts.map((p) => ({
        ...p,
        images: p.images?.length
          ? p.images
          : [`${p.name.toLowerCase().replace(/\s/g, "_")}_1.webp`],
        category: p.category || "Uncategorized",
        tags: p.tags || [],
        availability: p.availability || 'in-stock', // Default availability
      }));
      setProducts(enhancedProducts);
      return enhancedProducts;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const result = await fetchFromAPI(`${API_CONFIG.endpoints.orders}/${orderId}`);
      return result.data || result; // Assuming backend returns { success: true, data: orderObject }
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      return null;
    }
  };

  // Actual Gemini API call function
  const callGeminiAPI = async (payload) => {
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not defined. Please set it in your .env file.");
      throw new Error("API key not configured.");
    }
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Gemini API error:", response.status, errorBody);
      throw new Error(`Gemini API error: ${errorBody.error?.message || response.statusText}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };

  // Enhanced AI processing with better context understanding
  const processUserQuery = async (message) => {
    const currentDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const currentLocation = "Navi Mumbai, Maharashtra, India";

    // --- SYSTEM INSTRUCTIONS for the Main AI Model ---
    const systemInstructions = `
      You are Local Cart Assistant, a friendly, knowledgeable, and helpful AI chatbot for a local e-commerce store operating in Navi Mumbai, India.
      Your primary goal is to assist customers with a wide range of queries by utilizing the provided information and by fetching real-time data when necessary.

      **Current Context:**
      - Date: ${currentDate}
      - Time: ${currentTime}
      - Location: ${currentLocation}

      **Here's what you can do and how to do it:**

      1.  **Product Information:** Answer questions about products based on the "Available Products" data.
        * Provide details like name, price, description, category, and availability.
        * If a product is not found, politely state that it's not in the current inventory and suggest trying a different search or checking back later.
        * Always format product names as **Product Name**.

      2.  **Order Status & Tracking (REAL-TIME DATA):**
        * If a customer asks about an order (e.g., "Where's my order?", "Track order"), **always ask for their Order ID first** if they haven't provided one.
        * An **Order ID** is a 24-character hexadecimal string (e.g., \`684282d0aff5603f8baa3ede\`).
        * Once an Order ID is provided, you will be given the *actual* order details fetched from the database. Use this *specific* order data to answer comprehensively.
        * Present the order status, items (from \`cartItems\`), payment details, shipping address, subtotal, tax, shipping cost, discount, and total amount clearly.
        * If the order is not found, politely inform the customer based on the "ORDER NOT FOUND" context.
        * Format Order IDs and any tracking numbers using backticks for \`code blocks\`.

      3.  **How to Order:** Refer to the "How to Order Steps" section in the knowledge base. Provide clear, numbered instructions.

      4.  **Return Policy:** Refer to the "Return Policy" section in the knowledge base. Summarize key points and guide them on the process.

      5.  **General Inquiries/FAQs:** Refer to the "General FAQs" for questions about store hours, payment methods, delivery locations, minimum order value, delivery fees, and how to contact human support.

      **General Guidelines for All Responses:**
      * **Tone:** Friendly, helpful, and professional.
      * **Clarity:** Be direct and easy to understand.
      * **Markdown Formatting:** Use Markdown extensively for readability:
        * **Bold** for important information (product names, keywords, actions).
        * *Italics* for emphasis.
        * Lists (- or 1.) for steps, features, or multiple options.
        * Tables for structured data (e.g., comparing products, listing order items).
        * Code blocks (\`text\`) for Order IDs, Tracking Numbers, or specific codes.
      * **Limitations:** If a query is outside your capabilities (e.g., personal advice, complex problem-solving beyond the provided data), politely state that you can only assist with Local Cart related inquiries and suggest contacting human support.
    `;

    let orderData = null;
    let orderDetailsContext = ""; // This will hold the JSON string of order data or an error message

    // --- PHASE 1: Intent Detection & Order ID Extraction (using Gemini) ---
    const intentDetectionPrompt = `
      You are an intent detector for Local Cart Assistant.
      Your task is to extract a MongoDB Order ID (a 24-character hexadecimal string) if present in the user's query,
      or indicate if the user is asking about an order without providing an ID.
      If the query is not about an order, respond with "NOT_ORDER".

      **Expected Order ID format:** A 24-character hexadecimal string (e.g., 684282d0aff5603f8baa3ede). Do NOT include 'ObjectId(' or ')' if they are part of the input. Just the raw 24-char hex string.

      Example outputs:
      - User: "Where is my order 684282d0aff5603f8baa3ede?" -> "ORDER_ID:684282d0aff5603f8baa3ede"
      - User: "Track my order." -> "ORDER_QUERY_NO_ID"
      - User: "What are your store hours?" -> "NOT_ORDER"
      - User: "I want to return 684282d0aff5603f8baa3ede" -> "ORDER_ID:684282d0aff5603f8baa3ede"
      - User: "My order id is ObjectId('684282d0aff5603f8baa3ede')" -> "ORDER_ID:684282d0aff5603f8baa3ede"

      Customer query: ${message}
    `;

    const intentPayload = {
      contents: [{ role: "user", parts: [{ text: intentDetectionPrompt }] }]
    };

    const intentDetectionResponse = await callGeminiAPI(intentPayload);
    const intent = intentDetectionResponse.trim();

    // --- PHASE 2: Conditional API Call for Order Data ---
    let actualOrderId = null;
    if (intent.startsWith("ORDER_ID:")) {
      const potentialOrderId = intent.split(":")[1];
      // Basic validation for MongoDB ObjectId format
      if (/^[0-9a-fA-F]{24}$/.test(potentialOrderId)) {
        actualOrderId = potentialOrderId;
        orderData = await fetchOrderDetails(actualOrderId);

        if (orderData) {
          orderDetailsContext = `\n\n--- REAL-TIME ORDER DATA for Order ID ${actualOrderId} ---\n${JSON.stringify(orderData, null, 2)}\n-----------------------------------\n\n`;
        } else {
          orderDetailsContext = `\n\n--- ORDER NOT FOUND for Order ID ${actualOrderId} ---\n-----------------------------------\n\n`;
        }
      } else {
        orderDetailsContext = `\n\n--- INVALID ORDER ID FORMAT ---\nThe provided ID "${potentialOrderId}" does not look like a valid Local Cart Order ID. Please double-check it.\n-----------------------------------\n\n`;
      }
    }

    // --- PHASE 3: Prepare comprehensive prompt for the main AI response ---
    // Limit products array to prevent exceeding context window (e.g., first 100 products)
    const productsForContext = products.slice(0, 100);

    const knowledgeBaseContent = `
      **Available Products:**
      ${JSON.stringify(productsForContext, null, 2)}

      **How to Order Steps:**
      ${KNOWLEDGE_BASE.howToOrder}

      **Return Policy:**
      ${KNOWLEDGE_BASE.returnPolicy}

      **General FAQs:**
      ${KNOWLEDGE_BASE.faqs}

      ${orderDetailsContext}
    `;

    const finalPrompt = `${systemInstructions}\n\n${knowledgeBaseContent}\n\nCustomer query: ${message}`;

    const finalResponseText = await callGeminiAPI({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }]
    });

    let botResponseText = finalResponseText;

    // Post-processing for specific scenarios (e.g., if order ID was needed but not provided)
    if (intent === "ORDER_QUERY_NO_ID" && !botResponseText.toLowerCase().includes("order id")) {
      botResponseText = `No problem! Could you please provide your **Order ID**? It's a long string of numbers and letters, like \`684282d0aff5603f8baa3ede\`.`;
    }

    return {
      text: botResponseText || "I'm sorry, I couldn't process your request fully. Please try again or provide more details.",
      orderData: actualOrderId && orderData ? orderData : null, // Only pass orderData if successfully fetched
    };
  };

  // Initialize chatbot
  useEffect(() => {
    const initializeChatbot = async () => {
      setIsLoading(true);
      try {
        await fetchProductsData(); // Use the enhanced fetchProductsData
        setIsProductsLoaded(true);

        // Only add initial welcome message if there are no stored messages
        if (messages.length === 0) {
          setMessages([{
            text: "🛍️ **Welcome to Local Cart!** \n\nI'm your personal shopping assistant. I can help you with:\n\n* **Product Information** - Find items, prices, and availability\n* **Order Tracking** - Check your order status with Order ID\n* **Returns & Refunds** - Understand our return policy\n* **Shopping Guide** - Learn how to place orders\n* **General Support** - Any other questions\n\nWhat would you like to explore today?",
            sender: "bot"
          }]);
        }
      } catch (error) {
        console.log('error is ', error);
        setMessages(prev => { // Use functional update to avoid overwriting stored messages if they exist
          if (prev.length === 0 || (prev.length === 1 && prev[0].text.includes("Welcome to Local Cart"))) {
            return [{
              text: "⚠️ I'm having trouble connecting to our systems. Please try again later or contact support at +91-98765-43210.",
              sender: "bot"
            }];
          }
          return prev; // Keep existing messages if they were loaded from storage
        });
      } finally {
        setIsLoading(false);
      }
    };
    initializeChatbot();
  }, []); // Empty dependency array means this runs once on mount

  const sendMessage = async () => {
    const message = userInput.trim();
    if (!message || isLoading || !isProductsLoaded) return;

    // Add user message immediately for responsiveness
    setMessages(prev => [...prev, { text: message, sender: "user" }]);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await processUserQuery(message); // Call the main processing function
      setMessages(prev => [...prev, { ...response, sender: "bot" }]);
    } catch (error) {
      console.error("Error in sendMessage:", error);
      setMessages(prev => [...prev, {
        text: "⚠️ Something went wrong while getting my response. Please try again or contact support.",
        sender: "bot"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const chatbotContentProps = {
    messages,
    isLoading,
    isProductsLoaded,
    userInput,
    setUserInput,
    sendMessage,
    handleKeyPress,
    isInToggle,
    isMobile,
  };

  if (isInToggle) {
    return (
      <div className="h-full flex flex-col bg-white rounded-lg overflow-hidden shadow-sm">
        <ChatbotContent {...chatbotContentProps} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="fixed -top-20 -right-20 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl -z-10"></div>
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white/70 to-transparent -z-10"></div>

      <div className="w-full max-w-2xl relative">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-white/20 h-[600px]">
          <ChatbotContent {...chatbotContentProps} />
        </div>

        <div className="text-center mt-4 text-xs text-gray-400">
          Powered by Local Cart • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;