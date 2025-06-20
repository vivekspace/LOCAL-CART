import React, { useState, useEffect, useRef, memo } from "react";
import {
  Briefcase, // Icon for Vendor
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CreditCard, // For payments
  Package, // For delivery/orders
  FileText, // For agreements/policies
  Users, // For support
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub Flavored Markdown (tables, task lists)
import rehypeHighlight from "rehype-highlight"; // For code syntax highlighting
import "highlight.js/styles/github.css"; // Basic highlight.js theme

// Custom components for ReactMarkdown (can be shared or tailored)
const MarkdownComponents = {
  a: ({ ...props }) => (
    <a
      {...props}
      className="text-indigo-600 hover:text-indigo-700 underline font-medium"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  ul: ({ ...props }) => (
    <ul {...props} className="list-disc pl-5 space-y-1 my-2" />
  ),
  ol: ({...props }) => (
    <ol {...props} className="list-decimal pl-5 space-y-1 my-2" />
  ),
  li: ({...props }) => <li {...props} className="pl-2" />,
  table: ({...props }) => (
    <div className="overflow-auto">
      <table {...props} className="min-w-full border border-gray-200 my-2" />
    </div>
  ),
  th: ({...props }) => (
    <th
      {...props}
      className="px-4 py-2 bg-gray-100 border border-gray-200 font-semibold"
    />
  ),
  td: ({...props }) => (
    <td {...props} className="px-4 py-2 border border-gray-200" />
  ),
  code: ({inline, className, children, ...props }) => {
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
  blockquote: ({...props }) => (
    <blockquote
      {...props}
      className="border-l-4 border-indigo-400 pl-4 italic text-gray-600 my-2"
    />
  ),
};

// Typing indicator component (shared)
const TypingIndicator = () => (
  <div className="flex space-x-1.5">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-indigo-400 rounded-full"
        style={{ animation: `bounce 1.5s infinite ${i * 0.2}s` }}
      />
    ))}
  </div>
);

// Chat message bubble with markdown support (adapted for vendor theme)
const ChatBubble = ({ message, isUser }) => {
  return (
    <div
      className={`max-w-[90%] sm:max-w-md p-4 rounded-2xl shadow-md transition-all duration-300 ${
        isUser
          ? "bg-gradient-to-r from-indigo-600 to-purple-500 text-white rounded-br-sm hover:shadow-lg"
          : "bg-white text-gray-800 rounded-bl-sm border border-gray-200/50 hover:shadow-lg"
      }`}
    >
      <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-indigo">
        <ReactMarkdown
          components={MarkdownComponents}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {message.text}
        </ReactMarkdown>
        {/* No orderData specific card for vendor bot typically */}
      </div>
      {message.sender === "bot" && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/30">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
            <span className="text-xs text-gray-500 font-medium">
              Local Cart Vendor AI
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

// ChatbotContent component (shared structure, adapted for vendor theme)
const ChatbotContent = memo(
  ({
    messages,
    isLoading,
    isProductsLoaded, // Still useful for general system status
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
            className={`relative bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-700 p-4 sm:p-5 transition-all duration-300 ${
              isHeaderVisible ? "" : "pb-2"
            }`}
            onClick={() => setIsHeaderVisible(!isHeaderVisible)}
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-center space-x-3 cursor-pointer">
              <div className="relative">
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-indigo-300 rounded-full animate-pulse"></div>
              </div>
              <div className="text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  Local Cart Vendor Assistant
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-200 animate-pulse" />
                </h1>
                {isHeaderVisible && (
                  <p className="text-indigo-100 text-xs sm:text-sm font-medium flex items-center gap-1 transition-opacity duration-200">
                    <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-200" />
                    Your dedicated partner for success
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-200" />
                  </p>
                )}
              </div>
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white opacity-80" />
            </div>

            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isProductsLoaded ? "bg-indigo-300" : "bg-purple-300"
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
          className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-purple-50/50 to-indigo-50/30"
        >
          {!isProductsLoaded && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-800 p-4 rounded-2xl rounded-bl-md shadow-md border border-indigo-200/50 flex items-center space-x-3 max-w-xs">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">
                  Initializing vendor portal...
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
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 bg-white/95 backdrop-blur-sm border-t border-gray-200/30">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Ask about onboarding, payments, or support..."
                className="w-full p-3 pl-4 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/90 text-gray-800 placeholder-gray-400 text-sm transition-all duration-300 hover:border-gray-300"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || !isProductsLoaded}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Briefcase className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <button
              className="bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-700 hover:to-purple-600 text-white p-3 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
              onClick={sendMessage}
              disabled={isLoading || !isProductsLoaded || !userInput.trim()}
            >
              <Send className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {[
              "How to onboard?",
              "Payment schedule",
              "Contact vendor support",
              "Manage my products",
              "Sales reports",
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setUserInput(suggestion)}
                className="px-3 py-1.5 text-xs bg-gradient-to-r from-purple-50 to-indigo-50 text-indigo-700 rounded-lg hover:from-purple-100 hover:to-indigo-100 transition-all duration-300 border border-indigo-200/50 shadow-sm hover:shadow"
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

// Main VendorChatBot component
const VendorChatBot = ({ isInToggle = false, isMobile = false }) => {
  // Messages state with localStorage for persistence
  const [messages, setMessages] = useState(() => {
    try {
      // Use a different localStorage key for vendor messages
      const storedMessages = localStorage.getItem('vendorChatMessages');
      return storedMessages ? JSON.parse(storedMessages) : [];
    } catch (error) {
      console.error("Failed to parse stored vendor messages from localStorage:", error);
      return [];
    }
  });

  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // For vendor bot, products data might not be directly relevant,
  // but we can use it to signify backend connection or data readiness.
  // For simplicity, we'll keep `isProductsLoaded` and reuse `fetchProductsData`
  // as a generic "check backend connection" function for now.
  const [products, setProducts] = useState([]); // Placeholder, won't be used for product info queries
  const [isProductsLoaded, setIsProductsLoaded] = useState(false); // Renamed to isBackendLoaded for clarity later?

  // Effect to save vendor messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vendorChatMessages', JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save vendor messages to local storage:", error);
    }
  }, [messages]);

  // API configuration (can be shared or have vendor-specific endpoints)
  const API_CONFIG = {
    baseUrl: import.meta.env.VITE_API_URL,
    endpoints: {
      // Products endpoint might still be used for a general "system check"
      // or if vendors need to query their own listed products.
      // For now, it's just a placeholder for general backend connection.
      products: "/api/chatbot/products",
      // No 'orders' endpoint for vendors unless they track customer orders via bot
      // You'd add vendor-specific endpoints here if needed (e.g., /api/vendor/payments)
    },
  };

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // Vendor-Specific Knowledge Base
  const VENDOR_KNOWLEDGE_BASE_DATA = {
    vendorOnboarding: `**Onboarding as a Local Cart Vendor:**

1.  **Registration:** Visit our 'Become a Vendor' page on the Local Cart website. Fill out the vendor registration form with your business details, contact information, and desired product categories.
2.  **Verification:** Our team will review your application. This may include a quick verification call or a visit to your physical store/farm to ensure quality standards.
3.  **Agreement:** Sign the Vendor Partnership Agreement, outlining terms, conditions, payment cycles, and service level agreements.
4.  **Profile Setup:** Once approved, you'll receive access to your Vendor Dashboard. Set up your detailed vendor profile, including business description, logo, and operating hours.
5.  **Product Listing:** Begin uploading your product catalog, including high-quality images, accurate descriptions, pricing, and stock levels. Our support team can assist with bulk uploads or initial setup.
6.  **Go Live:** After your products are reviewed and approved, your store will go live on the Local Cart platform, accessible to thousands of local customers!
    `,
    vendorPayment: `**Vendor Payment and Settlement:**

* **Payment Cycle:** Payments to vendors are processed on a **weekly basis**. The cut-off for each week is Sunday 11:59 PM IST.
* **Settlement:** Funds for all successful deliveries (orders completed and not returned) within a given week will be transferred to your registered bank account by **Wednesday** of the following week.
* **Statement:** A detailed weekly sales report and payment statement will be accessible in your Vendor Dashboard. This includes order breakdowns, commission deductions, and net payout.
* **Commission:** Local Cart charges a competitive commission percentage on each successful sale. This rate is agreed upon during the onboarding process and is clearly outlined in your Vendor Partnership Agreement.
* **Disputes:** In case of any payment discrepancies, please raise a ticket through your Vendor Dashboard or contact our Vendor Support helpline immediately.
    `,
    vendorSupport: `**Local Cart Vendor Support:**

For any queries, technical issues, or assistance related to your vendor account, product listings, or orders, please reach out to our dedicated Vendor Support team:

* **Vendor Dashboard:** The primary way to get support is by raising a support ticket directly from your Vendor Dashboard. This ensures your query is tracked and assigned to the right specialist.
* **Email:** vendorsupport@localcart.in (Response within 12-24 hours)
* **Phone:** +91-87654-32109 (Available Mon-Sat, 10 AM - 6 PM IST)
* **Emergency Contact:** For urgent delivery issues or critical platform outages, please use the emergency number provided in your onboarding kit.
    `,
    vendorDelivery: `**Vendor Responsibilities for Delivery:**

* **Packaging:** Vendors are responsible for securely packaging all products to prevent damage during transit.
* **Readiness:** Orders must be ready for pickup by Local Cart delivery partners at the scheduled time. Ensure items match the order details.
* **Inventory Accuracy:** Maintain accurate and up-to-date inventory levels on your Vendor Dashboard to prevent out-of-stock cancellations.
* **Quality Control:** Ensure all products handed over for delivery meet the quality standards agreed upon in your Vendor Partnership Agreement.
* **Delivery Partners:** Local Cart utilizes a network of trusted delivery partners. You will be notified when a delivery partner is assigned for pickup.
* **Large Orders:** For unusually large or bulky orders, please notify Local Cart support in advance to arrange appropriate logistics.
    `,
    vendorFAQs: `**Frequently Asked Questions for Vendors:**

* **How do I update my product prices?**
    You can update product prices directly from your Vendor Dashboard under the 'Product Management' section. Changes are typically live within minutes.
* **Can I manage my own deliveries?**
    Local Cart primarily handles deliveries to ensure a consistent customer experience. However, for certain specialized products or large orders, custom arrangements can be discussed with our Vendor Operations team.
* **What if a customer returns an item?**
    When a customer initiates a return, you will be notified via your dashboard. Once the item is physically returned and inspected, the refund process will be initiated. Details will be visible in your sales reports.
* **How do I view my sales reports?**
    Comprehensive sales reports, including daily, weekly, and monthly performance, are available in your Vendor Dashboard under the 'Reports' section.
* **Is there a subscription fee to be a vendor?**
    Local Cart does not charge a monthly subscription fee. We operate on a commission-based model, taking a percentage only on successful sales.
    `,
    // Add more vendor-specific FAQs here
  };

  // Vendor-Specific System Instructions
  const VENDOR_SYSTEM_INSTRUCTIONS = (currentDate, currentTime, currentLocation) => `
    You are Local Cart Vendor Assistant, a helpful and knowledgeable AI chatbot designed to support our valued vendors in Navi Mumbai, India.
    Your primary goal is to assist vendors with their queries, provide information about platform operations, and guide them through their Vendor Dashboard features.

    **Current Context:**
    - Date: ${currentDate}
    - Time: ${currentTime}
    - Location: ${currentLocation}

    **Here's what you can do and how to do it:**

    1.  **Vendor Onboarding:** Answer questions about how to register and start selling on Local Cart. Refer to "Vendor Onboarding" in the knowledge base.
    2.  **Payment & Settlement:** Provide information on payment cycles, commission, and how vendors get paid. Refer to "Vendor Payment" in the knowledge base.
    3.  **Vendor Support:** Guide vendors on how to contact dedicated vendor support channels. Refer to "Vendor Support" in the knowledge base.
    4.  **Delivery Responsibilities:** Clarify vendor responsibilities related to order fulfillment and delivery. Refer to "Vendor Delivery" in the knowledge base.
    5.  **General Vendor FAQs:** Answer common questions asked by vendors. Refer to "Vendor FAQs" in the knowledge base.
    6.  **Product Management:** Guide vendors on how to list, update, and manage their products via the Vendor Dashboard (assume this is a general process, no specific API call for now).
    7.  **Sales Reports:** Explain where vendors can find their sales performance data (assume via Vendor Dashboard).

    **General Guidelines for All Responses:**
    * **Tone:** Professional, supportive, and efficient.
    * **Clarity:** Be direct and easy to understand for business users.
    * **Markdown Formatting:** Use Markdown extensively for readability:
        * **Bold** for important information (sections, keywords).
        * *Italics* for emphasis.
        * Lists (- or 1.) for steps or multiple options.
        * Code blocks (\`text\`) for specific codes or IDs if applicable (less common for vendors).
    * **Limitations:** If a query is outside your capabilities (e.g., specific account changes, deep technical debugging), politely state that you can only provide general information and suggest they raise a ticket on their Vendor Dashboard or contact Vendor Support directly. Do not attempt to access or modify specific vendor data.

    **Special Instruction for "Who trained you?":**
    If asked about your training or who created you, respond by stating that you are an AI assistant developed by Local Cart specifically for vendors, and you are powered by advanced Google AI technology. Do not explicitly state "trained by Google LLM" as your sole answer.

    **Example Response (if asked):** "I am Local Cart Vendor Assistant, an AI designed by Local Cart to help our valued vendors with their business needs, and I'm powered by advanced Google AI technology."
  `;


  // Helper for making API calls (can be shared)
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

  // For vendor bot, this is more a "backend status check"
  const fetchBackendDataStatus = async () => {
    try {
      // You might have a specific vendor status endpoint later, e.g., /api/vendor/status
      // For now, reusing products endpoint as a general backend connectivity test.
      const result = await fetchFromAPI(API_CONFIG.endpoints.products);
      // We don't care about the product data itself, just that the call succeeded
      if (result) {
        setProducts([]); // Clear any accidental product data
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking backend status for vendor bot:", error);
      return false;
    }
  };

  // Actual Gemini API call function (shared)
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

  // Process User Query for Vendor Bot
  const processUserQuery = async (message, currentMessages) => {
    const currentDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const currentLocation = "Navi Mumbai, Maharashtra, India";

    // Dynamic system instructions based on current context
    const systemInstructionsForThisTurn = VENDOR_SYSTEM_INSTRUCTIONS(currentDate, currentTime, currentLocation);

    const knowledgeBaseContent = `
      **Vendor Onboarding Steps:**
      ${VENDOR_KNOWLEDGE_BASE_DATA.vendorOnboarding}

      **Vendor Payment & Settlement Details:**
      ${VENDOR_KNOWLEDGE_BASE_DATA.vendorPayment}

      **Vendor Support Contacts:**
      ${VENDOR_KNOWLEDGE_BASE_DATA.vendorSupport}

      **Vendor Delivery Responsibilities:**
      ${VENDOR_KNOWLEDGE_BASE_DATA.vendorDelivery}

      **General Vendor FAQs:**
      ${VENDOR_KNOWLEDGE_BASE_DATA.vendorFAQs}
    `;

    // Construct the full conversation history for Gemini
    const contentsForGemini = [];

    // Add system instructions and knowledge base as a "hidden" initial user turn
    contentsForGemini.push({
        role: "user",
        parts: [{ text: `${systemInstructionsForThisTurn}\n\n${knowledgeBaseContent}` }]
    });
    contentsForGemini.push({
        role: "model",
        parts: [{ text: "Acknowledged. How can I assist you, Local Cart Vendor?" }]
    });

    // Append the actual conversation history
    currentMessages
        .filter(msg => msg.sender === 'user' || msg.sender === 'bot')
        .forEach(msg => {
            contentsForGemini.push({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        });

    // Finally, add the current user's message
    contentsForGemini.push({ role: 'user', parts: [{ text: message }] });

    const finalResponseText = await callGeminiAPI({
      contents: contentsForGemini, // Pass the full conversation history
    });

    return {
      text: finalResponseText || "I'm sorry, I couldn't process your request fully. Please try again or provide more details.",
      orderData: null, // No order data for vendor bot
    };
  };

  // Initialize chatbot
  useEffect(() => {
    const initializeChatbot = async () => {
      setIsLoading(true);
      try {
        // Use fetchBackendDataStatus for the vendor bot
        const backendReady = await fetchBackendDataStatus();
        setIsProductsLoaded(backendReady); // Renaming state variable 'isProductsLoaded' might be good idea to 'isBackendReady'

        if (messages.length === 0) {
          setMessages([{
            text: "👋 **Welcome to Local Cart Vendor Assistant!** \n\nI'm here to help you with:\n\n* **Onboarding** - How to join us\n* **Payments** - Settlement details\n* **Support** - How to get help\n* **Deliveries** - Your responsibilities\n* **FAQs** - Common vendor questions\n\nHow can I assist your business today?",
            sender: "bot"
          }]);
        }
      } catch (error) {
        console.log('Error initializing vendor chatbot: ', error);
        setMessages(prev => {
          if (prev.length === 0 || (prev.length === 1 && prev[0].text.includes("Welcome to Local Cart Vendor Assistant"))) {
            return [{
              text: "⚠️ I'm having trouble connecting to our systems. Please try again later or contact vendor support at +91-87654-32109.",
              sender: "bot"
            }];
          }
          return prev;
        });
      } finally {
        setIsLoading(false);
      }
    };
    initializeChatbot();
  }, []);

  const sendMessage = async () => {
    const message = userInput.trim();
    if (!message || isLoading || !isProductsLoaded) return; // isProductsLoaded now acts as isBackendReady

    const userMessageObject = { text: message, sender: "user" };

    setMessages((prev) => [...prev, userMessageObject]);
    setUserInput("");
    setIsLoading(true);

    try {
      const conversationHistoryForAI = [...messages, userMessageObject];
      const response = await processUserQuery(message, conversationHistoryForAI);
      setMessages((prev) => [...prev, { ...response, sender: "bot" }]);
    } catch (error) {
      console.error("Error in sendMessage (vendor bot):", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ Something went wrong while getting my response. Please try again or contact vendor support.",
          sender: "bot",
        },
      ]);
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
    isProductsLoaded, // Still used for system status
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="fixed -top-20 -right-20 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl -z-10"></div>
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

export default VendorChatBot;