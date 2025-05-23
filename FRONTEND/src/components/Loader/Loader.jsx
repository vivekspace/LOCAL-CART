import { useState, useEffect } from 'react';
import { ShoppingCart, Leaf, Loader2, Carrot, Apple, Egg, CheckCircle, Fish, Sprout } from 'lucide-react';
import logo from '/src/assets/logo.svg'; // Update with actual logo path

const EnhancedPreloaderWithLogo = () => {
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Loading messages that change as the progress increases
  const loadingMessages = [
    "Connecting to local farms...",
    "Gathering fresh produce...",
    "Checking inventory...",
    "Preparing your cart...",
    "Almost ready!"
  ];

  useEffect(() => {
    // Smoother progress animation with variable speed
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down progress as it approaches completion
        const increment = prev < 70 ? 5 : prev < 90 ? 3 : 1;
        
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsComplete(true), 500);
          return 100;
        }
        
        // Update loading phase based on progress
        if (prev >= 20 && loadingPhase === 0) setLoadingPhase(1);
        else if (prev >= 40 && loadingPhase === 1) setLoadingPhase(2);
        else if (prev >= 60 && loadingPhase === 2) setLoadingPhase(3);
        else if (prev >= 80 && loadingPhase === 3) setLoadingPhase(4);
        
        return prev + increment;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [loadingPhase]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-white to-green-50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-8">
      {/* Logo at the top of the preloader */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 animate-[fadeIn_1s]">
        <img 
          src={logo} 
          alt="LocalCart Logo" 
          className="w-40 h-auto object-contain"
        />
      </div>
      
      {/* Main container with parallax effect */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Subtle background shapes */}
        <div className="absolute w-full h-full">
          <div className="absolute top-0 left-6 w-8 h-8 rounded-full bg-green-100 opacity-50 animate-pulse"></div>
          <div className="absolute bottom-6 right-0 w-12 h-12 rounded-full bg-green-100 opacity-50 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-10 right-8 w-6 h-6 rounded-full bg-green-100 opacity-50 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>

        {/* Circular progress with pulsing effect */}
        <div className="absolute w-full h-full rounded-full border-4 border-gray-100 shadow-inner"></div>
        
        {/* Animated progress circle with gradient */}
        <div className="absolute w-full h-full rounded-full overflow-hidden">
          <div 
            className="absolute w-full h-full border-4 border-transparent border-t-green-500 border-r-green-400 transition-all duration-300 ease-out"
            style={{
              transform: `rotate(${progress * 3.6}deg)`,
            }}
          ></div>
        </div>
        
        {/* Pulsing glow effect */}
        <div className={`absolute w-32 h-32 rounded-full bg-green-400 opacity-20 transition-opacity duration-1000 ${progress > 50 ? 'animate-pulse' : 'opacity-0'}`}></div>
        
        {/* Cart container with parallax effect */}
        <div className="relative z-10 w-24 h-24 flex items-center justify-center"
             style={{ transform: `translateY(${Math.sin(progress/10) * 3}px)` }}>
          {/* Shopping cart base with shadow */}
          <div className="absolute bottom-1 w-full h-10 bg-gradient-to-r from-green-600 to-green-500 rounded-lg shadow-lg"></div>
          
          {/* Cart handle with improved design */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 border-4 border-green-600 rounded-full"></div>
          
          {/* Animated items with staggered entrance */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            {/* Apple with bounce effect */}
            {progress > 15 && (
              <div className="absolute -left-6 -top-4 animate-[bounceIn_0.6s]">
                <Apple className="w-6 h-6 text-red-500 fill-red-100" />
              </div>
            )}
            
            {/* Leafy greens with floating animation */}
            {progress > 30 && (
              <div className="absolute left-1 -top-5 animate-[bounceIn_0.6s]"
                   style={{animationDelay: '0.2s', animation: 'bounceIn 0.6s, float 3s ease-in-out infinite'}}>
                <Leaf className="w-5 h-5 text-green-600 fill-green-100" />
              </div>
            )}
            
            {/* Carrot with rotation */}
            {progress > 45 && (
              <div className="absolute left-7 -top-2 animate-[bounceIn_0.6s]"
                   style={{animationDelay: '0.4s'}}>
                <Carrot className="w-5 h-5 text-orange-500 fill-orange-100" />
              </div>
            )}
            
            {/* Egg with subtle wobble */}
            {progress > 60 && (
              <div className="absolute left-0 top-2 animate-[bounceIn_0.6s]"
                   style={{animationDelay: '0.6s', animation: 'bounceIn 0.6s, wobble 2s ease-in-out infinite'}}>
                <Egg className="w-5 h-6 text-amber-100 fill-amber-50" />
              </div>
            )}

            {/* Fish - new item */}
            {progress > 75 && (
              <div className="absolute -left-5 top-0 animate-[bounceIn_0.6s]"
                   style={{animationDelay: '0.8s'}}>
                <Fish className="w-5 h-5 text-blue-500 fill-blue-100" />
              </div>
            )}

            {/* Sprout - new item */}
            {progress > 85 && (
              <div className="absolute left-5 top-3 animate-[bounceIn_0.6s]"
                   style={{animationDelay: '1s'}}>
                <Sprout className="w-5 h-5 text-green-500 fill-green-100" />
              </div>
            )}
          </div>
          
          {/* Final cart icon with completion animation */}
          {isComplete ? (
            <div className="absolute animate-[popIn_0.5s]">
              <CheckCircle size={40} className="text-green-500 fill-green-100" />
            </div>
          ) : progress >= 100 ? (
            <ShoppingCart 
              className="absolute text-green-600 animate-[popIn_0.5s]"
              size={36}
            />
          ) : null}
        </div>
      </div>
      
      {/* Loading text with dynamic messages */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          {!isComplete ? (
            <Loader2 className="animate-spin text-green-500" size={20} />
          ) : (
            <CheckCircle className="text-green-500" size={20} />
          )}
          <span 
            className="font-medium text-gray-700 text-lg transition-opacity duration-300"
            key={loadingPhase} // Force re-render animation on message change
          >
            {isComplete ? 'Your cart is ready!' : loadingMessages[loadingPhase]}
          </span>
        </div>
        
        {/* Enhanced progress bar with animated segments */}
        <div className="w-64 h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 transition-all duration-300 ease-out rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            {/* Animated pulse effect on progress bar */}
            <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
          </div>
        </div>
        
        {/* Percentage indicator with fade-in effect */}
        <div className="text-sm text-gray-500 font-medium">
          {progress}% complete
        </div>
      </div>
      
      {/* Branding not needed anymore as we have the logo at top */}
      
      {/* Success message that appears when complete */}
      {isComplete && (
        <div className="absolute inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.5s]">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-xs text-center space-y-4 animate-[scaleIn_0.5s]">
            {/* Logo in the completion modal */}
            <img 
              src={logo} 
              alt="LocalCart Logo" 
              className="w-32 h-auto object-contain mx-auto mb-2"
            />
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Ready to Go!</h3>
            <p className="text-gray-600">Your local shopping experience is about to begin.</p>
            <button className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
              Start Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedPreloaderWithLogo;