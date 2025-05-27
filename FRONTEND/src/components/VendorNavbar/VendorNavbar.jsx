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
            <div className="flex justify-between items-center h-16">
                      <Link
                      to="/"
                      className="flex items-center gap-2 text-2xl font-bold text-green-600 hover:text-green-700 transition-colors relative"
                      >
                      <img src={logo} alt="Logo" className="h-12 w-auto" />
                      <span className="text-xs font-medium text-gray-500 absolute -top-0 right-12">
                        Vendor
                      </span>
                      </Link>
                    </div>

                    {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink
                to="/vendor/dashboard"
                className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <HomeIcon className="h-5 w-5 mr-1" />
                Dashboard
              </NavLink>
              <NavLink
                to="/vendor/products"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <CubeIcon className="h-5 w-5 mr-1" />
                Products
              </NavLink>
              <NavLink
                to="/vendor/orders"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-1" />
                Orders
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  5
                </span>
              </NavLink>
              <NavLink
                to="/vendor/customers"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <UsersIcon className="h-5 w-5 mr-1" />
                Customers
              </NavLink>
              <NavLink
                to="/vendor/analytics"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <ChartBarIcon className="h-5 w-5 mr-1" />
                Analytics
              </NavLink>
            </div>
          </div>

          {/* Right side - Profile and mobile button */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative">
              <EnvelopeIcon className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  id="user-menu"
                >
                  <img
                    className="h-8 w-8 rounded-full"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt=""
                  />
                  <ChevronDownIcon className="ml-1 h-5 w-5 text-gray-500" />
                </button>
              </div>

              {isProfileOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none p-2"
                  role="menu"
                >
                  <NavLink
                    href="/vendor/profile"
                    className=" px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-center mb-2"
                    role="menuitem"
                  >
                    <User className="inline-block mr-2 size-5" /> Your Profile
                  </NavLink>
                  <NavLink
                    href="#"
                    className=" px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-center mb-2"
                    role="menuitem"
                  >
                    <Settings className="inline-block mr-2 size-5" /> Settings
                  </NavLink>
                  <button
                    onClick={handleSignOut}
                    className="block px-4 py-2 text-sm   w-full font-medium bg-red-500 text-white rounded-md hover:text-white focus:outline-none hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    role="menuitem"
                  ><Power className="inline-block mr-2 size-5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
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

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <NavLink
              href="#"
              className="bg-indigo-50 border-indigo-500 text-indigo-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              <HomeIcon className="h-5 w-5 inline mr-2" />
              Dashboard
            </NavLink>
            <NavLink
              href="#"
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              <CubeIcon className="h-5 w-5 inline mr-2" />
              Products
            </NavLink>
            <NavLink
              href="#"
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              <ShoppingCartIcon className="h-5 w-5 inline mr-2" />
              Orders
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                5
              </span>
            </NavLink>
            <NavLink
              href="#"
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              <UsersIcon className="h-5 w-5 inline mr-2" />
              Customers
            </NavLink>
            <NavLink
              href="#"
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              <ChartBarIcon className="h-5 w-5 inline mr-2" />
              Analytics
            </NavLink>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <img
                  className="h-10 w-10 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  Tom Cook
                </div>
                <div className="text-sm font-medium text-gray-500">
                  tom@example.com
                </div>
              </div>
              <button className="ml-auto flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <EnvelopeIcon className="h-6 w-6" />
                <span className="sr-only">View notifications</span>
              </button>
            </div>
            <div className="mt-3 space-y-1">
              <NavLink
                href="#"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Your Profile
              </NavLink>
              <NavLink
                href="#"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Settings
              </NavLink>
              <NavLink
                href="#"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Sign out
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default VendorNavbar;
