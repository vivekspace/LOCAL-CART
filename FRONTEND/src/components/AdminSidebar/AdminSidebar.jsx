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
  Bell,
  User,
  Activity,
} from "lucide-react";
import logo from "../../assets/logo.svg";

const menuItems = [
    {
        icon: <TrendingUp size={18} />,
        name: "Dashboard",
        tab: "dashboard",
        link: "/admin/panel",
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
    const { isOpen, setIsOpen, logout, user } = useContext(AuthContext);

    const [activeTab, setActiveTab] = useState(() => {
        const currentPath = location.pathname;
        const foundItem = menuItems.find(
            (item) =>
                item.link === currentPath ||
                (item.submenu && item.submenu.some((sub) => currentPath.startsWith(sub.link)))
        );
        if (foundItem) {
            return foundItem.tab;
        }
        const parentFound = menuItems.find(item => item.link && currentPath.startsWith(item.link));
        if (parentFound) return parentFound.tab;
        return "dashboard";
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

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [unreadNotifications, setUnreadNotifications] = useState(3);

    // Helper function to extract display name from user object
    const getUserDisplayName = useCallback((currentUser) => {
        if (!currentUser) return "Admin";
        
        // Prioritize 'name' if it's a string
        if (typeof currentUser.name === 'string' && currentUser.name.trim() !== '') {
            return currentUser.name;
        }
        // Fallback to 'email' prefix if 'name' is not a string or empty
        else if (typeof currentUser.email === 'string' && currentUser.email.trim() !== '') {
            return currentUser.email.split('@')[0];
        }
        // Fallback to 'storeName' if it's a string (e.g., for vendors)
        else if (typeof currentUser.storeName === 'string' && currentUser.storeName.trim() !== '') {
            return currentUser.storeName;
        }
        // Fallback to 'username' if it exists
        else if (typeof currentUser.username === 'string' && currentUser.username.trim() !== '') {
            return currentUser.username;
        }
        // Default fallback
        return "Admin";
    }, []);

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

    useEffect(() => {
        const currentPath = location.pathname;
        let foundMainTab = "dashboard";
        const foundMainMenuItem = menuItems.find(
            (item) =>
                item.link === currentPath ||
                (item.submenu && item.submenu.some((sub) => currentPath.startsWith(sub.link))) ||
                (item.link && currentPath.startsWith(item.link))
        );
        if (foundMainMenuItem) {
            foundMainTab = foundMainMenuItem.tab;
        }
        setActiveTab(foundMainTab);

        const newOpenSubmenus = {};
        menuItems.forEach(item => {
            if (item.submenu && item.submenu.some(sub => currentPath.startsWith(sub.link))) {
                newOpenSubmenus[item.tab] = true;
            }
        });
        setOpenSubmenus(newOpenSubmenus);
    }, [location.pathname]);

    const toggleSubmenu = useCallback((tab) => {
        setOpenSubmenus((prev) => ({
            ...prev,
            [tab]: !prev[tab],
        }));
    }, []);

    const handleLogout = useCallback(() => {
        logout();
        toast.success("Logged out successfully!");
        navigate("/admin/login");
        setIsOpen(false);
        setShowProfileDropdown(false);
    }, [logout, navigate, setIsOpen]);

    const handleTabClick = useCallback(
        (tab, link, hasSubmenu = false) => {
            if (hasSubmenu) {
                toggleSubmenu(tab);
                if (link && location.pathname !== link && !location.pathname.startsWith(link)) {
                    setActiveTab(tab);
                    navigate(link);
                }
            } else {
                setActiveTab(tab);
                navigate(link);
                if (window.innerWidth < 768) {
                    setIsOpen(false);
                    setOpenSubmenus({});
                }
            }
        },
        [navigate, toggleSubmenu, setIsOpen, location.pathname]
    );

    const handleSubmenuItemClick = useCallback((subItemLink) => {
        navigate(subItemLink);
        if (window.innerWidth < 768) {
            setIsOpen(false);
            setOpenSubmenus({});
        }
    }, [navigate, setIsOpen]);

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

    // Render Avatar function - FIXED VERSION
    const renderAvatar = useCallback((currentUser, sizeClass = "w-8 h-8", textClass = "text-md") => {
        const displayName = getUserDisplayName(currentUser);
        const initial = displayName.charAt(0).toUpperCase();

        if (currentUser?.photo) {
            return (
                <img
                    src={`${import.meta.env.VITE_API_URL}/uploads/users/${currentUser.photo}`}
                    alt={`${displayName}'s profile`}
                    className={`${sizeClass} rounded-full object-cover border-2 border-emerald-300 shadow-sm`}
                    onError={(e) => {
                        e.target.onerror = null;
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

    const sidebarClass = useMemo(() => {
        return `
            fixed md:relative
            h-screen shadow-lg bg-white transition-all duration-300 ease-in-out
            top-0 left-0 z-50 flex flex-col
            ${isOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20"}
        `;
    }, [isOpen]);

    const menuItemTextClass = useMemo(() => {
        return `text-sm font-medium transition-all duration-300 whitespace-nowrap ${
            isOpen ? "opacity-100 ml-3" : "opacity-0 w-0 overflow-hidden md:opacity-0 md:hidden"
        }`;
    }, [isOpen]);

    // Get user display name for use in JSX
    const userDisplayName = getUserDisplayName(user);

    return (
        <>
            {/* Mobile overlay */}
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
                            to="/admin/panel"
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
                                            onClick={() => handleSubmenuItemClick(subItem.link)}
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

                <div className="mt-auto p-4 border-t border-gray-200 bg-white">
                    <button
                        onClick={handleNotificationClick}
                        className="relative flex items-center p-3 w-full rounded-lg text-gray-700 hover:bg-gray-100 hover:text-green-700 transition-colors"
                    >
                        <Bell size={18} className="flex-shrink-0" />
                        <span className={menuItemTextClass}>Notifications</span>
                        {unreadNotifications > 0 && isOpen && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-xs font-bold text-white">
                                    {unreadNotifications}
                                </span>
                            </div>
                        )}
                    </button>

                    <div className="relative mt-2" ref={dropdownRef}>
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="flex items-center p-3 w-full rounded-lg text-gray-700 hover:bg-gray-100 hover:text-green-700 transition-colors"
                        >
                            {renderAvatar(user, "w-8 h-8", "text-sm")}
                            <div className={menuItemTextClass}>
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {userDisplayName}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {user?.role || "Administrator"}
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

                        {showProfileDropdown && isOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
                                    {renderAvatar(user, "w-10 h-10", "text-lg")}
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {userDisplayName}
                                        </div>
                                        <div className="text-xs text-blue-600 font-medium">
                                            {user?.role || "Administrator"}
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