import React, { useState, useContext, useMemo, useCallback, useEffect } from "react"; // Added useEffect for potential debugging if needed
import { AuthContext } from "../../Context/Context"; // Ensure AuthContext is correctly imported as a named export
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
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState(() => {
    const currentPath = location.pathname;
    const foundItem = menuItems.find(
      (item) =>
        item.link === currentPath ||
        (item.submenu && item.submenu.some((sub) => currentPath.startsWith(sub.link))) // Use startsWith for submenu links
    );
    // Fallback to dashboard if no matching tab is found, or determine based on top-level link
    if (foundItem) {
      return foundItem.tab;
    } else {
      // If no exact match, try to find a parent for a sub-path (e.g., /admin/users/123 should activate 'users')
      const parentFound = menuItems.find(item => item.link && currentPath.startsWith(item.link));
      if (parentFound) return parentFound.tab;
      // Default to dashboard if nothing matches
      return "dashboard";
    }
  });

  const [openSubmenus, setOpenSubmenus] = useState(() => {
      // Initialize openSubmenus based on current active path for submenus
      const initialOpen = {};
      menuItems.forEach(item => {
          if (item.submenu && item.submenu.some(sub => location.pathname.startsWith(sub.link))) {
              initialOpen[item.tab] = true;
          }
      });
      return initialOpen;
  });

  // Ensure 'adminSignOut' is provided by AuthContext, or if it's 'logout', rename it here.
  // Assuming 'adminSignOut' is the correct function for admin logout.
  const { isOpen, setIsOpen, adminSignOut } = useContext(AuthContext); 
  const navigate = useNavigate();

  const toggleSubmenu = useCallback((tab) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [tab]: !prev[tab],
    }));
  }, []);

  // Update activeTab when location changes (e.g., direct URL navigation)
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
        // If no exact match, try to find a parent for a sub-path
        const parentFound = menuItems.find(item => item.link && currentPath.startsWith(item.link));
        if (parentFound) {
            setActiveTab(parentFound.tab);
        } else {
            setActiveTab("dashboard"); // Default
        }
    }

    // Automatically open submenus if a subitem is active
    menuItems.forEach(item => {
        if (item.submenu && item.submenu.some(sub => currentPath.startsWith(sub.link))) {
            setOpenSubmenus(prev => ({ ...prev, [item.tab]: true }));
        }
    });

  }, [location.pathname]); // Re-run when the URL changes

  // Responsive sidebar classes
  const sidebarClass = useMemo(() => {
    return `
      fixed md:relative
      h-screen shadow-lg bg-white transition-all duration-300 ease-in-out
      top-0 left-0 z-50
      ${isOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"}
      ${isOpen ? "w-64" : "w-20"}
    `;
  }, [isOpen]);

  const logoTextClass = useMemo(() => {
    return `transition-opacity duration-300 ${
      isOpen ? "opacity-100" : "opacity-0"
    } ${isOpen ? "block" : "hidden"}`;
  }, [isOpen]);

  const menuItemTextClass = useMemo(() => {
    return `text-sm font-medium transition-all duration-300 whitespace-nowrap ${
      isOpen ? "opacity-100 ml-3" : "opacity-0 w-0 overflow-hidden"
    }`;
  }, [isOpen]);

  const handleLogout = useCallback(() => {
    adminSignOut(); 
    toast.success("Logged out successfully!");
    navigate("/admin/login"); 
    setIsOpen(false); 
  }, [adminSignOut, navigate, setIsOpen]);

  const handleTabClick = useCallback(
    (tab, link, hasSubmenu = false) => {
      if (hasSubmenu) {
        toggleSubmenu(tab);
       
        if (link) {
          setActiveTab(tab);
          navigate(link);
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
      return itemLink && location.pathname.startsWith(itemLink) && !submenu;
    },
    [location.pathname]
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={sidebarClass}>
        {/* Header Section */}
        <div className="p-4 border-b border-gray-200">
          <div
            className={`flex items-center ${
              isOpen ? "justify-between" : "justify-center"
            } mb-4`}
          >
            <h1 className="text-xl font-bold flex items-center">
              <span
                className={`bg-green-500 text-white p-2 rounded-lg mr-2 flex items-center justify-center ${
                  isOpen ? "visible" : "hidden" 
                }`}
              >
                <ShoppingBag size={20} />
              </span>
              <span className={logoTextClass}>LocalCart Admin</span>
            </h1>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-black hover:text-green-500 focus:outline-none transition-transform duration-300"
              aria-label="Toggle sidebar"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
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

              {item.submenu && openSubmenus[item.tab] && isOpen && (
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

        {/* Footer Section - Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-200 bg-white">
          <button
            className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-red-100 hover:text-red-700 transition-colors"
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