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
import { AuthContext } from "../../Context/Context.jsx"; // Adjust path as necessary
import logo from "/src/assets/logo.svg"; // Adjust path as necessary

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
    LOCATION_TYPE_INITIAL_DEFAULT,
    DEFAULT_FALLBACK_LOCATION,
    hasUserManuallySelectedLocation, // Important for initial display logic
  } = useContext(AuthContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentLocationDisplayName, setCurrentLocationDisplayName] = useState(
    "Loading Location..."
  );
  const [showLocationError, setShowLocationError] = useState(false); // State for location update errors

  // Refs for click outside functionality
  const locationDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const mobileLocationDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null); // Ref for the mobile sidebar itself

  useEffect(() => {
    console.log("Header: availableLocations state:", availableLocations);
  }, [availableLocations])

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
      // If mobile menu is open, its own click-outside handler will take over
      if (menuOpen) return;

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
  }, [menuOpen]); // Dependency on menuOpen to avoid running when mobile menu is active

  // Mobile click outside handlers (for the whole mobile sidebar)
  useEffect(() => {
    const handleMobileClickOutside = (event) => {
      if (!menuOpen) return;

      // Check if the click is outside the mobile menu itself
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
        // Ensure all sub-dropdowns are closed when the main menu closes
        setLocationDropdownOpen(false);
        setUserDropdownOpen(false);
        return; // Click was outside the main mobile menu, no need to check sub-dropdowns
      }

      // If the click was inside the mobile menu but outside the location dropdown (if it's open)
      if (
        locationDropdownOpen &&
        mobileLocationDropdownRef.current &&
        !mobileLocationDropdownRef.current.contains(event.target)
      ) {
        setLocationDropdownOpen(false);
      }
      // Note: No separate mobile user dropdown as it's just part of the main mobile menu list
    };

    if (menuOpen) {
      // Small timeout to allow the menu button's click event to propagate and finish
      // before the global mousedown listener kicks in.
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleMobileClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleMobileClickOutside);
      };
    }
  }, [menuOpen, locationDropdownOpen]); // Dependencies: menuOpen to attach/detach, locationDropdownOpen to re-evaluate

  // Effect to update the display name of the current location in the header button
  useEffect(() => {
    if (authLocationsLoading) {
      setCurrentLocationDisplayName("Locating...");
    } else if (selectedLocation) {
      if (selectedLocation.type === LOCATION_TYPE_CURRENT) {
        // If geolocation successfully resolved to a specific city (not the generic fallback)
        if (selectedLocation.city && selectedLocation.city.toLowerCase() !== DEFAULT_FALLBACK_LOCATION.city.toLowerCase()) {
          const formattedCity = selectedLocation.city.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          setCurrentLocationDisplayName(`Current Location (${formattedCity})`);
        } else if (selectedLocation.name && selectedLocation.name.startsWith("Current Location (Unavailable")) {
          // Explicitly shows unavailable if geolocation failed to get coordinates/city
          setCurrentLocationDisplayName(selectedLocation.name);
        } else {
          // If it's `LOCATION_TYPE_CURRENT` but city is generic (fallback)
          // and the user hasn't explicitly picked a location yet, display "Select Location".
          // Otherwise, if it's the current type, display "Current Location" generically.
          if (selectedLocation.name === DEFAULT_FALLBACK_LOCATION.name && !hasUserManuallySelectedLocation) {
            setCurrentLocationDisplayName("Select Location");
          } else {
            setCurrentLocationDisplayName("Current Location");
          }
        }
      } else if (selectedLocation.type === LOCATION_TYPE_PRODUCT_BASED && selectedLocation.name) {
        // For product-based locations, just use their name
        setCurrentLocationDisplayName(selectedLocation.name);
      } else if (selectedLocation.type === LOCATION_TYPE_INITIAL_DEFAULT) {
        // Explicitly show "Select Location" if it's the very initial default state
        setCurrentLocationDisplayName("Select Location");
      } else {
        // Generic fallback for any other unexpected selectedLocation states
        setCurrentLocationDisplayName("Select Location");
      }
    } else {
      // Very initial state before selectedLocation is even populated or during context loading
      setCurrentLocationDisplayName("Loading Location...");
    }
  }, [selectedLocation, LOCATION_TYPE_CURRENT, DEFAULT_FALLBACK_LOCATION, authLocationsLoading, LOCATION_TYPE_INITIAL_DEFAULT, hasUserManuallySelectedLocation]);


  // Handle location selection from dropdown
  const handleLocationSelect = async (locationData) => {
    // console.log("Header: handleLocationSelect triggered with:", locationData);
    try {
      // Pass true for `isManualSelection` as this comes from user interaction
      await updateUserLocation(locationData, true);
      setLocationDropdownOpen(false); // Close dropdown on selection
      setShowLocationError(false); // Clear any previous error
      if (menuOpen) {
          setMenuOpen(false); // Close mobile menu after selection
      }
    } catch (error) {
      console.error("Failed to update location:", error);
      setShowLocationError(true); // Indicate error to user
      // Optionally, set a timeout to hide the error message after a few seconds
      setTimeout(() => setShowLocationError(false), 5000);
    }
  };

  const navigate = useNavigate();
  const handleLogOut = () => {
    logout();
    setMenuOpen(false); // Close mobile menu
    setUserDropdownOpen(false); // Close user dropdown
    setLocationDropdownOpen(false); // Close location dropdown
    navigate("/");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    // When opening/closing main menu, ensure sub-dropdowns are closed
    setUserDropdownOpen(false);
    setLocationDropdownOpen(false);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
    if (!userDropdownOpen) {
      setLocationDropdownOpen(false); // Close other dropdown if opening this one
    }
  };

  const toggleLocationDropdown = () => {
    setLocationDropdownOpen(!locationDropdownOpen);
    if (!locationDropdownOpen) {
      setUserDropdownOpen(false); // Close other dropdown if opening this one
    }
  };

  // Helper function for NavLink classes
  const navItemClasses = ({ isActive }) =>
    `px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 ${
      isActive
        ? "bg-green-50 text-green-600 font-medium shadow-sm"
        : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
    }`;

  // Generate combined location options for dropdowns, avoiding functional duplicates
  const generateCombinedLocationOptions = () => {
    const options = [];
    const addedCitiesSet = new Set(); // Using a Set to track cities (lowercase) already added to prevent duplicates

    // --- 1. Add "Current Location" as the first option ---
    let currentGeoDisplayName = "Current Location";
    let currentGeoCityForOption = DEFAULT_FALLBACK_LOCATION.city; // Default to generic city for the option

    if (authLocationsLoading) {
      currentGeoDisplayName = "Current Location (Locating...)";
    } else if (selectedLocation?.type === LOCATION_TYPE_CURRENT) {
        // If current location resolved to a specific city and it's not the generic fallback
        if (selectedLocation.city && selectedLocation.city.toLowerCase() !== DEFAULT_FALLBACK_LOCATION.city.toLowerCase()) {
            const formattedCity = selectedLocation.city.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            currentGeoDisplayName = `Current Location (${formattedCity})`;
            currentGeoCityForOption = selectedLocation.city.toLowerCase(); // Use the actual resolved city for this option
            addedCitiesSet.add(currentGeoCityForOption); // Add resolved city to set to prevent product-based duplicates
        } else if (selectedLocation.name && selectedLocation.name.startsWith("Current Location (Unavailable")) {
            currentGeoDisplayName = "Current Location (Unavailable)";
        }
    } else if (selectedLocation?.type === LOCATION_TYPE_INITIAL_DEFAULT) {
        currentGeoDisplayName = "Current Location";
    }

    options.push({
      name: currentGeoDisplayName,
      type: LOCATION_TYPE_CURRENT,
      lat: selectedLocation?.lat, // Pass current lat/lng if available for the option
      lng: selectedLocation?.lng,
      city: currentGeoCityForOption, // Use resolved city or generic fallback city for comparison
    });

    if (Array.isArray(availableLocations)) {
      availableLocations.forEach(loc => {
        const locationCityLower = loc.city?.toLowerCase();

        
        if (
          loc.type === LOCATION_TYPE_PRODUCT_BASED &&
          locationCityLower &&
          !addedCitiesSet.has(locationCityLower)
        ) {
          options.push({
            name: loc.name,
            city: locationCityLower, // Use actual city for product locations
            type: LOCATION_TYPE_PRODUCT_BASED,
            lat: loc.lat,
            lng: loc.lng,
          });
          addedCitiesSet.add(locationCityLower); // Mark this city as added
        }
      });
    }

    // --- 3. Sort product-based options alphabetically by name ---
    // Everything after the first "Current Location" option needs sorting.
    const sortedProductOptions = options.slice(1).sort((a, b) => a.name.localeCompare(b.name));
    return [options[0], ...sortedProductOptions]; // Combine and return
  };

  const combinedLocationOptions = useMemo(generateCombinedLocationOptions, [
    selectedLocation,
    availableLocations,
    LOCATION_TYPE_CURRENT,
    LOCATION_TYPE_PRODUCT_BASED,
    LOCATION_TYPE_INITIAL_DEFAULT,
    DEFAULT_FALLBACK_LOCATION,
    authLocationsLoading, // Added dependency as it affects the display name
    hasUserManuallySelectedLocation, // Added dependency as it affects initial display state
  ]);

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
              setMenuOpen(false); // Close any open mobile menus
              setLocationDropdownOpen(false); // Close desktop dropdowns
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
                aria-haspopup="true" // A11y: Indicates a popup menu
                aria-expanded={locationDropdownOpen} // A11y: Indicates if the popup is expanded
                id="desktop-location-menu-button" // A11y: Unique ID for the button
                aria-controls="desktop-location-menu" // A11y: Links button to menu
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
                <div
                  id="desktop-location-menu" // A11y: Unique ID for the menu
                  role="menu" // A11y: Indicates this is a menu
                  aria-labelledby="desktop-location-menu-button" // A11y: Links menu to its controlling button
                  className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-100 transition-all duration-300 origin-top p-2 overflow-y-auto max-h-[300px]"
                >
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                    Select Location
                  </div>
                  {combinedLocationOptions.map((option, index) => {
                    const uniqueKey = `${option.type}_${option.city || option.name}_${index}`;

                    // Check if this option is currently selected
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
                          e.stopPropagation(); // Prevent dropdown from immediately closing due to event bubbling
                          await handleLocationSelect(option);
                        }}
                        // Disable "Current Location" option if it's currently fetching, otherwise enable normally.
                        disabled={authLocationsLoading && option.type === LOCATION_TYPE_CURRENT}
                        role="menuitem" // A11y: Indicates this is a menu item
                        className={`w-full px-4 py-2.5 text-sm text-left font-medium rounded-md flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                        } ${
                          authLocationsLoading && option.type === LOCATION_TYPE_CURRENT
                            ? "opacity-50 cursor-not-allowed" // Visually indicate disabled state for current location when loading
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
                  {showLocationError && (
                    <p className="text-red-500 text-xs px-4 py-1 mt-2">
                      Failed to update location. Please try again.
                    </p>
                  )}
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
                  aria-haspopup="true" // A11y: Indicates a popup menu
                  aria-expanded={userDropdownOpen} // A11y: Indicates if the popup is expanded
                  id="desktop-user-menu-button" // A11y: Unique ID for the button
                  aria-controls="desktop-user-menu" // A11y: Links button to menu
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
                  id="desktop-user-menu" // A11y: Unique ID for the menu
                  role="menu" // A11y: Indicates this is a menu
                  aria-labelledby="desktop-user-menu-button" // A11y: Links menu to its controlling button
                  className={`absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-100 transition-all duration-300 origin-top p-2 ${
                    userDropdownOpen
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <Link
                    to="/profile"
                    role="menuitem" // A11y: Indicates this is a menu item
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors rounded-md flex items-center gap-2"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <UserCog className="h-5 w-5" />
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    role="menuitem" // A11y: Indicates this is a menu item
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors rounded-md flex items-center gap-2"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogOut}
                    role="menuitem" // A11y: Indicates this is a menu item
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
              onClick={() => setMenuOpen(false)} // Close mobile menu when navigating to cart
            >
              <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:text-green-600" />
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                {cartItems.length}
              </span>
            </NavLink>

            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-colors"
              aria-label="Toggle menu" // A11y: Provides a label for screen readers
              aria-haspopup="true"
              aria-expanded={menuOpen}
              id="mobile-menu-button"
              aria-controls="mobile-sidebar"
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
          onClick={toggleMenu} // Click overlay to close menu
        />

        {/* Mobile menu container */}
        <div
          ref={mobileMenuRef}
          id="mobile-sidebar" // A11y: ID for the sidebar content
          aria-labelledby="mobile-menu-button" // A11y: Links sidebar to its controlling button
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
                onClick={toggleMenu} // Close menu when logo clicked
              >
                <img src={logo} alt="LocalCart Logo" className="h-7 w-auto" />
              </Link>
              <button
                onClick={toggleMenu}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Location selector for mobile */}
            <div
              className="px-4 py-3 border-b border-gray-100"
              ref={mobileLocationDropdownRef} // Ref for click-outside on mobile
            >
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent main menu from closing if button is inside mobile menu
                  toggleLocationDropdown();
                }}
                disabled={authLocationsLoading}
                className={`w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg transition-colors ${
                  authLocationsLoading ? "opacity-75 cursor-not-allowed" : ""
                }`}
                aria-haspopup="true" // A11y
                aria-expanded={locationDropdownOpen} // A11y
                id="mobile-location-menu-button" // A11y
                aria-controls="mobile-location-menu" // A11y
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
                </div>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    locationDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {locationDropdownOpen && (
                <div
                  id="mobile-location-menu" // A11y
                  role="menu" // A11y
                  aria-labelledby="mobile-location-menu-button" // A11y
                  className="mt-2 bg-white rounded-lg shadow-inner p-2 space-y-1 overflow-y-auto max-h-[200px] border border-gray-100"
                >
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select Location
                  </div>
                  {combinedLocationOptions.map((option, index) => {
                    const uniqueKey = `${option.type}_${option.city || option.name}_${index}`;

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
                          e.stopPropagation(); // Prevent dropdown from immediately closing on button click
                          // console.log("Mobile location option clicked:", option.name);
                          await handleLocationSelect(option);
                        }}
                        disabled={authLocationsLoading && option.type === LOCATION_TYPE_CURRENT}
                        role="menuitem" // A11y
                        className={`w-full px-3 py-2.5 text-sm rounded-md flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
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
                   {showLocationError && (
                    <p className="text-red-500 text-xs px-2 py-1 mt-2">
                      Failed to update location.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
              <NavLink
                to="/"
                onClick={toggleMenu} // Close menu on navigation
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
                onClick={toggleMenu} // Close menu on navigation
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
                    onClick={toggleMenu} // Close menu on navigation
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
                    onClick={toggleMenu} // Close menu on navigation
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-lg text-base font-medium flex items-center gap-3 transition-colors ${
                        isActive
                          ? "bg-green-50 text-green-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                  >
                    <ShoppingBag className="h-5 w-5" />
                    My Orders
                  </NavLink>

                  <button
                    onClick={() => {
                      handleLogOut(); // This already handles menu closing
                    }}
                    className="px-4 py-3 w-full rounded-lg text-base font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 flex items-center gap-3 justify-center mt-2 transition-all hover:shadow-md"
                  >
                    <Power className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-100 my-2"></div>

                  <NavLink
                    to="/login"
                    onClick={toggleMenu} // Close menu on navigation
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
                    onClick={toggleMenu} // Close menu on navigation
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
                    onClick={toggleMenu} // Close menu on navigation
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