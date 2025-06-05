import { Bell, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthProvider from "../../Context/Context";

const AdminTopbar = () => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3); // Example count
  const adminSignOut = useContext(AuthProvider);

  const admin = JSON.parse(localStorage.getItem("adminInfo"));

  const handleProfileClick = () => {
    navigate("/admin/profile");
  };

  const handleSettingsClick = () => {
    navigate("/admin/settings");
  };

  const handleNotificationClick = () => {
    // Implement notification logic
    setUnreadNotifications(0);
    navigate("/admin/notifications");
  };

  return (
    <header className="w-full px-4 sm:px-8 lg:px-20 py-4 bg-white border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between sticky top-0 z-50 transition-colors duration-200 ">
      {/* Left side - Branding */}
      <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
        LocalCart Admin Panel
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
        {/* Location - Hidden on small screens */}

        {/* Notification */}
        <button
          onClick={handleNotificationClick}
          aria-label="Notifications"
          className="relative p-2 rounded-full hover:bg-emerald-100 dark:hover:bg-gray-700 transition"
        >
          <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>

        {/* Theme toggle */}

        {/* Admin profile */}
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <img
              src={
                admin.avatar
                  ? admin.avatar
                  : `${import.meta.env.VITE_API_URL}/uploads/default-product.png`
              }
              alt={`${admin.name ? admin.name : "Admin"}'s profile`}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-emerald-500 dark:border-emerald-400"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `${import.meta.env.VITE_API_URL}/uploads/default-product.png`;
              }}
            />
            <div className="hidden sm:block">
              <span className="text-sm font-medium text-gray-700 ">
                {admin.name}
              </span>
              {admin.role && (
                <span className="block text-xs text-gray-500 ">
                  {admin.role}
                </span>
              )}
            </div>
            <ChevronDown
              className={`hidden sm:block w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 transition-transform ${
                showProfileDropdown ? "transform rotate-180" : ""
              }`}
            />
          </div>

          {/* Profile dropdown */}
          {showProfileDropdown && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white  rounded-lg shadow-xl py-2 z-50 border border-gray-200 animate-fade-in p-2 ease-in-out duration-300"
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
              role="menu"
              aria-label="Admin profile options"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 ">
                <img
                  src={
                    admin.avatar
                      ? admin.avatar
                      : "VITE_API_URL/uploads/default-product.png"
                  }
                  alt={`${admin.name ? admin.name : "Admin"}'s avatar`}
                  className="w-10 h-10 rounded-full object-cover border border-emerald-500 dark:border-emerald-400"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {admin.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {admin.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleProfileClick}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700  hover:bg-emerald-50  transition"
                role="menuitem"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </button>
              <button
                onClick={handleSettingsClick}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700  hover:bg-emerald-50 transition"
                role="menuitem"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button
                onClick={adminSignOut}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 border-t border-gray-200 dark:border-gray-700 transition"
                role="menuitem"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      {showProfileDropdown && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setShowProfileDropdown(false)}
        />
      )}
    </header>
  );
};

export default AdminTopbar;
