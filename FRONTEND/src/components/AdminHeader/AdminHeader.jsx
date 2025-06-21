import { Bell, ChevronDown, LogOut, User, Settings, Menu, X } from "lucide-react";
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import logo from '../../assets/logo.svg'
import { AuthContext } from "../../Context/Context";

const AdminTopbar = () => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const { isOpen, setIsOpen } = useContext(AuthContext);
  const admin = JSON.parse(localStorage.getItem("adminInfo"));

  const handleProfileClick = () => {
    navigate("/admin/profile");
    setShowProfileDropdown(false);
  };

  const handleSettingsClick = () => {
    navigate("/admin/settings");
    setShowProfileDropdown(false);
  };

  const handleNotificationClick = () => {
    setUnreadNotifications(0);
    navigate("/admin/notifications");
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/admin/login');
  }

  return (
    <header className="w-full px-4 sm:px-8 lg:px-20 py-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
      {/* Left side - Branding and Mobile Sidebar Toggle */}
      <div className="flex items-center">
        {/* Mobile sidebar toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mr-2 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 md:hidden"
          aria-label="Toggle sidebar"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>

        <Link
          to="/admin-panel"
          className="flex items-center text-2xl font-bold text-green-600 hover:text-green-700 transition-colors relative"
        >
          <img src={logo} alt="LocalCart Logo" className="h-12 w-auto" />
          <span className="text-xs font-medium text-gray-500 absolute top-2 right-12">
            Admin
          </span>
        </Link>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
        {/* Notification */}
        <button
          onClick={handleNotificationClick}
          aria-label="Notifications"
          className="relative p-2 rounded-full hover:bg-emerald-100 transition"
        >
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>

        {/* Admin profile */}
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <img
              src={
                admin?.avatar
                  ? admin.avatar
                  : `${import.meta.env.VITE_API_URL}/uploads/default-product.png`
              }
              alt={`${admin?.name ? admin.name : "Admin"}'s profile`}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-emerald-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `${import.meta.env.VITE_API_URL}/uploads/default-product.png`;
              }}
            />
            <div className="hidden sm:block">
              <span className="text-sm font-medium text-gray-700">
                {admin?.name}
              </span>
              {admin?.role && (
                <span className="block text-xs text-gray-500">
                  {admin.role}
                </span>
              )}
            </div>
            <ChevronDown
              className={`hidden sm:block w-4 h-4 text-gray-500 group-hover:text-emerald-500 transition-transform ${
                showProfileDropdown ? "transform rotate-180" : ""
              }`}
            />
          </div>

          {/* Profile dropdown */}
          {showProfileDropdown && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200 animate-fade-in p-2 ease-in-out duration-300"
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
              role="menu"
              aria-label="Admin profile options"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                <img
                  src={
                    admin?.avatar
                      ? admin.avatar
                      : `${import.meta.env.VITE_API_URL}/uploads/default-product.png`
                  }
                  alt={`${admin?.name ? admin.name : "Admin"}'s avatar`}
                  className="w-10 h-10 rounded-full object-cover border border-emerald-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {admin?.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {admin?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleProfileClick}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 transition"
                role="menuitem"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </button>
              <button
                onClick={handleSettingsClick}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 transition"
                role="menuitem"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-200 transition"
                role="menuitem"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Clickaway overlay for profile dropdown */}
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