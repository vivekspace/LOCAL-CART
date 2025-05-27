import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Home,
  Search,
  Package,
  Store,
  ShoppingBag,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const PageNotFound = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate particles for animation
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: Math.random() * 3 + 5,
    }));
    setParticles(newParticles);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // In a real app, you'd navigate to search results
      console.log("Searching for:", searchQuery);
      alert(`Searching for: ${searchQuery}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const FloatingIcon = ({ IconComponent, className = "", delay = 0 }) => (
    <div
      className={`absolute text-green-200/20 ${className}`}
      style={{
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <IconComponent size={32} />
    </div>
  );

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(5deg);
          }
          66% {
            transform: translateY(10px) rotate(-3deg);
          }
        }

        @keyframes particleFloat {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-10px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 relative overflow-hidden flex items-center justify-center p-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        {/* Floating Icons */}
        <FloatingIcon
          IconComponent={ShoppingCart}
          className="top-[10%] left-[10%]"
          delay={0}
        />
        <FloatingIcon
          IconComponent={ShoppingBag}
          className="top-[20%] right-[15%]"
          delay={2}
        />
        <FloatingIcon
          IconComponent={Store}
          className="bottom-[25%] left-[20%]"
          delay={4}
        />
        <FloatingIcon
          IconComponent={Package}
          className="bottom-[15%] right-[25%]"
          delay={1}
        />

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-white/60 rounded-full"
              style={{
                left: `${particle.left}%`,
                animation: `particleFloat ${particle.duration}s linear infinite`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center text-white max-w-2xl mx-auto px-6">
          {/* LocalCart Logo/Brand */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
              <ShoppingCart className="text-white" size={24} />
              <span className="text-xl font-bold">LocalCart</span>
            </div>
          </div>

          {/* Main Cart Icon */}
          <div className="mb-8">
            <div className="inline-block p-6 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 animate-bounce">
              <ShoppingCart size={64} className="text-white drop-shadow-lg" />
            </div>
          </div>

          {/* 404 Error Code */}
          <div className="mb-6">
            <h1 className="text-8xl md:text-9xl font-black bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent animate-pulse">
              404
            </h1>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">
              Your Cart Seems Empty Here!
            </h2>
            <p className="text-lg md:text-xl text-green-100 leading-relaxed">
              Oops! The page you're looking for must have been added to someone
              else's cart. Let's get you back to shopping for amazing local
              products!
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for local products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full px-6 py-4 pr-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-300"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 p-2 rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <Search size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to={"/"}>
              <button className="group bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-300/50 flex items-center gap-2">
                <Home size={20} />
                Back to Home
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </Link>
            <Link to={"/shopping"}>
              <button className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20 flex items-center gap-2">
                <Store size={20} />
                Browse Local Stores
              </button>
            </Link>
          </div>

          {/* Secondary Actions */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-green-100 mb-4">
              Need help? We're here for you!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => alert("Navigate to Contact")}
                className="text-white hover:text-green-200 transition-colors duration-300 flex items-center gap-2 underline decoration-dotted underline-offset-4"
              >
                <MessageCircle size={16} />
                Contact Support
              </button>
              <span className="hidden sm:inline text-white/50">•</span>
              <button
                onClick={() => alert("Navigate to Help")}
                className="text-white hover:text-green-200 transition-colors duration-300 flex items-center gap-2 underline decoration-dotted underline-offset-4"
              >
                <Package size={16} />
                Help Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageNotFound;
