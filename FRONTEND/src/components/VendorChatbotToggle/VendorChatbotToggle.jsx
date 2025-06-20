import React, { useState, useEffect } from "react";
import VendorChatBot from "../VendorChatbot/VendorChatbot"; 
import { Briefcase, X, Sparkles } from "lucide-react"; 

const VendorChatbotToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialRender, setIsInitialRender] = useState(true);

  const ANIMATION_DURATION = 500;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    setIsInitialRender(false); // Mark as not initial render after first check

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let timeoutId;

    if (isOpen) {
      setShowChatbot(true);
    } else {
      // Only delay unmounting if not initial render
      if (!isInitialRender) {
        timeoutId = setTimeout(() => {
          setShowChatbot(false);
        }, ANIMATION_DURATION);
      } else {
        // For initial render when isOpen is false, immediately hide chatbot to prevent flicker
        setShowChatbot(false);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [isOpen, isInitialRender]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Backdrop - Adjusted colors for vendor theme */}
      {showChatbot && (
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-500 ease-in-out ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${
            isMobile
              ? "bg-black/50 backdrop-blur-sm"
              : "bg-gradient-to-br from-purple-50/30 to-indigo-100/20 backdrop-blur-[1px]"
          }`}
          onClick={toggleChatbot}
        />
      )}

      {/* Chatbot container - Adjusted colors and positioning for vendor theme */}
      {showChatbot && (
        <div
          className={`transform transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-50
                      ${
                        isOpen
                          ? isMobile
                            ? "translate-y-0 opacity-100 scale-100 rounded-t-2xl"
                            : "translate-y-0 opacity-100 scale-100"
                          : isMobile
                          ? "translate-y-full opacity-0 scale-95 pointer-events-none"
                          : "translate-y-4 opacity-0 scale-95 pointer-events-none"
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
            maxHeight: "calc(100vh - 5rem)",
            ...(isMobile && {
              width: "100vw",
              left: 0,
              right: 0,
            }),
            // Start in closed state when first mounted
            ...(!isOpen && isMobile && { transform: "translateY(100%)" }),
            ...(!isOpen && !isMobile && { transform: "translateY(1rem)" }),
          }}
        >
          {/* Header - Adjusted colors for vendor theme */}
          <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="relative flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-200 animate-pulse" />
                <h3 className="font-bold text-lg text-white">
                  Local Cart Vendor Assistant
                </h3>
              </div>
              <button
                onClick={toggleChatbot}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors duration-200"
                aria-label="Close vendor chatbot"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* RENDER THE VENDOR CHATBOT HERE */}
            <VendorChatBot isInToggle={true} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* FAB button - Adjusted colors and icon for vendor theme */}
      <button
        onClick={toggleChatbot}
        className={`fixed bottom-6 right-6 z-[9999]
                    bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
                    text-white p-4 rounded-full shadow-xl transition-all duration-300 ease-out
                    transform hover:scale-105 active:scale-95 flex items-center justify-center
                    focus:outline-none focus:ring-4 focus:ring-purple-300/50
                    ${isOpen ? "rotate-90" : "rotate-0"} ${
          isOpen && isMobile ? "hidden" : "block"
        }`}
        aria-label={isOpen ? "Close vendor chatbot" : "Open vendor chatbot"}
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-300" />
        ) : (
          <>
            <Briefcase className="w-6 h-6" /> {/* Vendor-specific icon */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-400"></span>
            </span>
          </>
        )}
      </button>
    </>
  );
};

export default VendorChatbotToggle;