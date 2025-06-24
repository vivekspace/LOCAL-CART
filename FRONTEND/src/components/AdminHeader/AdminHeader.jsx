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
import { useState, useContext, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/logo.svg"; // Only need if you plan to put a logo here
import { AuthContext } from "../../Context/Context";
import { toast } from "react-toastify"; // Added toast for logout success message

const AdminTopbar = () => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3); // Example state
  const { isOpen, setIsOpen, adminSignOut, admin } = useContext(AuthContext); // Get 'admin' object
  const dropdownRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
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

  const handleNotificationClick = useCallback(() => {
    setUnreadNotifications(0); // Mark all as read for example
    navigate("/admin/notifications");
  }, [navigate]);

  const handleLogout = useCallback(() => {
    adminSignOut();
    toast.success("Logged out successfully!"); // Show success toast
    setShowProfileDropdown(false); // Close dropdown
    navigate("/admin/login"); // Redirect to login
  }, [adminSignOut, navigate]);

  // Render Avatar function (copied from your previous code)
  const renderAvatar = useCallback((user, sizeClass = "w-8 h-8", textClass = "text-md") => {
    if (user?.photo) {
      return (
        <img
          src={`${import.meta.env.VITE_API_URL}/uploads/users/${user.photo}`}
          alt={`${user.name || "Admin"}'s profile`}
          className={`${sizeClass} rounded-full object-cover border-2 border-emerald-300 shadow-sm`}
          onError={(e) => {
            e.target.onerror = null; // Prevent infinite loop if fallback also fails
            e.target.replaceWith(
              <div
                className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center font-semibold uppercase ${textClass}`}
              >
                {user.name ? user.name.charAt(0) : "A"}
              </div>
            );
          }}
        />
      );
    } else {
      const initial = user?.name ? user.name.charAt(0).toUpperCase() : "A";
      return (
        <div
          className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-semibold uppercase ${textClass} text-white`}
        >
          {initial}
        </div>
      );
    }
  }, []);

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
      {/* /* Added flex-grow */ }
        <Link to="/admin-panel" className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
          <img src={logo} alt="Logo" className="h-12 w-auto" />
        </Link>

            {/* Right-aligned items: Notifications and Profile Dropdown */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button
          onClick={handleNotificationClick}
          className="relative text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadNotifications > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {unreadNotifications}
            </span>
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-haspopup="true"
            aria-expanded={showProfileDropdown ? "true" : "false"}
          >
            {renderAvatar(admin, "w-8 h-8", "text-sm")}
            <span className="hidden md:block text-sm font-medium">{admin?.name || "Admin"}</span>
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
                {renderAvatar(admin, "w-10 h-10", "text-lg")}
                <div>
                  <div className="font-medium text-gray-900">
                    {admin?.name || "Admin"}
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    {admin?.role || "Administrator"}
                  </div>
                </div>
              </div>
              {/* Dropdown Menu Items */}
              <div className="py-1">
                <Link
                  to="/admin/settings"
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                >
                  <User className="w-4 h-4 mr-3" />
                  My Profile
                </Link>
                <Link
                  to="/admin/settings"
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Link>
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