import React, { useState, useContext, useMemo, useCallback, useEffect, useRef } from "react";
import { AuthContext } from "../../Context/Context";
import { toast } from "react-toastify";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  Settings,
  LogOut,
  ShoppingCart,
  Store,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Bell, // Added for notifications
  User, // Added for profile
  Activity, // Added for system status
} from "lucide-react";
import logo from "../../assets/logo.svg"; // Import logo

// Enhanced menu items with potential submenus
const menuItems = [
  {
    icon: <TrendingUp size={18} />,
    name: "Dashboard",
    tab: "dashboard",
    link: "/admin-panel",
  },
  {
    icon: <ShoppingCart size={18} />,
    name: "Orders",
    tab: "orders",
    link: "/admin/orders",
  },
  {
    icon: <Users size={18} />,
    name: "Users",
    tab: "users",
    submenu: [
      {
        name: "Customers",
        tab: "customers",
        link: "/admin/users",
      },
      {
        name: "Admins",
        tab: "admins",
        link: "/admin/users/admins",
      },
    ],
  },
  {
    icon: <Store size={18} />,
    name: "Vendors",
    tab: "vendors",
    link: "/admin/vendors",
  },
  {
    icon: <Package size={18} />,
    name: "Products",
    tab: "products",
    link: "/admin/products",
  },
  {
    icon: <Settings size={18} />,
    name: "Settings",
    tab: "settings",
    link: "/admin/settings",
  },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, setIsOpen, adminSignOut, admin } = useContext(AuthContext); // Get 'admin' from AuthContext

  const [activeTab, setActiveTab] = useState(() => {
    const currentPath = location.pathname;
    const foundItem = menuItems.find(
      (item) =>
        item.link === currentPath ||
        (item.submenu && item.submenu.some((sub) => currentPath.startsWith(sub.link)))
    );
    if (foundItem) {
      return foundItem.tab;
    } else {
      const parentFound = menuItems.find(item => item.link && currentPath.startsWith(item.link));
      if (parentFound) return parentFound.tab;
      return "dashboard";
    }
  });

  const [openSubmenus, setOpenSubmenus] = useState(() => {
    const initialOpen = {};
    menuItems.forEach(item => {
      if (item.submenu && item.submenu.some(sub => location.pathname.startsWith(sub.link))) {
        initialOpen[item.tab] = true;
      }
    });
    return initialOpen;
  });

  // State and ref for profile dropdown
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // State for notifications
  const [unreadNotifications, setUnreadNotifications] = useState(3);

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

  // Update activeTab when location changes
  useEffect(() => {
    const currentPath = location.pathname;
    const foundItem = menuItems.find(
      (item) =>
        item.link === currentPath ||
        (item.submenu && item.submenu.some((sub) => currentPath.startsWith(sub.link)))
    );

    if (foundItem) {
      setActiveTab(foundItem.tab);
    } else {
      const parentFound = menuItems.find(item => item.link && currentPath.startsWith(item.link));
      if (parentFound) {
        setActiveTab(parentFound.tab);
      } else {
        setActiveTab("dashboard");
      }
    }

    menuItems.forEach(item => {
      if (item.submenu && item.submenu.some(sub => currentPath.startsWith(sub.link))) {
        setOpenSubmenus(prev => ({ ...prev, [item.tab]: true }));
      }
    });
  }, [location.pathname]);

  const toggleSubmenu = useCallback((tab) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [tab]: !prev[tab],
    }));
  }, []);

  const handleLogout = useCallback(() => {
    adminSignOut();
    toast.success("Logged out successfully!");
    navigate("/admin/login");
    setIsOpen(false); // Close sidebar on logout
    setShowProfileDropdown(false); // Close dropdown on logout
  }, [adminSignOut, navigate, setIsOpen]);

  const handleTabClick = useCallback(
    (tab, link, hasSubmenu = false) => {
      if (hasSubmenu) {
        toggleSubmenu(tab);
        if (link) {
          setActiveTab(tab);
          navigate(link); // Navigate to parent link if it exists
        }
      } else {
        setActiveTab(tab);
        navigate(link);
        if (window.innerWidth < 768) {
          setIsOpen(false);
        }
      }
    },
    [navigate, toggleSubmenu, setIsOpen]
  );

  const isActive = useCallback(
    (itemLink, submenu) => {
      if (itemLink && location.pathname === itemLink) return true;
      if (submenu) {
        return submenu.some((sub) => location.pathname.startsWith(sub.link));
      }
      return itemLink && location.pathname.startsWith(itemLink);
    },
    [location.pathname]
  );

  const handleProfileClick = useCallback(() => {
    navigate("/admin/profile");
    setShowProfileDropdown(false);
    if (window.innerWidth < 768) setIsOpen(false);
  }, [navigate, setIsOpen]);

  const handleSettingsClick = useCallback(() => {
    navigate("/admin/settings");
    setShowProfileDropdown(false);
    if (window.innerWidth < 768) setIsOpen(false);
  }, [navigate, setIsOpen]);

  const handleNotificationClick = useCallback(() => {
    setUnreadNotifications(0);
    navigate("/admin/notifications");
    if (window.innerWidth < 768) setIsOpen(false);
  }, [navigate, setIsOpen]);

  // Render Avatar function moved here
  const renderAvatar = useCallback((user, sizeClass = "w-8 h-8", textClass = "text-md") => {
    if (user?.photo) {
      return (
        <img
          src={`${import.meta.env.VITE_API_URL}/uploads/users/${user.photo}`}
          alt={`${user.name || "Admin"}'s profile`}
          className={`${sizeClass} rounded-full object-cover border-2 border-emerald-300 shadow-sm`}
          onError={(e) => {
            e.target.onerror = null;
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

  // Responsive sidebar classes
  const sidebarClass = useMemo(() => {
    return `
      fixed md:relative
      h-screen shadow-lg bg-white transition-all duration-300 ease-in-out
      top-0 left-0 z-50 flex flex-col // Added flex-col for proper layout
      ${isOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20"}
    `;
  }, [isOpen]);

  const logoTextClass = useMemo(() => {
    return `transition-opacity duration-300 ${
      isOpen ? "opacity-100" : "opacity-0 md:opacity-0" // Hide on desktop if collapsed
    } ${isOpen ? "block" : "hidden md:hidden"}`; // Hide on desktop if collapsed
  }, [isOpen]);

  const menuItemTextClass = useMemo(() => {
    return `text-sm font-medium transition-all duration-300 whitespace-nowrap ${
      isOpen ? "opacity-100 ml-3" : "opacity-0 w-0 overflow-hidden md:opacity-0 md:hidden"
    }`; // Hide on desktop if collapsed
  }, [isOpen]);

  return (
    <>
      {/*Mobile overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        <div className={sidebarClass}>
          <div className="p-4 border-b border-gray-200">
            <div
          className={`flex items-center ${
            isOpen ? "justify-between" : "justify-center"
          } `}
            >
          <Link
            to="/admin-panel"
            className={`flex items-center text-xl font-bold text-green-600 hover:text-green-700 transition-colors ${
              isOpen ? "block" : "hidden "
            }`}
          >
            <img src={logo} alt="LocalCart Logo" className="h-12 w-auto" />
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`text-black hover:text-green-500 focus:outline-none transition-transform duration-300
              ${isOpen ? "rotate-90" : "rotate-0"}
            `}
            aria-label="Toggle sidebar"
          >
            {isOpen ? (
              <X size={24} className="transition-transform duration-300" />
            ) : (
              <Menu size={24} className="transition-transform duration-300" />
            )}
          </button>
            </div>
          </div>

          <div className={`p-4 space-y-2 border-b border-gray-100 ${isOpen ? 'block' : 'hidden md:block'}`}>
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className={`text-xs font-medium text-blue-600 ${menuItemTextClass}`}>
            System Online
          </span>
            </div>
          </div>

          {/* Navigation Menu */}
        <nav className="p-4 space-y-1 flex-grow overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.tab}>
              <div
                onClick={() =>
                  handleTabClick(item.tab, item.link, !!item.submenu)
                }
                className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                  isActive(item.link, item.submenu)
                    ? "bg-green-500 text-white"
                    : "text-gray-700 hover:bg-green-100 hover:text-green-700"
                }`}
              >
                <div className="flex items-center">
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={menuItemTextClass}>{item.name}</span>
                </div>
                {item.submenu && isOpen && ( 
                  <span>
                    {openSubmenus[item.tab] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </span>
                )}
              </div>

              {item.submenu && openSubmenus[item.tab] && isOpen && ( // Only show sub-menu if sidebar is open
                <div className="ml-8 mt-1 space-y-1">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.tab}
                      to={subItem.link}
                      onClick={() => {
                        setActiveTab(subItem.tab);
                        if (window.innerWidth < 768) {
                          setIsOpen(false);
                        }
                      }}
                      className={`block p-2 text-sm rounded-lg transition-colors ${
                        location.pathname.startsWith(subItem.link)
                          ? "bg-green-200 text-green-800"
                          : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer Section - Notifications, Profile, Logout */}
        <div className="mt-auto p-4 border-t border-gray-200 bg-white">
          {/* Notifications */}
          <button
            onClick={handleNotificationClick}
            className="relative flex items-center p-3 w-full rounded-lg text-gray-700 hover:bg-gray-100 hover:text-green-700 transition-colors"
          >
            <Bell size={18} className="flex-shrink-0" />
            <span className={menuItemTextClass}>Notifications</span>
            {unreadNotifications > 0 && isOpen && ( // Only show badge if sidebar is open
              <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">
                  {unreadNotifications}
                </span>
              </div>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative mt-2" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center p-3 w-full rounded-lg  text-gray-700 hover:bg-gray-100 hover:text-green-700 transition-colors"
            >
              {renderAvatar(admin, "w-8 h-8", "text-sm")}
              <div className={menuItemTextClass}>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {admin?.name || "Admin"}
                </div>
                <div className="text-xs text-gray-500">
                  {admin?.role || "Administrator"}
                </div>
              </div>
              {isOpen && ( 
                <ChevronDown
                  size={16}
                  className={`ml-auto transition-transform ${
                    showProfileDropdown ? "transform rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {showProfileDropdown && isOpen && ( // Only show dropdown if sidebar is open
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
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

          {/* Logout Button (Always visible even if mini-sidebar for quick access) */}
          <button
            className={`flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-red-100 hover:text-red-700 transition-colors mt-2 ${isOpen ? '' : 'justify-center'}`}
            onClick={handleLogout}
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span className={menuItemTextClass}>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;