import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChartBarIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom";
import logo from "/src/assets/logo.svg";
import { Power, Settings, User } from "lucide-react";

const VendorNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const handleSignOut = () => {
    // Clear local storage
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorInfo");
    localStorage.removeItem("user");

    // Navigate to login page
    window.location.href = "/vendor/login";
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and desktop nav */}
          <div className="flex">
            {/* Logo */}
            <div className="flex justify-between items-center h-16 ">
              <Link
                to="vendor/dashboard"
                className="flex items-center gap-2 text-2xl font-bold text-green-600 hover:text-green-700 transition-colors relative"
              >
                <img src={logo} alt="Logo" className="h-12 w-auto" />
                <span className="text-xs font-medium text-gray-500 absolute top-2 right-12">
                  Vendor
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4 items-center">
              <NavLink
                to="/vendor/dashboard"
                className={({ isActive }) =>
                  (isActive
                    ? "bg-green-100 text-green-700 shadow"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700") +
                  " transition-all duration-150 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"
                }
              >
                <HomeIcon className="h-5 w-5" />
                Dashboard
              </NavLink>
              <NavLink
                to="/vendor/products"
                className={({ isActive }) =>
                  (isActive
                    ? "bg-green-100 text-green-700 shadow"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700") +
                  " transition-all duration-150 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"
                }
              >
                <CubeIcon className="h-5 w-5" />
                Products
              </NavLink>
              <NavLink
                to="/vendor/orders"
                className={({ isActive }) =>
                  (isActive
                    ? "bg-green-100 text-green-700 shadow"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700") +
                  " transition-all duration-150 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"
                }
              >
                <ShoppingCartIcon className="h-5 w-5" />
                Orders
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-green-800 shadow">
                  5
                </span>
              </NavLink>
              <NavLink
                to="/vendor/customers"
                className={({ isActive }) =>
                  (isActive
                    ? "bg-green-100 text-green-700 shadow"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700") +
                  " transition-all duration-150 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"
                }
              >
                <UsersIcon className="h-5 w-5" />
                Customers
              </NavLink>
              <NavLink
                to="/vendor/analytics"
                className={({ isActive }) =>
                  (isActive
                    ? "bg-green-100 text-green-700 shadow"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700") +
                  " transition-all duration-150 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"
                }
              >
                <ChartBarIcon className="h-5 w-5" />
                Analytics
              </NavLink>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button className="p-2 rounded-full text-gray-400 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 relative transition">
                <EnvelopeIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>
              <div className="ml-4 relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition"
                  id="user-menu"
                >
                  <img
                    className="h-9 w-9 rounded-full border-2 border-green-200 shadow-sm object-cover"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt=""
                  />
                  <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-500" />
                </button>
                {isProfileOpen && (
                  <>
                    {/* Overlay to close dropdown on outside click */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl py-2 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-100 p-2"
                      role="menu"
                    >
                      <div className="px-4 py-2 border-b flex items-center gap-2">
                        <img
                          className="h-8 w-8 rounded-full border border-green-200"
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                          alt=""
                        />
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">
                            {user?.name || "Tom Cook"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                      <NavLink
                        to="/vendor/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition"
                        role="menuitem"
                      >
                        <User className="size-5" /> Your Profile
                      </NavLink>
                      <NavLink
                        to="#"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition"
                        role="menuitem"
                      >
                        <Settings className="size-5" /> Settings
                      </NavLink>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 text-sm w-full font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        role="menuitem"
                      >
                        <Power className="size-5" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sliding right nav */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{}}
      >
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-[#00000035] bg-opacity-30 transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        {/* Sliding panel */}
        <div
          className={`fixed top-0 right-0 h-full w-72 bg-white shadow-lg transform transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-10 w-auto" />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="pt-2 pb-3 space-y-1 px-4">
            <NavLink
              to="/vendor/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                (isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-700 hover:bg-gray-50") +
                " flex items-center px-3 py-2 rounded-md text-base font-medium"
              }
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Dashboard
            </NavLink>
            <NavLink
              to="/vendor/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                (isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-700 hover:bg-gray-50") +
                " flex items-center px-3 py-2 rounded-md text-base font-medium"
              }
            >
              <CubeIcon className="h-5 w-5 mr-2" />
              Products
            </NavLink>
            <NavLink
              to="/vendor/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                (isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-700 hover:bg-gray-50") +
                " flex items-center px-3 py-2 rounded-md text-base font-medium"
              }
            >
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Orders
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-green-800">
                5
              </span>
            </NavLink>
            <NavLink
              to="/vendor/customers"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                (isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-700 hover:bg-gray-50") +
                " flex items-center px-3 py-2 rounded-md text-base font-medium"
              }
            >
              <UsersIcon className="h-5 w-5 mr-2" />
              Customers
            </NavLink>
            <NavLink
              to="/vendor/analytics"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                (isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-700 hover:bg-gray-50") +
                " flex items-center px-3 py-2 rounded-md text-base font-medium"
              }
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Analytics
            </NavLink>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-10 w-10 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user?.name || "Tom Cook"}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user?.email}
                </div>
              </div>
              <button className="ml-auto flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <EnvelopeIcon className="h-6 w-6" />
                <span className="sr-only">View notifications</span>
              </button>
            </div>
            <div className="mt-3 space-y-1">
              <NavLink
                to="/vendor/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
              >
                Your Profile
              </NavLink>
              <NavLink
                to="#"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
              >
                Settings
              </NavLink>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default VendorNavbar;
