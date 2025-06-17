import React, { useState, useEffect } from 'react';
import ChatBot from '../Chatbot/Chatbot';
import { MessageSquareText, X } from 'lucide-react';

const ChatbotToggle = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile on mount and window resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 640);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Backdrop for mobile - render behind chatbot */}
            {isOpen && isMobile && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={toggleChatbot}
                />
            )}

            {/* Chatbot container with proper responsive positioning */}
            <div
                className={`transform transition-all duration-500 ease-in-out z-50
                            ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95 pointer-events-none'}
                            fixed bottom-0 right-0 left-0 sm:bottom-20 sm:right-6 sm:left-auto
                            w-full sm:w-[400px] md:w-[450px] lg:w-[500px]
                            h-full sm:h-[600px] md:h-[650px]
                            sm:max-h-[calc(100vh-8rem)]
                            bg-white 
                            rounded-none sm:rounded-2xl lg:rounded-3xl
                            shadow-2xl overflow-hidden flex flex-col
                            border-t-2 sm:border border-gray-200`}
                style={{
                    maxHeight: '100vh',
                    ...(isMobile && {
                        width: 'calc(100vw - 1rem)',
                        left: '0.5rem',
                        right: '0.5rem',
                    }),
                }}
            >
                {/* Close button for mobile */}
                {isMobile && (
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                        <h3 className="font-semibold text-lg">Local Cart Assistant</h3>
                        <button
                            onClick={toggleChatbot}
                            className="p-2 rounded-full hover:bg-white/20 transition-colors"
                            aria-label="Close chatbot"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Chatbot content */}
                <div className="flex-1 overflow-hidden">
                    {isOpen && <ChatBot isInToggle={true} isMobile={isMobile} />}
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={toggleChatbot}
                className={`bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700
                            text-white p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out
                            transform hover:scale-110 flex items-center justify-center
                            focus:outline-none focus:ring-4 focus:ring-emerald-300 relative z-50
                            ${isOpen && isMobile ? 'hidden' : 'block'}`}
                aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
            >
                {isOpen && !isMobile ? (
                    <X className="w-7 h-7" />
                ) : (
                    <>
                        <MessageSquareText className="w-7 h-7" />
                        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-red-400 animate-ping"></span>
                    </>
                )}
            </button>
        </div>
    );
};

export default ChatbotToggle;