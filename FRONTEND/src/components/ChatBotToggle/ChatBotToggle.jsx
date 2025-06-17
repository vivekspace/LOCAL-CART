import React, { useState, useEffect } from 'react';
import ChatBot from '../Chatbot/Chatbot'; // Ensure this path is correct
import { MessageSquareText, X, Sparkles } from 'lucide-react';

const ChatbotToggle = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Check if mobile on mount and window resize
    useEffect(() => {
        const checkMobile = () => {
            // Using 768px for sm breakpoint as commonly used in Tailwind CSS
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleChatbot = () => {
        if (isAnimating) return;
        
        setIsAnimating(true);
        setIsOpen(!isOpen);
        
        setTimeout(() => {
            setIsAnimating(false);
        }, 500); // Match this with your animation duration
    };

    return (
        <> {/* Use a Fragment as the root to avoid an extra div */}
            {/* Backdrop with gradient overlay - Now a direct child of the Fragment */}
            {isOpen && (
                <div 
                    className={`fixed inset-0 z-40 transition-opacity duration-500 ease-in-out ${
                        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    } ${
                        isMobile ? 'bg-black/50 backdrop-blur-sm' : 'bg-gradient-to-br from-green-50/30 to-emerald-100/20 backdrop-blur-[1px]'
                    }`}
                    onClick={toggleChatbot}
                />
            )}

            {/* Chatbot container - Now a direct child of the Fragment */}
            <div
                className={`transform transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-50
                            ${isOpen ? 
                                isMobile ? 
                                    'translate-y-0 opacity-100 scale-100 rounded-t-2xl' 
                                    : 'translate-y-0 opacity-100 scale-100' 
                                : isMobile ? 
                                    'translate-y-full opacity-0 scale-95' 
                                    : 'translate-y-4 opacity-0 scale-95'
                            }
                            fixed bottom-0 right-0 left-0 
                            sm:bottom-20 sm:right-6 sm:left-auto 
                            w-full sm:w-[400px] md:w-[450px] lg:w-[500px]
                            h-[85vh] sm:h-[600px] md:h-[650px]
                            bg-white 
                            rounded-t-2xl sm:rounded-2xl lg:rounded-3xl
                            shadow-2xl sm:shadow-3xl overflow-hidden flex flex-col
                            border border-gray-200/50`}
                style={{
                    maxHeight: 'calc(100vh - 5rem)',
                    ...(isMobile && {
                        width: '100vw',
                        left: 0,
                        right: 0,
                    }),
                }}
            >
                {/* Custom header with gradient */}
                <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 p-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                    <div className="relative flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
                            <h3 className="font-bold text-lg text-white">Local Cart Assistant</h3>
                        </div>
                        <button
                            onClick={toggleChatbot}
                            className="p-1.5 rounded-full hover:bg-white/20 transition-colors duration-200"
                            aria-label="Close chatbot"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Chatbot content */}
                <div className="flex-1 overflow-hidden">
                    {/* isMobile prop is now passed from ChatbotToggle */}
                    <ChatBot isInToggle={true} isMobile={isMobile} /> 
                </div>
            </div>

            {/* Floating Action Button with animation - Now a direct child of the Fragment */}
            <button
                onClick={toggleChatbot}
                className={`fixed bottom-6 right-6 z-[9999] 
                            bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700
                            text-white p-4 rounded-full shadow-xl transition-all duration-300 ease-out
                            transform hover:scale-105 active:scale-95 flex items-center justify-center
                            focus:outline-none focus:ring-4 focus:ring-emerald-300/50
                            ${isOpen ? 'rotate-90' : 'rotate-0'} ${
                                isOpen && isMobile ? 'hidden' : 'block' // Hide on mobile when open
                            }`}
                aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
            >
                {isOpen ? (
                    <X className="w-6 h-6 transition-transform duration-300" />
                ) : (
                    <>
                        <MessageSquareText className="w-6 h-6" />
                        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                        </span>
                    </>
                )}
            </button>
        </>
    );
};

export default ChatbotToggle;