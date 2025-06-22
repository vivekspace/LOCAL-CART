import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Menu,
  X,
  // MapPin, // MapPin is commented out, so it can be removed from imports if not used elsewhere in the component
} from "lucide-react";
import { useState, useContext, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/logo.svg";
import { AuthContext } from "../../Context/Context";

const AdminTopbar = () => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const { isOpen, setIsOpen, adminSignOut, admin } = useContext(AuthContext);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
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
    adminSignOut();
    setShowProfileDropdown(false);
  };

  // Helper function to render avatar or initial
  const renderAvatar = (user, sizeClass = "w-8 h-8", textClass = "text-md") => {
    // Check if user object and photo property exist and is not null/empty
    if (user?.photo) {
      return (
        <img
          src={`${import.meta.env.VITE_API_URL}/uploads/users/${user.photo}`}
          alt={`${user.name || "Admin"}'s profile`}
          className={`${sizeClass} rounded-full object-cover border-2 border-emerald-300 shadow-sm`}
          onError={(e) => {
            e.target.onerror = null; // Prevent infinite loop if fallback also fails
            // If image fails to load, replace with text initial fallback
            e.target.replaceWith(
              <div
                className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center font-semibold uppercase ${textClass}`}
              >
                {user.name ? user.name.charAt(0) : "U"}
              </div>
            );
          }}
        />
      );
    } else {
      // Fallback to initial from name if no photo
      const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";
      return (
        <div
          className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center font-semibold uppercase ${textClass}`}
        >
          {initial}
        </div>
      );
    }
  };

  return (
    <>
      <header className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gradient-to-r bg-white backdrop-blur-lg shadow-lg shadow-gray flex items-center justify-between sticky top-0 z-40 transition-all duration-300">
        {/* Left side - Branding and Mobile Sidebar Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile sidebar toggle button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-white/80 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 md:hidden transition-all duration-200 shadow-sm hover:shadow-md group"
            aria-label="Toggle sidebar"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-emerald-700 group-hover:text-emerald-800 transition-colors" />
            ) : (
              <Menu className="w-5 h-5 text-emerald-700 group-hover:text-emerald-800 transition-colors" />
            )}
          </button>

          <Link
            to="/admin-panel" // Adjusted to be explicit vendor dashboard
            className="flex items-center gap-2 text-2xl font-bold text-green-600 hover:text-green-700 transition-colors relative"
          >
            <img src={logo} alt="LocalCart Logo" className="h-12 w-auto" />
            <span className="text-xs font-medium text-gray-500 absolute top-2 right-9 md:right-12">
              Admin
            </span>
          </Link>
          <div className="hidden lg:flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              System Online
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notification */}
          <button
            onClick={handleNotificationClick}
            aria-label="Notifications"
            className="relative p-2 sm:p-2.5 rounded-xl bg-white/80 hover:bg-emerald-50 transition-all duration-200 shadow-sm hover:shadow-md group focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1"
          >
            <Bell className="w-5 h-5 text-emerald-700 group-hover:text-emerald-800 transition-colors" />
            {unreadNotifications > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-white">
                  {unreadNotifications}
                </span>
              </div>
            )}
          </button>

          {/* Admin profile */}
          <div className="relative z-50" ref={dropdownRef}> {/* This z-50 is fine */}
            <div
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group bg-white/80 hover:bg-emerald-50 rounded-2xl p-1 sm:p-2 transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div className="relative">
                {renderAvatar(
                  admin,
                  "w-8 h-8 sm:w-10 sm:h-10",
                  "text-md sm:text-lg"
                )}
                {/* Call renderAvatar here */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>

              <div className="hidden sm:block text-left">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-semibold text-gray-800">
                    {admin?.name || "Admin"} {/* Fallback for name */}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-emerald-600 group-hover:text-emerald-700 transition-all duration-200 ${
                      showProfileDropdown ? "transform rotate-180" : ""
                    }`}
                  />
                </div>
                {admin?.role && (
                  <span className="text-xs text-emerald-600 font-medium">
                    {admin.role}
                  </span>
                )}
              </div>

              {/* Mobile chevron */}
              <ChevronDown
                className={`sm:hidden w-4 h-4 text-emerald-600 group-hover:text-emerald-700 transition-all duration-200 ${
                  showProfileDropdown ? "transform rotate-180" : ""
                }`}
              />
            </div>

            {/* Profile dropdown */}
            {showProfileDropdown && (
              <div
                className="absolute right-0 mt-3 w-64 sm:w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-emerald-500/10 py-2 z-50 border border-emerald-100 animate-in slide-in-from-top-2 duration-200"
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
                role="menu"
                aria-label="Admin profile options"
                style={{ transformOrigin: "top right" }}
              >
                {/* Profile header */}
                <div className="flex items-center space-x-3 px-4 py-4 border-b border-emerald-100">
                  <div className="relative">
                    {renderAvatar(admin, "w-12 h-12", "text-lg")}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {admin?.name || "Admin"}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium capitalize">
                      {admin?.role || "Role"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Last login: Today, 9:30 AM
                    </p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all duration-150 group"
                    role="menuitem"
                  >
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-emerald-200 transition-colors">
                      <User className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">My Profile</div>
                      <div className="text-xs text-gray-500">
                        View and edit profile
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleSettingsClick}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all duration-150 group"
                    role="menuitem"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                      <Settings className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Settings</div>
                      <div className="text-xs text-gray-500">
                        System preferences
                      </div>
                    </div>
                  </button>
                </div>

                <div className="border-t border-emerald-100 pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150 group"
                    role="menuitem"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Sign Out</div>
                      <div className="text-xs text-gray-500">
                        End your session
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {showProfileDropdown && (
        <div
          className="fixed inset-0 z-30 bg-black/5 backdrop-blur-sm" // Changed z-index from z-40 to z-30
          onClick={() => setShowProfileDropdown(false)}
        />
      )}
    </>
  );
};

export default AdminTopbar;