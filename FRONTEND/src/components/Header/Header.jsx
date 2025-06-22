import React, { useEffect, useState, useRef, useContext, useMemo } from "react";
import { Link, NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  LogIn,
  UserPlus,
  ShoppingCart,
  User,
  Leaf,
  ChevronDown,
  Power,
  ShoppingBag,
  UserCog,
  MapPin,
  ChevronRight,
  Navigation,
  Store,
} from "lucide-react";
import { AuthContext } from "../../Context/Context.jsx";
import logo from "/src/assets/logo.svg";

const Header = () => {
  const {
    cartItems,
    logout,
    isLoggedIn,
    user,
    selectedLocation,
    updateUserLocation,
    availableLocations, // Provided by AuthContext, contains product-based cities
    locationsLoading: authLocationsLoading,
    LOCATION_TYPE_CURRENT,
    LOCATION_TYPE_PRODUCT_BASED,
    DEFAULT_FALLBACK_LOCATION // Added for better reference
  } = useContext(AuthContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentLocationDisplayName, setCurrentLocationDisplayName] = useState(
    "Loading Location..."
  );

  // Refs for click outside functionality
  const locationDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const mobileLocationDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Effect to close dropdowns when mobile menu closes
  useEffect(() => {
    if (!menuOpen) {
      setLocationDropdownOpen(false);
      setUserDropdownOpen(false);
    }
  }, [menuOpen]);

  // Desktop click outside handlers
  useEffect(() => {
    const handleDesktopClickOutside = (event) => {
      if (menuOpen) return; // Don't interfere with mobile menu

      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setLocationDropdownOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDesktopClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleDesktopClickOutside);
    };
  }, [menuOpen]);

  // Mobile click outside handlers
  useEffect(() => {
    const handleMobileClickOutside = (event) => {
      if (!menuOpen) return;

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
        setLocationDropdownOpen(false);
        setUserDropdownOpen(false);
        return;
      }

      if (
        locationDropdownOpen &&
        mobileLocationDropdownRef.current &&
        !mobileLocationDropdownRef.current.contains(event.target)
      ) {
        setLocationDropdownOpen(false);
      }
    };

    if (menuOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleMobileClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleMobileClickOutside);
      };
    }
  }, [menuOpen, locationDropdownOpen]);

  // Effect to update the display name of the current location in the header button
  useEffect(() => {
    if (selectedLocation) {
      if (selectedLocation.type === LOCATION_TYPE_CURRENT) {
        // Handle "Current Location (CityName)"
        if (selectedLocation.city && selectedLocation.city.toLowerCase() !== 'current location' && selectedLocation.city.toLowerCase() !== DEFAULT_FALLBACK_LOCATION.city.toLowerCase()) {
            const formattedCity = selectedLocation.city.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            setCurrentLocationDisplayName(`Current Location (${formattedCity})`);
        }
        // Handle "Current Location (Unavailable)" or fallback to default message if geo failed
        else if (selectedLocation.name && selectedLocation.name.startsWith("Current Location (Unavailable")) {
            setCurrentLocationDisplayName(selectedLocation.name);
        }
        // Generic "Current Location" if no specific city is available or it's the fallback city without explicit name
        else {
            setCurrentLocationDisplayName("Current Location"); 
        }
      } else if (selectedLocation.name) {
        // For product-based locations, just use their name
        setCurrentLocationDisplayName(selectedLocation.name);
      } else {
        setCurrentLocationDisplayName("Select Location"); // Fallback for uninitialized or invalid locations
      }
    } else {
      setCurrentLocationDisplayName("Loading Location..."); // Initial loading state
    }
  }, [selectedLocation, LOCATION_TYPE_CURRENT, DEFAULT_FALLBACK_LOCATION]);


  // Handle location selection from dropdown
  const handleLocationSelect = async (locationData) => {
    console.log("Header: handleLocationSelect triggered with:", locationData);
    try {
      await updateUserLocation(locationData);
      setLocationDropdownOpen(false); // Close dropdown on selection
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  const navigate = useNavigate();
  const handleLogOut = () => {
    logout();
    setMenuOpen(false);
    setUserDropdownOpen(false);
    setLocationDropdownOpen(false);
    navigate("/");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setUserDropdownOpen(false);
    setLocationDropdownOpen(false);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
    if (!userDropdownOpen) {
      setLocationDropdownOpen(false);
    }
  };

  const toggleLocationDropdown = () => {
    setLocationDropdownOpen(!locationDropdownOpen);
    if (!locationDropdownOpen) {
      setUserDropdownOpen(false);
    }
  };

  const navItemClasses = ({ isActive }) =>
    `px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 ${
      isActive
        ? "bg-green-50 text-green-600 font-medium shadow-sm"
        : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
    }`;

  // FINAL REFINED: Construct combinedLocationOptions to avoid functional duplicates
  const generateCombinedLocationOptions = () => {
    const options = [];
    // Using a Set to track cities (lowercase) already explicitly added from *product-based* locations,
    // or if the 'Current Location' resolved to a specific city.
    const addedCities = new Set(); 

    // 1. Prepare the "Current Location" option. This will always be the first entry.
    let currentGeoCityName = null;
    if (selectedLocation?.type === LOCATION_TYPE_CURRENT && selectedLocation?.city) {
        const cityLower = selectedLocation.city.toLowerCase();
        // Only consider it a "resolved city" if it's not the generic "current location" placeholder city
        // AND not the city of the DEFAULT_FALLBACK_LOCATION if that's what it resolved to.
        if (cityLower !== 'current location' && cityLower !== DEFAULT_FALLBACK_LOCATION.city.toLowerCase()) {
            currentGeoCityName = cityLower;
        }
    }

    const currentLocationOption = {
      name: currentGeoCityName ? `Current Location (${currentGeoCityName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')})` : "Current Location",
      type: LOCATION_TYPE_CURRENT,
      lat: selectedLocation?.lat, // Keep lat/lng if available for current location
      lng: selectedLocation?.lng,
      city: currentGeoCityName || 'current location', // Store the resolved city or the generic placeholder
    };
    options.push(currentLocationOption);

    // If "Current Location" successfully resolved to a specific city, add it to our tracking set.
    if (currentGeoCityName) {
        addedCities.add(currentGeoCityName);
    }

    // 2. Add product-based locations from availableLocations, avoiding duplicates.
    if (Array.isArray(availableLocations)) {
      availableLocations.forEach(loc => {
        const locationCityLower = loc.city?.toLowerCase();
        
        // Only add a product-based location if:
        // - It has a valid city name.
        // - This city has NOT been added yet (either as the resolved 'Current Location' city, or another product location).
        // - It's explicitly a product-based type (to avoid issues if availableLocations somehow contained generic current_location types).
        if (locationCityLower && !addedCities.has(locationCityLower) && loc.type === LOCATION_TYPE_PRODUCT_BASED) {
          options.push({
            name: loc.name,
            city: locationCityLower,
            type: LOCATION_TYPE_PRODUCT_BASED,
            lat: loc.lat, // Can be null/undefined for product-based cities from API
            lng: loc.lng, // Can be null/undefined for product-based cities from API
          });
          addedCities.add(locationCityLower); // Mark this city as added
        }
      });
    }

    // Sort product-based options (everything after the first "Current Location" option) alphabetically by name.
    const sortedProductOptions = options.slice(1).sort((a, b) => a.name.localeCompare(b.name));
    return [options[0], ...sortedProductOptions]; // Combine and return
  };

  const combinedLocationOptions = useMemo(generateCombinedLocationOptions, [selectedLocation, availableLocations, LOCATION_TYPE_CURRENT, DEFAULT_FALLBACK_LOCATION]);


  return (
    <nav
      className={`bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-lg" : "shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold text-green-600 hover:text-green-700 transition-colors"
            onClick={() => {
              setMenuOpen(false);
              setLocationDropdownOpen(false);
              setUserDropdownOpen(false);
            }}
          >
            <img src={logo} alt="LocalCart Logo" className="h-12 w-auto min-w-[48px] min-h-[48px]" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Desktop Location Selector */}
            <div className="relative mr-2" ref={locationDropdownRef}>
              <button
                onClick={toggleLocationDropdown}
                disabled={authLocationsLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                  locationDropdownOpen
                    ? "bg-green-50 text-green-600"
                    : "hover:bg-gray-50 text-gray-700 hover:text-green-600"
                } ${authLocationsLoading ? "opacity-75 cursor-not-allowed" : ""}`}
              >
                {authLocationsLoading ? (
                  <div className="animate-spin h-5 w-5">
                    <Navigation className="h-5 w-5 text-green-600" />
                  </div>
                ) : (
                  <MapPin className="h-5 w-5 text-green-600" />
                )}
                <span className="max-w-[120px] truncate">
                  {currentLocationDisplayName}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    locationDropdownOpen ? "transform rotate-180" : ""
                  }`}
                />
              </button>

              {locationDropdownOpen && (
                <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-100 transition-all duration-300 origin-top p-2 overflow-y-auto max-h-[300px]">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                    Select Location
                  </div>
                  {combinedLocationOptions.map((option, index) => {
                    // Create a unique key for each option
                    const uniqueKey = option.type === LOCATION_TYPE_CURRENT 
                      ? "current_location_desktop" // Fixed key for the single current location option
                      : `product_${option.city}_${index}`; // Use city and index for product locations
                    
                    // Check if this option is selected
                    const isSelected = selectedLocation && (
                      (option.type === LOCATION_TYPE_CURRENT && selectedLocation.type === LOCATION_TYPE_CURRENT) ||
                      (option.type === LOCATION_TYPE_PRODUCT_BASED && 
                       selectedLocation.type === LOCATION_TYPE_PRODUCT_BASED &&
                       selectedLocation.city?.toLowerCase() === option.city?.toLowerCase())
                    );

                    return (
                      <button
                        key={uniqueKey}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await handleLocationSelect(option);
                        }}
                        disabled={authLocationsLoading && option.type === LOCATION_TYPE_CURRENT}
                        className={`w-full px-4 py-2.5 text-sm text-left font-medium rounded-md flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                        } ${
                          authLocationsLoading && option.type === LOCATION_TYPE_CURRENT
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {option.type === LOCATION_TYPE_CURRENT && (
                            <Navigation className="h-4 w-4" />
                          )}
                          {option.name}
                        </span>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <NavLink to="/" className={navItemClasses}>
              <Home className="h-5 w-5" />
              <span>Home</span>
            </NavLink>

            <NavLink to="/shopping" className={navItemClasses}>
              <Leaf className="h-5 w-5" />
              <span>Products</span>
            </NavLink>

            {isLoggedIn ? (
              <div className="relative ml-1" ref={userDropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                    userDropdownOpen
                      ? "bg-green-50 text-green-600"
                      : "hover:bg-gray-50 text-gray-700 hover:text-green-600"
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <User className="h-5 w-5" />
                  </div>
                  <span>{user?.name ? `Hi, ${user.name.split(' ')[0]}` : "Account"}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      userDropdownOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-100 transition-all duration-300 origin-top p-2 ${
                    userDropdownOpen
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <Link
                    to="/profile"
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors rounded-md flex items-center gap-2"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <UserCog className="h-5 w-5" />
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors rounded-md flex items-center gap-2"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogOut}
                    className="w-full px-4 py-2.5 text-sm text-center bg-red-50 rounded-md text-red-600 font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2 mt-1"
                  >
                    <Power className="h-5 w-5" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <NavLink to="/login" className={navItemClasses}>
                  <LogIn className="h-5 w-5" />
                  <span>Login</span>
                </NavLink>

                <NavLink
                  to="/register"
                  className="ml-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium hover:from-green-700 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center gap-2"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Register</span>
                </NavLink>
                <NavLink to="/vendor/login" className={navItemClasses}>
                  <Store className="h-5 w-5" />
                  <span>Vendor Login</span>
                </NavLink>
              </>
            )}

            {/* Shopping Cart */}
            <NavLink
              to="/cart"
              className="ml-2 p-2 rounded-lg relative hover:bg-gray-50 transition-colors group"
            >
              <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:text-green-600 transition-colors" />
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                {cartItems.length}
              </span>
            </NavLink>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <NavLink
              to="/cart"
              className="p-2 rounded-lg relative hover:bg-gray-50 transition-colors group"
            >
              <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:text-green-600" />
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                {cartItems.length}
              </span>
            </NavLink>

            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className="h-5 w-5 transform transition-transform duration-300 rotate-90" />
              ) : (
                <Menu className="h-5 w-5 transform transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - Slide in from right */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-500 ease-in-out ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Background overlay */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-500 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        
        {/* Mobile menu container */}
        <div
          ref={mobileMenuRef}
          className={`absolute right-0 top-0 h-screen w-80 bg-white shadow-xl transform transition-transform duration-500 ease-in-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Menu header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <Link
                to="/"
                className="flex items-center gap-2 text-xl font-bold text-green-600"
                onClick={toggleMenu}
              >
                <img src={logo} alt="LocalCart Logo" className="h-7 w-auto" />
              </Link>
              <button
                onClick={toggleMenu}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Location selector for mobile */}
            <div
              className="px-4 py-3 border-b border-gray-100"
              ref={mobileLocationDropdownRef}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLocationDropdown();
                }}
                disabled={authLocationsLoading}
                className={`w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg transition-colors ${
                  authLocationsLoading ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {authLocationsLoading ? (
                    <div className="animate-spin">
                      <Navigation className="h-5 w-5 text-green-600" />
                    </div>
                  ) : (
                    <MapPin className="h-5 w-5 text-green-600" />
                  )}
                  <span className="font-medium truncate flex-1">
                    {currentLocationDisplayName.length > 20
                      ? currentLocationDisplayName.substring(0, 20) + "..."
                      : currentLocationDisplayName}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      locationDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {locationDropdownOpen && (
                <div className="mt-2 bg-white rounded-lg shadow-inner p-2 space-y-1 overflow-y-auto max-h-[200px] border border-gray-100">
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select Location
                  </div>
                  {combinedLocationOptions.map((option, index) => {
                    // Create a unique key for each option
                    const uniqueKey = option.type === LOCATION_TYPE_CURRENT 
                      ? "current_location_mobile" 
                      : `product_mobile_${option.city}_${index}`;
                    
                    // Check if this option is selected
                    const isSelected = selectedLocation && (
                      (option.type === LOCATION_TYPE_CURRENT && selectedLocation.type === LOCATION_TYPE_CURRENT) ||
                      (option.type === LOCATION_TYPE_PRODUCT_BASED && 
                       selectedLocation.type === LOCATION_TYPE_PRODUCT_BASED &&
                       selectedLocation.city?.toLowerCase() === option.city?.toLowerCase())
                    );

                    return (
                      <button
                        key={uniqueKey}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("Mobile location option clicked:", option.name);
                          await handleLocationSelect(option);
                        }}
                        disabled={authLocationsLoading && option.type === LOCATION_TYPE_CURRENT}
                        className={`w-full px-3 py-2.5 text-sm rounded-md flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                        } ${
                          authLocationsLoading && option.type === LOCATION_TYPE_CURRENT
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {option.type === LOCATION_TYPE_CURRENT && (
                            <Navigation className="h-4 w-4" />
                          )}
                          {option.name.length > 20
                            ? option.name.substring(0, 20) + "..."
                            : option.name}
                        </span>
                        {isSelected && (
                          <ChevronRight className="h-4 w-4 text-green-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
              <NavLink
                to="/"
                onClick={toggleMenu}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg text-base font-medium flex items-center gap-3 transition-colors ${
                    isActive
                      ? "bg-green-50 text-green-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                <Home className="h-5 w-5" />
                Home
              </NavLink>

              <NavLink
                to="/shopping"
                onClick={toggleMenu}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg text-base font-medium flex items-center gap-3 transition-colors ${
                    isActive
                      ? "bg-green-50 text-green-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                <Leaf className="h-5 w-5" />
                Products
              </NavLink>

              {isLoggedIn ? (
                <>
                  <div className="border-t border-gray-100 my-2"></div>

                  <NavLink
                    to="/profile"
                    onClick={toggleMenu}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-lg text-base font-medium flex items-center gap-3 transition-colors ${
                        isActive
                          ? "bg-green-50 text-green-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                  >
                    <User className="h-5 w-5" />
                    My Profile
                  </NavLink>

                  <NavLink
                    to="/orders"
                    onClick={toggleMenu}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-lg text-base font-medium flex items-center gap-3 transition-colors ${
                        isActive
                          ? "bg-green-50 text-green-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                  >
                    <ShoppingCart className="h-5 w-5" />
                    My Orders
                  </NavLink>

                  <button
                    onClick={() => {
                      handleLogOut();
                    }}
                    className="px-4 py-3 w-full rounded-lg text-base font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 flex items-center gap-3 justify-center mt-2 transition-all hover:shadow-md"
                  >
                    <LogIn className="h-5 w-5 transform rotate-180" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-100 my-2"></div>

                  <NavLink
                    to="/login"
                    onClick={toggleMenu}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-lg text-base font-medium flex items-center gap-3 transition-colors ${
                        isActive
                          ? "bg-green-50 text-green-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                  >
                    <LogIn className="h-5 w-5" />
                    Login
                  </NavLink>
                  <NavLink
                    to="/vendor/login"
                    onClick={toggleMenu}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-lg text-base font-medium flex items-center gap-3 transition-colors ${
                        isActive
                          ? "bg-green-50 text-green-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                  >
                    <Store className="h-5 w-5" />
                    <span>Vendor Login</span>
                  </NavLink>

                  <NavLink
                    to="/register"
                    onClick={toggleMenu}
                    className="px-4 py-3 rounded-lg text-base font-medium text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 flex items-center gap-3 justify-center mt-2 transition-all hover:shadow-md"
                  >
                    <UserPlus className="h-5 w-5" />
                    Register
                  </NavLink>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-500 flex items-center justify-center">
              © {new Date().getFullYear()} LocalCart
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
