import { useState, useEffect, useMemo, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/logo.svg";

// Unified Icons from lucide-react for consistency
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Store,
  Mail,
  User,
  Settings,
  Power,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
  Sun,
  Moon,
  ChevronRight,
  Activity,
  Truck,
  CreditCard,
  MessageSquare,
} from "lucide-react";

// Placeholder logo - replace with your actual logo
const Logo = () => (
  <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
    <span className="text-white font-bold text-sm">V</span>
  </div>
);

// Enhanced fallback avatar with better styling
const FallbackAvatar = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 border-green-200 shadow-sm bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center ${className}`}
    >
      <User className="h-1/2 w-1/2 text-green-600" />
    </div>
  );
};

const VendorNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  // Robust localStorage parsing with try-catch
  const user = useMemo(() => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Failed to parse user data from localStorage:", error);
      return null;
    }
  }, []);

  // Enhanced navigation links with more features
  const orderCount = 5;
  

  const navLinks = [
    {
      to: "/vendor/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
    },
    {
      to: "/vendor/products",
      label: "Products",
      icon: Package,
      description: "Manage inventory",
    },
    {
      to: "/vendor/orders",
      label: "Orders",
      icon: ShoppingCart,
      notificationCount: orderCount,
      description: "New orders",
    },
    {
      to: "/vendor-sell",
      label: "Sell",
      icon: Store,
      description: "Add new products",
    },
    {
      to: "/vendor/analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "Sales insights",
    },
  
  ];

  // Sample notifications
  const notifications = [
    {
      id: 1,
      title: "New Order Received",
      message: "Order #1234 from John Doe",
      time: "2 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "Payment Processed",
      message: "₹2,500 credited to your account",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      title: "Product Low Stock",
      message: "iPhone 15 has only 3 units left",
      time: "3 hours ago",
      unread: false,
    },
    {
      id: 4,
      title: "Review Received",
      message: "New 5-star review for MacBook Pro",
      time: "1 day ago",
      unread: false,
    },
  ];

  const unreadNotifications = notifications.filter((n) => n.unread).length;

  // Handle sign out
  const handleSignOut = () => {
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorInfo");
    localStorage.removeItem("user");
    navigate("/vendor/login");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Style helper for NavLink active states
  const getNavLinkClass = ({ isActive }) =>
    `group transition-all duration-200 flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm relative ${
      isActive
        ? "bg-green-100 text-green-700 shadow-sm"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  const getMobileNavLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
      isActive
        ? "bg-green-50 text-green-700 border-l-4 border-green-500"
        : "text-gray-700 hover:bg-gray-50"
    }`;

  return (
<nav className="bg-white shadow-sm border-b border-gray-100 fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side: Logo and Desktop Navigation */}
        <div className="flex justify-between items-center h-16 ">
              <Link
                to="vendor/dashboard"
                className="flex items-center gap-2 text-2xl font-bold text-green-600 hover:text-green-700 transition-colors relative"
              >
                <img src={logo} alt="Logo" className="h-12 w-auto" />
                <span className="text-xs font-medium text-gray-500 absolute top-2 right-12">
                  Vendor
                </span>
              </Link>
            {/* </div> */}

            {/* Desktop Navigation */}
            <div className="hidden lg:ml-8 lg:flex lg:space-x-1 items-center">
              {navLinks
                .filter((link) => !link.mobileOnly)
                .map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={getNavLinkClass}
                  >
                    <link.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span>{link.label}</span>
                    {link.notificationCount > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 animate-pulse">
                        {link.notificationCount}
                      </span>
                    )}
                    {link.notificationCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping"></div>
                    )}
                  </NavLink>
                ))}
            </div>
          </div>

          {/* Right side: Actions and Profile */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 relative transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px] h-[18px]">
                      {unreadNotifications}
                    </span>
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 rounded-full animate-ping"></div>
                  </>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <span className="text-sm text-gray-500">
                        {unreadNotifications} unread
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          notification.unread ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                              notification.unread
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              {notification.message}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <button className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium">
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
              >
                {user?.avatarUrl ? (
                  <img
                    className="h-8 w-8 rounded-full border-2 border-green-200 object-cover"
                    src={user.avatarUrl}
                    alt="Profile"
                  />
                ) : (
                  <FallbackAvatar size="md" />
                )}
                <ChevronDown className="hidden sm:block h-4 w-4 text-gray-500" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      {user?.avatarUrl ? (
                        <img
                          className="h-10 w-10 rounded-full border-2 border-green-200"
                          src={user.avatarUrl}
                          alt="Profile"
                        />
                      ) : (
                        <FallbackAvatar size="lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {user?.name || "Guest User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email || "no-email@example.com"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <NavLink
                      to="/vendor/profile"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Your Profile</span>
                    </NavLink>
                    <NavLink
                      to="/vendor/settings"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </NavLink>
                  </div>

                  <div className="border-t border-gray-100 py-2">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Power className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Overlay with blur effect */}
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sliding Panel */}
          <div
            className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            } flex flex-col`}
          >
            {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center space-x-3">
              <div className="flex justify-between items-center h-10 ">
              <Link
                to="vendor/dashboard"
                className="flex items-center gap-2 text-2xl font-bold text-green-600 hover:text-green-700 transition-colors relative"
              >
                <img src={logo} alt="Logo" className="h-12 w-auto" />
                <span className="text-xs font-medium text-gray-500 absolute top-2 right-12">
                  Vendor
                </span>
              </Link>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={`mobile-${link.to}`}
                  to={link.to}
                  className={getMobileNavLinkClass}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    <link.icon className="h-5 w-5" />
                    <div>
                      <span className="block">{link.label}</span>
                      {link.description && (
                        <span className="text-xs text-gray-500">
                          {link.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {link.notificationCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
                        {link.notificationCount}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </NavLink>
              ))}
            </div>
          </div>

          {/* User Profile Section */}
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex items-center space-x-3 mb-4">
              {user?.avatarUrl ? (
                <img
                  className="h-12 w-12 rounded-full border-2 border-green-200"
                  src={user.avatarUrl}
                  alt="Profile"
                />
              ) : (
                <FallbackAvatar size="lg" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">
                  {user?.name || "Guest User"}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user?.email || "no-email@example.com"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <NavLink
                to="/vendor/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-white hover:text-gray-900 rounded-lg transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Your Profile</span>
              </NavLink>
              <NavLink
                to="/vendor/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-white hover:text-gray-900 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </NavLink>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Power className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default VendorNavbar;
