import React, { useState, useContext, useMemo } from "react";
import { AuthContext } from "../../Context/Context";
import { toast, ToastContainer } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Users,
  CreditCard,
  Package,
  TrendingUp,
  Settings,
  LogOut,
  ShoppingBasketIcon,
  Store,
} from "lucide-react";

const menuItems = [
  {
    icon: <TrendingUp size={18} />,
    name: "Dashboard",
    tab: "dashboard",
    link: "/admin-panel",
  },
  { icon: <Package size={18} />, name: "Products", tab: "products" },
  {
    icon: <ShoppingBasketIcon size={18} />,
    name: "Orders",
    tab: "orders",
    link: "/admin/applications",
  },
  {
    icon: <Users size={18} />,
    name: "Customers",
    tab: "customers",
    link: "/admin/users",
  },
  { icon: <Store size={18} />, name: "Vendors", tab: "vendors", link: "/admin/vendors" },
  {
    icon: <CreditCard size={18} />,
    name: "Payments",
    tab: "payments",
    link: "/admin/users-row",
  },
  { icon: <Settings size={18} />, name: "Settings", tab: "settings", link: "/admin/settings" },
];

const AdminSidebar = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isOpen, setIsOpen, adminSignOut } = useContext(AuthContext);
  const navigate = useNavigate();

  const sidebarClass = useMemo(() => {
    return `relative h-screen shadow-lg bg-white transition-all duration-300 ease-in-out fixed top-0 left-0 z-50 ${
      isOpen ? "w-64" : "w-[75px]"
    }`;
  }, [isOpen]);

  const logoTextClass = useMemo(() => {
    return `transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"} ${
      isOpen ? "block" : "hidden"
    }`;
  }, [isOpen]);

  const menuItemTextClass = useMemo(() => {
    return `text-sm font-medium transition-all duration-300 ${
      isOpen ? "opacity-100 ml-0 block" : "opacity-0 ml-[-8px] w-0 overflow-hidden"
    }`;
  }, [isOpen]);

  const handleLogout = () => {
    adminSignOut();
    toast.success("Logged out successfully");
    navigate("/admin/login");
    setIsOpen(false);
  };

  const handleTabClick = (tab, link) => {
    setActiveTab(tab);
    navigate(link);
    setIsOpen(false);
  };

  return (
    <div className={sidebarClass}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-black hover:text-green-500 focus:outline-none transition-transform duration-300"
            style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
          >
            {isOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            )}
          </button>
        </div>
        <h1 className="text-xl font-bold flex items-center">
          <span className="bg-green-500 text-white p-2 rounded-lg mr-2 transition-all duration-300">
            <ShoppingBag size={20} />
          </span>
          <span className={logoTextClass}>LocalCart Admin</span>
        </h1>
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.tab}
            to={item.link}
            onClick={() => handleTabClick(item.tab, item.link)}
            className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${
              activeTab === item.tab
                ? "bg-green-500 text-white "
                : "hover:bg-green-100"
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            <span className={menuItemTextClass}>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-200 ">
        <ToastContainer />
        <button
          className="flex items-center w-full p-3 rounded-lg hover:bg-red-50  transition-colors"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-3" />
          <span className={menuItemTextClass}>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
