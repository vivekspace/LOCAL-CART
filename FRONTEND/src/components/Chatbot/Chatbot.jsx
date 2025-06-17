import React, { useState, useEffect, useRef, memo } from 'react'; // Import memo
// Lucide React icons for a modern look
import { ShoppingCart, Send, Package, Sparkles, Heart, Star } from 'lucide-react';

// Extracted ChatbotContent component for better re-render control
const ChatbotContent = memo(({
    messages,
    isLoading,
    isProductsLoaded,
    userInput,
    setUserInput,
    sendMessage,
    handleKeyPress,
    renderMessageContent,
    isInToggle,
    imageBaseUrl
}) => {
    const chatMessagesRef = useRef(null);

    // Effect to scroll to the bottom of the chat when new messages arrive
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex h-full flex-col">
            {/* Header - only show if not in toggle or on mobile */}
            {(!isInToggle || window.innerWidth > 640) && (
                <div className="relative bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative flex items-center justify-center space-x-3">
                        <div className="relative">
                            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                                Local Cart Assistant
                                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-200 animate-pulse" />
                            </h1>
                            <p className="text-green-100 text-xs sm:text-sm font-medium flex items-center gap-1">
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-200" />
                                Your neighborhood shopping companion
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-200" />
                            </p>
                        </div>
                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-80" />
                    </div>

                    {/* Status indicator */}
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isProductsLoaded ? 'bg-emerald-300' : 'bg-green-300'} animate-pulse`}></div>
                        <span className="text-xs text-white/80">
                            {isProductsLoaded ? 'Online' : 'Loading...'}
                        </span>
                    </div>
                </div>
            )}

            {/* Chat Display Area */}
            <div ref={chatMessagesRef} className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 bg-gradient-to-b from-green-50/50 to-emerald-50/30">
                {!isProductsLoaded && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 p-3 sm:p-4 rounded-2xl rounded-bl-md shadow-lg border border-green-200/50 flex items-center space-x-3">
                            <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Loading fresh products from our local vendors...</span>
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className={`max-w-[85%] sm:max-w-xs md:max-w-md p-3 sm:p-4 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                            msg.sender === 'user'
                                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-br-md transform hover:scale-105'
                                : 'bg-white text-gray-800 rounded-bl-md border border-gray-200/50 hover:bg-gray-50'
                        }`}>
                            <p className="text-sm leading-relaxed">{renderMessageContent(msg.text)}</p>
                            {msg.sender === 'bot' && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50">
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                        <span className="text-xs text-gray-500">Local Cart AI</span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-white text-gray-800 p-3 sm:p-4 rounded-2xl rounded-bl-md shadow-lg border border-gray-200/50 flex items-center space-x-3">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-gray-600">Looking through our products...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Message Input Area */}
            <div className="p-3 sm:p-6 bg-white/90 backdrop-blur-sm border-t border-gray-200/50">
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Ask me about products, prices, or get recommendations..."
                            className="w-full p-3 sm:p-4 pl-4 sm:pl-6 pr-10 sm:pr-12 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white/80 backdrop-blur-sm text-gray-800 placeholder-gray-500 transition-all duration-300 hover:bg-white text-sm"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading || !isProductsLoaded}
                        />
                        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        </div>
                    </div>
                    <button
                        className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                        onClick={sendMessage}
                        disabled={isLoading || !isProductsLoaded}
                    >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                    {['Fresh produce', 'Daily deals', 'Local specials', 'Organic items'].map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => setUserInput(suggestion)}
                            className="px-2 sm:px-3 py-1 text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full hover:from-green-200 hover:to-emerald-200 transition-all duration-300 transform hover:scale-105 border border-green-200/50"
                            disabled={isLoading || !isProductsLoaded}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
});


// Main App component for the chatbot
const ChatBot = ({ isInToggle = false }) => {
    // State to store chat messages { text: '...', sender: 'user' | 'bot' }
    const [messages, setMessages] = useState([]);
    // State to store the current user input
    const [userInput, setUserInput] = useState('');
    // State to manage loading indicator visibility
    const [isLoading, setIsLoading] = useState(false);
    // State to store fetched product data from the backend
    const [products, setProducts] = useState([]);
    // State to track if product data has been loaded
    const [isProductsLoaded, setIsProductsLoaded] = useState(false);

    // Backend API URL - make sure this matches the port your Node.js server is running on
    // Using http://localhost:3001 for local consistency. Adjust if you use Vite environment variables.
    const backendApiUrl = `${import.meta.env.VITE_API_URL}/api/chatbot/products`;

    // Base URL for product images. In a real app, this would be your CDN or server path.
    // For demonstration, using placehold.co to generate placeholders with filename text.
    const imageBaseUrl = "https://placehold.co/150x150/E0F2F1/042F2E?text="; // Greenish placeholder

    // Effect to fetch products from your Node.js backend
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(backendApiUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                const fetchedProducts = Array.isArray(result.data?.products)
                                             ? result.data.products
                                             : []; // Default to empty array if not found or not array

                // Enhance fetched products with dummy image data if it doesn't exist
                // and ensure 'category' and 'tags' for better AI responses
                const productsForAI = fetchedProducts.map(p => ({
                    ...p,
                    images: p.images && p.images.length > 0 ? p.images : [`${p.name.toLowerCase().replace(/\s/g, '_')}_1.webp`],
                    // Ensure these fields exist for the AI to categorize and tag
                    category: p.category || 'Uncategorized', // Fallback category
                    tags: p.tags || [] // Fallback empty tags array
                }));

                setProducts(productsForAI);
                console.log("Products fetched from backend (enhanced for AI):", productsForAI);
                setIsProductsLoaded(true);
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: "🛒 Welcome to Local Cart! I'm your personal shopping assistant. I can help you find products, check availability, compare prices, and give recommendations from our local vendors. What are you looking for today?", sender: 'bot' }
                ]);
            } catch (error) {
                console.error("Error fetching products from backend:", error);
                setMessages((prevMessages) => [...prevMessages, { text: "Oops! I'm having trouble connecting to our product database. Please make sure our local server is running. Let me know if you need help!", sender: 'bot' }]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []); // Empty dependency array means this runs once on component mount


    /**
     * Handles sending a message. Appends user message, calls AI, and appends bot response.
     */
    const sendMessage = async () => {
        const message = userInput.trim();
        if (!message || isLoading || !isProductsLoaded) return; // Prevent sending empty messages or while loading/products not loaded

        // Add user message to chat history
        setMessages((prevMessages) => [...prevMessages, { text: message, sender: 'user' }]);
        setUserInput(''); // Clear input field
        setIsLoading(true); // Show loading indicator

        try {
            // Prepare chat history for the AI, including dynamically fetched product data
            const chatHistory = [
                {
                    role: "user",
                    parts: [
                        { text: `You are a helpful assistant for a 'Local Cart' business. Your ONLY source of information is the 'Available Products' list provided below.

When a user asks about categories or types of products (e.g., 'Fresh produce', 'Organic items', 'Daily deals', 'Local specials'), you should:
1. Identify products from the 'Available Products' list whose 'category' field matches the query, or whose 'tags' array contains keywords related to the query.
2. List the names of all relevant products found.
3. If no specific products match the category, you can state that you have information about that category but no specific products are currently available or relevant.

If a user asks for images of a product, list the available image filenames from the 'images' field if present and specify that they are filenames.

If a product or piece of information is NOT explicitly in the 'Available Products' list and cannot be inferred from categories or tags, you MUST state "I do not have information about that product." Do NOT use any external knowledge or invent details. Be concise and directly answer based on the data.

Available Products: ${JSON.stringify(products)}\n\nCustomer query: ${message}` }
                    ]
                }
            ];

            // Construct payload for Gemini API
            const payload = { contents: chatHistory };
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            // Make the API call
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            // Extract the bot's response
            let botResponseText = "I'm sorry, I couldn't get a response from the AI at this moment. Please try again.";
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                botResponseText = result.candidates[0].content.parts[0].text;
            }

            // Add bot's response to chat history
            setMessages((prevMessages) => [...prevMessages, { text: botResponseText, sender: 'bot' }]);

        } catch (error) {
            console.error("Error communicating with AI:", error);
            setMessages((prevMessages) => [...prevMessages, { text: "Oops! Something went wrong communicating with the AI. Please try again.", sender: 'bot' }]);
        } finally {
            setIsLoading(false); // Hide loading indicator
        }
    };

    /**
     * Function to render message content, detecting and creating links for image filenames.
     * @param {string} text - The raw message text from the bot.
     * @returns {Array<React.ReactNode>} - Array of React nodes (text spans and anchor tags).
     */
    const renderMessageContent = (text) => {
        // Regex to find image filenames (e.g., productimages-...).webp, .jpg, .png etc.
        // It looks for sequences of word characters, hyphens, numbers followed by a dot and a common image extension.
        const imageFilenameRegex = /\b([\w-]+\.(?:webp|png|jpg|jpeg|gif))\b/gi;
        let parts = [];
        let lastIndex = 0;

        // Use replace with a callback to capture matches and text in between
        text.replace(imageFilenameRegex, (match, filename, offset) => {
            // Add any text before the current image filename
            if (offset > lastIndex) {
                parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, offset)}</span>);
            }
            // Construct the full image URL
            const imageUrl = `${imageBaseUrl}${filename}`;
            // Add the clickable link for the image filename
            parts.push(
                <a
                    key={filename} // Unique key for React list rendering
                    href={imageUrl}
                    target="_blank" // Opens in a new tab
                    rel="noopener noreferrer" // Security best practice for target="_blank"
                    className="text-blue-600 hover:underline break-all font-semibold" // Tailwind classes for styling the link
                >
                    {filename}
                </a>
            );
            // Update lastIndex to continue searching after the current match
            lastIndex = offset + match.length;
            return match; // Return match to keep replace function working correctly
        });

        // Add any remaining text after the last image filename
        if (lastIndex < text.length) {
            parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
        }

        // Return the array of text spans and links
        return <>{parts}</>;
    };

    /**
     * Handles key press events in the input field. Sends message on 'Enter' key.
     * @param {object} event - The keyboard event.
     */
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    // Prepare props for ChatbotContent
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
        imageBaseUrl
    };

    // Return different layouts based on usage
    if (isInToggle) {
        return (
            <div className="h-full flex flex-col bg-white">
                <ChatbotContent {...chatbotContentProps} />
            </div>
        );
    }

    // Full-screen layout
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-tr from-emerald-200/30 to-green-200/30 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-100/20 to-emerald-100/20 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-4xl relative">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 h-[600px]">
                    <ChatbotContent {...chatbotContentProps} />
                </div>
            </div>
        </div>
    );
};

export default ChatBot;