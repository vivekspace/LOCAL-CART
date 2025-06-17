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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub Flavored Markdown (tables, strikethrough, etc.)
import rehypeHighlight from "rehype-highlight"; // For syntax highlighting
import "highlight.js/styles/github.css"; // Syntax highlighting style

// Custom components for ReactMarkdown
const MarkdownComponents = {
  a: ({ node, ...props }) => (
    <a
      {...props}
      className="text-emerald-600 hover:text-emerald-700 underline font-medium"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  ul: ({ node, ...props }) => (
    <ul {...props} className="list-disc pl-5 space-y-1 my-2" />
  ),
  ol: ({ node, ...props }) => (
    <ol {...props} className="list-decimal pl-5 space-y-1 my-2" />
  ),
  li: ({ node, ...props }) => <li {...props} className="pl-2" />,
  table: ({ node, ...props }) => (
    <div className="overflow-auto">
      <table {...props} className="min-w-full border border-gray-200 my-2" />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th
      {...props}
      className="px-4 py-2 bg-gray-100 border border-gray-200 font-semibold"
    />
  ),
  td: ({ node, ...props }) => (
    <td {...props} className="px-4 py-2 border border-gray-200" />
  ),
  code: ({ node, inline, className, children, ...props }) => {
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
  blockquote: ({ node, ...props }) => (
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

// Chat message bubble with markdown support
const ChatBubble = ({ message, isUser }) => {
  return (
    <div
      className={`max-w-[90%] sm:max-w-md p-4 rounded-2xl shadow-md transition-all duration-300 ${
        isUser
          ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-br-sm hover:shadow-lg"
          : "bg-white text-gray-800 rounded-bl-sm border border-gray-200/50 hover:shadow-lg"
      }`}
    >
      <div className="text-sm leading-relaxed">
        {message.sender === "bot" ? (
          <ReactMarkdown
            components={MarkdownComponents}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {message.text}
          </ReactMarkdown>
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

// Main ChatbotContent component
const ChatbotContent = memo(
  ({
    messages,
    isLoading,
    isProductsLoaded,
    userInput,
    setUserInput,
    sendMessage,
    handleKeyPress,
    isInToggle, // This prop is used to determine header visibility
    isMobile // isMobile is also passed from ChatbotToggle
  }) => {
    const chatMessagesRef = useRef(null);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    // Auto-scroll to bottom
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
        {/* Collapsible header */}
        {/*
          This header should ONLY show if:
          1. It's NOT in toggle mode (`!isInToggle`) AND it's a desktop screen (`!isMobile`)
          (This handles the main chatbot page)
          It should NOT show if:
          2. It IS in toggle mode (`isInToggle`)
          (The ChatbotToggle component handles the header in this case)
        */}
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

            {/* Status indicator */}
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

            {/* Collapse toggle */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-white/70">
              {isHeaderVisible ? (
                <ChevronUp className="w-4 h-4 animate-bounce" />
              ) : (
                <ChevronDown className="w-4 h-4 animate-bounce" />
              )}
            </div>
          </div>
        )}

        {/* Chat Display Area */}
        <div
          ref={chatMessagesRef}
          className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-green-50/50 to-emerald-50/30"
        >
          {/* Loading and messages rendering */}
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
                  Searching local products...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Message Input Area */}
        <div className="p-4 sm:p-5 bg-white/95 backdrop-blur-sm border-t border-gray-200/30">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Ask about products, prices, or recommendations..."
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

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              "Fresh produce",
              "Daily deals",
              "Local specials",
              "Organic items",
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

// Main ChatBot component
const ChatBot = ({ isInToggle = false, isMobile = false }) => { // isMobile prop is now expected here
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);

  // Using VITE_API_URL as discussed
  const backendApiUrl = `${import.meta.env.VITE_API_URL}/api/chatbot/products`;
  const imageBaseUrl =
    "https://placehold.co/200x200/E0F2F1/042F2E?font=montserrat&text=";

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(backendApiUrl);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
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
        }));

        setProducts(enhancedProducts);
        setIsProductsLoaded(true);

        setMessages([
          {
            text: "🛍️ Welcome to Local Cart! I'm your personal shopping assistant. I can help you find products, check availability, compare prices, and give recommendations from our local vendors. What would you like to explore today?",
            sender: "bot",
          },
        ]);
      } catch (error) {
        console.error("Error fetching products:", error);
        setMessages([
          {
            text: "⚠️ I'm having trouble connecting to our product database. Please try again later or contact support if the issue persists.",
            sender: "bot",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [backendApiUrl]); // Added backendApiUrl to dependency array to prevent lint warning

  const sendMessage = async () => {
    const message = userInput.trim();
    if (!message || isLoading || !isProductsLoaded) return;

    // Add user message
    setMessages((prev) => [...prev, { text: message, sender: "user" }]);
    setUserInput("");
    setIsLoading(true);

    try {
      const chatHistory = [
        {
          role: "user",
          parts: [
            {
              text: `You are a shopping assistant for Local Cart. Format responses using Markdown:
- Use **bold** for important info
- Use *italics* for emphasis
- Use lists for product features
- Use tables for price comparisons
- Use code blocks for product IDs
- Always format product names as **Product Name**

Available Products: ${JSON.stringify(products)}\n\nCustomer query: ${message}`,
            },
          ],
        },
      ];
      const payload = { contents: chatHistory };
      // Using VITE_GEMINI_API_KEY as discussed
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      const botResponse =
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I couldn't process your request. Please try again.";

      setMessages((prev) => [...prev, { text: botResponse, sender: "bot" }]);
    } catch (error) {
      console.error("AI communication error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ **Error**\n\nI'm having trouble processing your request. Please try again later.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (text) => {
    const parts = [];
    let lastIndex = 0;

    // Enhanced regex for better image filename detection
    const regex = /\b([\w-]+\.(?:webp|png|jpg|jpeg|gif|svg))\b(?![^<]*>)/gi;

    text.replace(regex, (match, filename, offset) => {
      if (offset > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, offset)}
          </span>
        );
      }

      const imageUrl = `${imageBaseUrl}${encodeURIComponent(filename)}`;
      parts.push(
        <a
          key={filename}
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 hover:text-emerald-700 underline font-medium transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {filename}
        </a>
      );

      lastIndex = offset + match.length;
      return match;
    });

    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>
      );
    }

    return <>{parts}</>;
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
    renderMessageContent,
    isInToggle,
    isMobile, // Pass isMobile to ChatbotContent
    imageBaseUrl,
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
      {/* Floating decorative elements */}
      <div className="fixed -top-20 -right-20 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl -z-10"></div>
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white/70 to-transparent -z-10"></div>

      <div className="w-full max-w-2xl relative">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-white/20 h-[600px]">
          <ChatbotContent {...chatbotContentProps} />
        </div>

        {/* Watermark */}
        <div className="text-center mt-4 text-xs text-gray-400">
          Powered by Local Cart • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;