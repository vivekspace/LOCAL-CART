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
    availableLocations, 
    locationsLoading: authLocationsLoading,
    LOCATION_TYPE_CURRENT,
    LOCATION_TYPE_PRODUCT_BASED,
    LOCATION_TYPE_INITIAL_DEFAULT,
    DEFAULT_FALLBACK_LOCATION,
    hasUserManuallySelectedLocation, 
  } = useContext(AuthContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentLocationDisplayName, setCurrentLocationDisplayName] = useState(
    "Loading Location..."
  );
  const [showLocationError, setShowLocationError] = useState(false); 

  const locationDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const mobileLocationDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null); 


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      setLocationDropdownOpen(false);
      setUserDropdownOpen(false);
    }
  }, [menuOpen]);

  useEffect(() => {
    const handleDesktopClickOutside = (event) => {
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
  }, [menuOpen]); 

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
  useEffect(() => {
    if (authLocationsLoading) {
      setCurrentLocationDisplayName("Locating...");
    } else if (selectedLocation) {
      if (selectedLocation.type === LOCATION_TYPE_CURRENT) {
        if (selectedLocation.city && selectedLocation.city.toLowerCase() !== DEFAULT_FALLBACK_LOCATION.city.toLowerCase()) {
          const formattedCity = selectedLocation.city.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          setCurrentLocationDisplayName(`Current Location (${formattedCity})`);
        } else if (selectedLocation.name && selectedLocation.name.startsWith("Current Location (Unavailable")) {
          setCurrentLocationDisplayName(selectedLocation.name);
        } else {
          
          if (selectedLocation.name === DEFAULT_FALLBACK_LOCATION.name && !hasUserManuallySelectedLocation) {
            setCurrentLocationDisplayName("Select Location");
          } else {
            setCurrentLocationDisplayName("Current Location");
          }
        }
      } else if (selectedLocation.type === LOCATION_TYPE_PRODUCT_BASED && selectedLocation.name) {
        setCurrentLocationDisplayName(selectedLocation.name);
      } else if (selectedLocation.type === LOCATION_TYPE_INITIAL_DEFAULT) {
        setCurrentLocationDisplayName("Select Location");
      } else {
        setCurrentLocationDisplayName("Select Location");
      }
    } else {
      setCurrentLocationDisplayName("Loading Location...");
    }
  }, [selectedLocation, LOCATION_TYPE_CURRENT, DEFAULT_FALLBACK_LOCATION, authLocationsLoading, LOCATION_TYPE_INITIAL_DEFAULT, hasUserManuallySelectedLocation]);


  const handleLocationSelect = async (locationData) => {
    try {
      await updateUserLocation(locationData, true);
      setLocationDropdownOpen(false); 
      setShowLocationError(false); 
      if (menuOpen) {
          setMenuOpen(false); 
      }
    } catch (error) {
      console.error("Failed to update location:", error);
      setShowLocationError(true); 
      setTimeout(() => setShowLocationError(false), 5000);
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

  const generateCombinedLocationOptions = () => {
    const options = [];
    const addedCitiesSet = new Set(); 

    let currentGeoDisplayName = "Current Location";
    let currentGeoCityForOption = DEFAULT_FALLBACK_LOCATION.city; 

    if (authLocationsLoading) {
      currentGeoDisplayName = "Current Location (Locating...)";
    } else if (selectedLocation?.type === LOCATION_TYPE_CURRENT) {
        if (selectedLocation.city && selectedLocation.city.toLowerCase() !== DEFAULT_FALLBACK_LOCATION.city.toLowerCase()) {
            const formattedCity = selectedLocation.city.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            currentGeoDisplayName = `Current Location (${formattedCity})`;
            currentGeoCityForOption = selectedLocation.city.toLowerCase(); 
            addedCitiesSet.add(currentGeoCityForOption);
        } else if (selectedLocation.name && selectedLocation.name.startsWith("Current Location (Unavailable")) {
            currentGeoDisplayName = "Current Location (Unavailable)";
        }
    } else if (selectedLocation?.type === LOCATION_TYPE_INITIAL_DEFAULT) {
        currentGeoDisplayName = "Current Location";
    }

    options.push({
      name: currentGeoDisplayName,
      type: LOCATION_TYPE_CURRENT,
      lat: selectedLocation?.lat, 
      lng: selectedLocation?.lng,
      city: currentGeoCityForOption, 
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
            city: locationCityLower, 
            type: LOCATION_TYPE_PRODUCT_BASED,
            lat: loc.lat,
            lng: loc.lng,
          });
          addedCitiesSet.add(locationCityLower); 
        }
      });
    }

   
    const sortedProductOptions = options.slice(1).sort((a, b) => a.name.localeCompare(b.name));
    return [options[0], ...sortedProductOptions]; 
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

          <div className="hidden md:flex items-center space-x-1">
            <div className="relative mr-2" ref={locationDropdownRef}>
              <button
                onClick={toggleLocationDropdown}
                disabled={authLocationsLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                  locationDropdownOpen
                    ? "bg-green-50 text-green-600"
                    : "hover:bg-gray-50 text-gray-700 hover:text-green-600"
                } ${authLocationsLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                aria-haspopup="true"
                aria-expanded={locationDropdownOpen} 
                id="desktop-location-menu-button"
                aria-controls="desktop-location-menu" 
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
                  id="desktop-location-menu" 
                  role="menu" 
                  aria-labelledby="desktop-location-menu-button" 
                  className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-100 transition-all duration-300 origin-top p-2 overflow-y-auto max-h-[300px]"
                >
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
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
                          e.stopPropagation(); 
                          await handleLocationSelect(option);
                        }}
                        disabled={authLocationsLoading && option.type === LOCATION_TYPE_CURRENT}
                        role="menuitem" 
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
                  aria-haspopup="true"
                  aria-expanded={userDropdownOpen}
                  id="desktop-user-menu-button"
                  aria-controls="desktop-user-menu"
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
                  id="desktop-user-menu"
                  role="menu"
                  aria-labelledby="desktop-user-menu-button"
                  className={`absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-100 transition-all duration-300 origin-top p-2 ${
                    userDropdownOpen
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <Link
                    to="/profile"
                    role="menuitem" 
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors rounded-md flex items-center gap-2"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <UserCog className="h-5 w-5" />
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    role="menuitem"
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors rounded-md flex items-center gap-2"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogOut}
                    role="menuitem" 
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
              onClick={() => setMenuOpen(false)} 
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

      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-500 ease-in-out ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-500 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={toggleMenu} 
        />

        {/* Mobile menu container */}
        <div
          ref={mobileMenuRef}
          id="mobile-sidebar"
          aria-labelledby="mobile-menu-button"
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
                aria-label="Close menu"
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
                aria-haspopup="true"
                aria-expanded={locationDropdownOpen}
                id="mobile-location-menu-button"
                aria-controls="mobile-location-menu"
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
                  id="mobile-location-menu"
                  role="menu"
                  aria-labelledby="mobile-location-menu-button"
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
                          e.stopPropagation(); 
                          await handleLocationSelect(option);
                        }}
                        disabled={authLocationsLoading && option.type === LOCATION_TYPE_CURRENT}
                        role="menuitem" 
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
                    <ShoppingBag className="h-5 w-5" />
                    My Orders
                  </NavLink>

                  <button
                    onClick={() => {
                      handleLogOut(); 
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