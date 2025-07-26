import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../Context/Context.jsx"; // Assuming correct path to AuthContext
import { NotificationContext } from "../../NotificationContext/NotificationContext.jsx"; // Import NotificationContext
import logo from "../../assets/logo.svg";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Store,
  Mail, // For messages
  User,
  Settings,
  Power,
  Menu,
  X,
  ChevronDown,
  Bell,
  MessageSquare, // Consistent with Mail for messages, or keep Mail
} from "lucide-react";

// FallbackAvatar component (remains unchanged)
const FallbackAvatar = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 border-indigo-200 shadow-sm bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center ${className}`}
    >
      <User className="h-1/2 w-1/2 text-indigo-600" />
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
  const notificationsRef = useRef(null); // Ref for notification dropdown

  const { user, logout } = useAuth();
  // Destructure from NotificationContext
  const {
    notifications, // Your actual notifications array
    unreadCount,   // Your actual unread count
    markNotificationAsRead,
    markAllNotificationsAsRead,
    simulateNotification, // For dev/testing purposes
  } = React.useContext(NotificationContext);

  // The orderCount for 'Orders' in navLinks can potentially come from a specific notification type count
  // For now, let's keep it static or tie it to new order notifications if you distinguish them
  const orderNotificationCount = useMemo(() => {
    // Example: Count unread notifications related to new orders
    return notifications.filter(
      (notif) => notif.unread && notif.link?.startsWith("/vendor/orders")
    ).length;
  }, [notifications]);

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
      to: "/vendor/order", // Corrected path based on your router in main.jsx
      label: "Orders",
      icon: ShoppingCart,
      notificationCount: orderNotificationCount, // Dynamic count for orders
      description: "New orders",
    },
    {
      to: "/vendor/sell",
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
    {
      to: "/vendor/messages",
      label: "Messages",
      icon: MessageSquare, // Changed to MessageSquare for consistency if desired
      description: "Chat with customers",
    },
  ];

  // Old static notifications are removed, now using `notifications` from context

  const handleSignOut = () => {
    logout();
  };

  // Handler for clicking a single notification item
  const handleNotificationClick = (notifId, notifLink) => {
    markNotificationAsRead(notifId); // Mark as read via context function
    setIsNotificationsOpen(false); // Close the dropdown
    if (notifLink) {
      navigate(notifLink); // Navigate to the associated link
    }
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const getNavLinkClass = ({ isActive }) =>
    `group transition-all duration-200 flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm relative ${
      isActive
        ? "bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-500"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  const getMobileNavLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
      isActive
        ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500"
        : "text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side: Logo and Desktop Navigation */}
          <div className="flex justify-between items-center h-16">
            <Link
              to="/vendor/dashboard"
              className="flex items-center gap-2 text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors relative"
            >
              <img src={logo} alt="LocalCart Logo" className="h-12 w-auto" />
            </Link>
          </div>

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
                    <>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 animate-pulse">
                        {link.notificationCount}
                      </span>
                      {/* Only show ping for desktop nav if there are notifications for this category */}
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping"></div>
                    </>
                  )}
                </NavLink>
              ))}
          </div>

          {/* Right side: Actions and Profile */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 relative transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px] h-[18px]">
                      {unreadCount}
                    </span>
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 rounded-full animate-ping"></div>
                  </>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-100 bg-indigo-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-indigo-900">
                        Notifications
                      </h3>
                      <span className="text-sm text-indigo-700">
                        {unreadCount} unread
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {notifications.length > 0 ? (
                      // Slice to show a limited number of notifications in the dropdown
                      // Consider sorting by time if your notifications from context aren't already
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification._id} // Use _id from backend
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            notification.isRead ? "" : "bg-blue-50" // Use isRead from backend
                          }`}
                          onClick={() => handleNotificationClick(notification._id, notification.link)}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                notification.isRead
                                  ? "bg-gray-300"
                                  : "bg-indigo-500" // Use isRead for dot color
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
                                {new Date(notification.createdAt).toLocaleString()} {/* Use createdAt from backend */}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No new notifications.
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100 bg-indigo-50">
                    <button
                      onClick={() => {
                        navigate("/vendor/notifications"); // Navigate to the full notifications page
                        setIsNotificationsOpen(false); // Close dropdown
                      }}
                      className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View All Notifications
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead} // Call context function
                        className="w-full mt-2 text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Mark All as Read
                      </button>
                    )}
                    {/* Optional: Simulation buttons for quick testing in dropdown */}
                    {/* <div className="mt-4 text-center">
                        <button onClick={() => simulateNotification('order')} className="text-xs px-2 py-1 bg-gray-200 rounded-md mr-2">Simulate Order</button>
                        <button onClick={() => simulateNotification('message')} className="text-xs px-2 py-1 bg-gray-200 rounded-md mr-2">Simulate Message</button>
                        <button onClick={() => simulateNotification('review')} className="text-xs px-2 py-1 bg-gray-200 rounded-md">Simulate Review</button>
                    </div> */}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown (remains largely unchanged) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              >
                {user?.photo ? (
                  <img
                    className="h-8 w-8 rounded-full border-2 border-indigo-200 object-cover"
                    src={user.photo}
                    alt="Profile"
                  />
                ) : (
                  <FallbackAvatar size="md" />
                )}
                <ChevronDown className="hidden sm:block h-4 w-4 text-gray-500" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                  <div className="p-4 border-b border-gray-100 bg-indigo-50">
                    <div className="flex items-center space-x-3">
                      {user?.photo ? (
                        <img
                          className="h-10 w-10 rounded-full border-2 border-indigo-200"
                          src={user.photo}
                          alt="Profile"
                        />
                      ) : (
                        <FallbackAvatar size="lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-indigo-900 text-sm truncate">
                          {user?.name || user?.storeName || "Vendor User"}
                        </p>
                        <p className="text-xs text-indigo-600 truncate">
                          {user?.email || "no-email@example.com"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <NavLink
                      to="/vendor/profile"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Your Profile</span>
                    </NavLink>
                    {/* Assuming '/vendor/settings' is a valid route and component */}
                    <NavLink
                      to="/vendor/settings"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </NavLink>
                  </div>

                  <div className="border-t border-gray-100 py-2">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
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
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <div
          className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          } flex flex-col`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex items-center space-x-3">
              <div className="flex justify-between items-center h-10">
                <Link
                  to="/vendor/dashboard"
                  className="flex items-center gap-2 text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors relative"
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
                  </div>
                </NavLink>
              ))}
              {/* Add a direct link to notifications in mobile menu for consistency */}
              <NavLink
                to="/vendor/notifications"
                className={getMobileNavLinkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </NavLink>
            </div>
          </div>

          {/* User Profile Section (remains largely unchanged) */}
          <div className="border-t border-gray-100 p-4 bg-indigo-50">
            <div className="flex items-center space-x-3 mb-4">
              {user?.photo ? (
                <img
                  className="h-12 w-12 rounded-full border-2 border-indigo-200"
                  src={user.photo}
                  alt="Profile"
                />
              ) : (
                <FallbackAvatar size="lg" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-indigo-900">
                  {user?.name || user?.storeName || "Vendor User"}
                </p>
                <p className="text-sm text-indigo-600 truncate">
                  {user?.email || "no-email@example.com"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <NavLink
                to="/vendor/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-white hover:text-indigo-900 rounded-lg transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Your Profile</span>
              </NavLink>
              {/* Assuming '/vendor/settings' is a valid route and component */}
              <NavLink
                to="/vendor/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-white hover:text-indigo-900 rounded-lg transition-colors"
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