import {
    Bell,
    ChevronDown,
    LogOut,
    User,
    Settings,
    Menu,
    Home,
    Activity, // Keeping this if you want it as an icon in the topbar
} from "lucide-react";
import React, { useState, useContext, useRef, useEffect, useCallback } from "react"; // Added React import
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/admin_logo.svg"; // Only need if you plan to put a logo here
import { AuthContext } from "../../Context/Context"; // Correct import
import { NotificationContext } from "../../NotificationContext/NotificationContext.jsx"; // Import NotificationContext
import { toast } from "react-toastify";

const AdminTopbar = () => {
    const navigate = useNavigate();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false); // New state for notifications dropdown

    // Destructure 'logout' and 'user' from AuthContext
    const { isOpen, setIsOpen, logout, user } = useContext(AuthContext); // Changed adminSignOut to logout, and admin to user

    // Destructure from NotificationContext for notifications
    const {
        notifications, // Your actual notifications array
        unreadCount,   // Your actual unread count
        markNotificationAsRead,
        markAllNotificationsAsRead,
        // simulateNotification, // For dev/testing purposes, keep commented for production
    } = useContext(NotificationContext);

    const profileDropdownRef = useRef(null); // Renamed for clarity
    const notificationsDropdownRef = useRef(null); // Ref for notification dropdown

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
            if (
                notificationsDropdownRef.current &&
                !notificationsDropdownRef.current.contains(event.target)
            ) {
                setShowNotificationsDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleProfileClick = useCallback(() => {
        navigate("/admin/profile");
        setShowProfileDropdown(false);
    }, [navigate]);

    const handleSettingsClick = useCallback(() => {
        navigate("/admin/settings");
        setShowProfileDropdown(false);
    }, [navigate]);

    // Handle notification icon click to toggle dropdown
    const handleNotificationIconClick = useCallback(() => {
        setShowNotificationsDropdown((prev) => !prev);
    }, []);

    // Handle clicking a specific notification item
    const handleNotificationItemClick = useCallback((notifId, notifLink) => {
        markNotificationAsRead(notifId); // Mark as read via context function
        setShowNotificationsDropdown(false); // Close the dropdown
        if (notifLink) {
            navigate(notifLink); // Navigate to the associated link
        }
    }, [markNotificationAsRead, navigate]);

    const handleLogout = useCallback(() => {
        logout(); // Call the generic logout function from AuthContext
        toast.success("Logged out successfully!"); // Show success toast
        setShowProfileDropdown(false); // Close dropdown
        navigate("/admin/login"); // Redirect to login
    }, [logout, navigate]);

    // Helper function to safely get user display name
    const getUserDisplayName = useCallback((currentUser) => {
        if (!currentUser) return "Admin";

        // If currentUser is a string, return it directly
        if (typeof currentUser === 'string') return currentUser;

        // If currentUser is an object, try to extract name or email
        if (typeof currentUser === 'object') {
            if (currentUser.name) return currentUser.name;
            if (currentUser.email) return currentUser.email.split('@')[0];
            if (currentUser.username) return currentUser.username;
        }

        return "Admin";
    }, []);

    // Helper function to safely get user role
    const getUserRole = useCallback((currentUser) => {
        if (!currentUser) return "Administrator";

        // If currentUser is an object with role property
        if (typeof currentUser === 'object' && currentUser.role) {
            // Capitalize the first letter of the role
            return currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        }

        return "Administrator";
    }, []);

    // Render Avatar function (fixed to handle object properly)
    const renderAvatar = useCallback((currentUser, sizeClass = "w-8 h-8", textClass = "text-md") => {
        const displayName = getUserDisplayName(currentUser);
        const initial = displayName ? displayName.charAt(0).toUpperCase() : "A";

        // Check if currentUser has photo property
        const hasPhoto = currentUser && typeof currentUser === 'object' && currentUser.photo?.url; // Use optional chaining for url

        if (hasPhoto) {
            return (
                <img
                    src={currentUser.photo.url}
                    alt={`${displayName}'s profile`}
                    className={`${sizeClass} rounded-full object-cover border-2 border-emerald-300 shadow-sm`}
                    onError={(e) => {
                        e.target.onerror = null;
                        // Create a fallback div if image fails to load
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = `${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-semibold uppercase ${textClass} text-white`;
                        fallbackDiv.textContent = initial;
                        e.target.parentNode.replaceChild(fallbackDiv, e.target);
                    }}
                />
            );
        } else {
            return (
                <div
                    className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-semibold uppercase ${textClass} text-white`}
                >
                    {initial}
                </div>
            );
        }
    }, [getUserDisplayName]);

    return (
        <header className="flex items-center justify-between h-16 bg-white shadow-sm px-4 md:px-6 border-b border-gray-200">
            {/* Mobile Menu Toggle (Hamburger Icon) - Left side of top bar */}
            <div className="md:hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)} // This toggles the left sidebar
                    className="text-gray-600 hover:text-gray-900 focus:outline-none"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Brand/Dashboard Link (Visible on desktop) */}
            <Link to="/admin/panel" className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <img src={logo} alt="LocalCart Admin Logo" className="h-12 w-auto" />
            </Link>

            {/* Right-aligned items: Notifications and Profile Dropdown */}
            <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative" ref={notificationsDropdownRef}>
                    <button
                        onClick={handleNotificationIconClick}
                        className="relative text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Notifications"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <>
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full min-w-[18px] h-[18px]">
                                    {unreadCount}
                                </span>
                                {/* Optional: ping animation for new notifications */}
                                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 rounded-full animate-ping"></div>
                            </>
                        )}
                    </button>

                    {showNotificationsDropdown && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
                            <div className="p-4 border-b border-gray-100 bg-blue-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-blue-900">
                                        Notifications
                                    </h3>
                                    <span className="text-sm text-blue-700">
                                        {unreadCount} unread
                                    </span>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {notifications.length > 0 ? (
                                    notifications.slice(0, 5).map((notification) => ( // Show last 5 notifications
                                        <div
                                            key={notification._id}
                                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                notification.isRead ? "" : "bg-blue-50"
                                            }`}
                                            onClick={() => handleNotificationItemClick(notification._id, notification.link)}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div
                                                    className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                                        notification.isRead
                                                            ? "bg-gray-300"
                                                            : "bg-blue-500"
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
                                                        {new Date(notification.createdAt).toLocaleString()}
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
                            <div className="p-3 border-t border-gray-100 bg-blue-50">
                                <button
                                    onClick={() => {
                                        navigate("/admin/notifications"); // Navigate to the full notifications page
                                        setShowNotificationsDropdown(false); // Close dropdown
                                    }}
                                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View All Notifications
                                </button>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllNotificationsAsRead()} // Call context function
                                        className="w-full mt-2 text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Mark All as Read
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                    <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-haspopup="true"
                        aria-expanded={showProfileDropdown ? "true" : "false"}
                    >
                        {renderAvatar(user, "w-8 h-8", "text-sm")}
                        <span className="hidden md:block text-sm font-medium">
                            {getUserDisplayName(user)}
                        </span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform ${
                                showProfileDropdown ? "transform rotate-180" : ""
                            }`}
                        />
                    </button>

                    {showProfileDropdown && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                            {/* User Info in Dropdown */}
                            <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
                                {/* Ensure user.photo.url exists before using it */}
                                {user?.photo?.url ? (
                                    <img src={user.photo.url} alt={getUserDisplayName(user)} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    renderAvatar(user, "w-10 h-10", "text-base") // Fallback avatar for dropdown
                                )}
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {getUserDisplayName(user)}
                                    </div>
                                    <div className="text-xs text-blue-600 font-medium">
                                        {getUserRole(user)}
                                    </div>
                                </div>
                            </div>
                            {/* Dropdown Menu Items */}
                            <div className="py-1">
                                <button
                                    onClick={handleProfileClick}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                                >
                                    <User className="w-4 h-4 mr-3" />
                                    My Profile
                                </button>
                                <button
                                    onClick={handleSettingsClick}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                                >
                                    <Settings className="w-4 h-4 mr-3" />
                                    Settings
                                </button>
                            </div>
                            {/* Logout Button */}
                            <div className="border-t border-gray-200 py-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                >
                                    <LogOut className="w-4 h-4 mr-3" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminTopbar;
