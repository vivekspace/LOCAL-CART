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
  Loader2,
  Heart // Ensure Heart icon is imported
} from "lucide-react";
import { AuthContext } from "../../Context/Context.jsx";
import { useLocation } from "../../LocationContext/LocationContext.jsx";
import logo from "/src/assets/logo.svg";
import { toast } from "react-toastify";

const Header = () => {
  // Authentication-related states/methods from AuthContext
  // Added wishlistItems from AuthContext
  const { cartItems, logout, isLoggedIn, user, wishlistItems } = useContext(AuthContext);

  // Location-related states/methods from LocationContext via useLocation hook
  const {
    selectedLocation,
    updateUserLocation,
    availableLocations,
    locationsLoading,
    LOCATION_TYPE_IP,
    LOCATION_TYPE_GPS,
    LOCATION_TYPE_MANUAL,
    LOCATION_TYPE_DEFAULT,
    detectGpsLocation,
    ipLocation,
  } = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentLocationDisplayName, setCurrentLocationDisplayName] = useState(
    "Loading Location..."
  );
  const [showLocationError, setShowLocationError] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

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

  // Close dropdowns when menu closes
  useEffect(() => {
    if (!menuOpen) {
      setLocationDropdownOpen(false);
      setUserDropdownOpen(false);
    }
  }, [menuOpen]);

  // Desktop click outside handlers
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

  // Update location display name
  useEffect(() => {
    if (locationsLoading) {
      setCurrentLocationDisplayName("Locating...");
    } else if (!selectedLocation) {
      setCurrentLocationDisplayName("Select Location");
    } else {
      switch (selectedLocation.type) {
        case LOCATION_TYPE_GPS:
          const formattedCity =
            selectedLocation.city && typeof selectedLocation.city === "string"
              ? selectedLocation.city
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")
              : "Current Location";
          setCurrentLocationDisplayName(`Current Location (${formattedCity})`);
          break;

        case LOCATION_TYPE_IP:
          setCurrentLocationDisplayName(
            selectedLocation.name || "Approximate Location"
          );
          break;

        case LOCATION_TYPE_MANUAL:
          setCurrentLocationDisplayName(selectedLocation.name);
          break;

        case LOCATION_TYPE_DEFAULT:
          setCurrentLocationDisplayName(selectedLocation.name);
          break;

        default:
          setCurrentLocationDisplayName("Select Location");
      }
    }
  }, [
    selectedLocation,
    locationsLoading,
    LOCATION_TYPE_GPS,
    LOCATION_TYPE_IP,
    LOCATION_TYPE_MANUAL,
    LOCATION_TYPE_DEFAULT,
  ]);

  const handleLocationSelect = async (locationData) => {
    try {
      let locationToSet = locationData;

      if (locationData.type === LOCATION_TYPE_GPS) {
        setDetectingGps(true);
        try {
          const gpsLocation = await detectGpsLocation();
          locationToSet = gpsLocation;
        } catch (error) {
          console.error("GPS location failed:", error);
          toast.error(error.message);

          if (ipLocation) {
            locationToSet = ipLocation;
            toast.info("Using approximate location instead");
          } else {
            throw error;
          }
        } finally {
          setDetectingGps(false);
        }
      }

      await updateUserLocation(locationToSet);
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

 const generateCombinedLocationOptions = useMemo(() => {
    const uniqueManualLocations = new Map();

    if (Array.isArray(availableLocations)) {
      availableLocations.forEach((loc) => {
        if (!loc || typeof loc !== 'object' || !loc.city || typeof loc.name !== 'string') {
            console.warn("Skipping malformed location object (missing name/city after context processing):", loc);
            return;
        }

        const locationCityLower = loc.city.toLowerCase();

        if (!uniqueManualLocations.has(locationCityLower)) {
          uniqueManualLocations.set(locationCityLower, {
            name: loc.name,
            city: locationCityLower,
            type: LOCATION_TYPE_MANUAL,
            lat: loc.lat,
            lng: loc.lng,
          });
        }
      });
    }

    const sortedManualLocations = Array.from(uniqueManualLocations.values()).sort((a, b) => {
      if (typeof a.name === 'string' && typeof b.name === 'string') {
        return a.name.localeCompare(b.name);
      }
      if (typeof a.name !== 'string' && typeof b.name !== 'string') return 0;
      if (typeof a.name !== 'string') return 1;
      if (typeof b.name !== 'string') return -1;
      return 0;
    });

    const currentLocationOption = {
      name: detectingGps ? "Detecting your location..." : "Current Location",
      type: LOCATION_TYPE_GPS,
      lat: selectedLocation?.lat,
      lng: selectedLocation?.lng,
      city: "current_location",
    };

    return [currentLocationOption, ...sortedManualLocations];
  }, [
    availableLocations,
    selectedLocation,
    detectingGps,
    LOCATION_TYPE_GPS,
    LOCATION_TYPE_MANUAL
  ]);

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

  // Calculate wishlist count
  const wishlistCount = wishlistItems ? wishlistItems.length : 0;

  return (
    <nav
      className={`bg-white/95 backdrop-blur-lg border-b border-gray-100  top-0 left-0 right-0 z-50 transition-all duration-300 ${
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
            <img
              src={logo}
              alt="LocalCart Logo"
              className="h-12 w-auto min-w-[48px] min-h-[48px]"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <div className="relative mr-2" ref={locationDropdownRef}>
              <button
                onClick={toggleLocationDropdown}
                disabled={locationsLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                  locationDropdownOpen
                    ? "bg-green-50 text-green-600"
                    : "hover:bg-gray-50 text-gray-700 hover:text-green-600"
                } ${locationsLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                aria-haspopup="true"
                aria-expanded={locationDropdownOpen}
              >
                {locationsLoading ? (
                  <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
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
                  {generateCombinedLocationOptions.map((option) => (
                    <button
                      key={`${option.type}_${option.city}`}
                      onClick={() => handleLocationSelect(option)}
                      disabled={
                        detectingGps && option.type === LOCATION_TYPE_GPS
                      }
                      className={`w-full px-4 py-2.5 text-sm text-left font-medium rounded-md flex items-center justify-between transition-colors ${
                        selectedLocation?.type === option.type &&
                        selectedLocation?.city?.toLowerCase() ===
                          option.city?.toLowerCase()
                          ? "bg-green-50 text-green-600"
                          : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                      } ${
                        detectingGps && option.type === LOCATION_TYPE_GPS
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {option.type === LOCATION_TYPE_GPS ? (
                          detectingGps ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Navigation className="h-4 w-4" />
                          )
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        {option.name}
                      </span>
                      {selectedLocation?.type === option.type &&
                        selectedLocation?.city?.toLowerCase() ===
                          option.city?.toLowerCase() && (
                          <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></span>
                        )}
                    </button>
                  ))}
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
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <User className="h-5 w-5" />
                  </div>
                  <span>
                    {user?.name ? `Hi, ${user.name.split(" ")[0]}` : "Account"}
                  </span>
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

            {/* Cart Icon (Desktop) */}
            <NavLink
              to="/cart"
              className="ml-2 p-2 rounded-lg relative hover:bg-gray-50 transition-colors group"
            >
              <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:text-green-600 transition-colors" />
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                {cartItems.length}
              </span>
            </NavLink>

            {/* Wishlist Icon (Desktop) */}
            <NavLink
              to="/wishlist"
              className="p-2 rounded-lg relative hover:bg-gray-50 transition-colors group"
            >
              <Heart className="h-5 w-5 text-gray-700 group-hover:text-red-500 transition-colors" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  {wishlistCount}
                </span>
              )}
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

            {/* Mobile Wishlist Icon */}
            <NavLink
              to="/wishlist"
              className="p-2 rounded-lg relative hover:bg-gray-50 transition-colors group"
              onClick={() => setMenuOpen(false)} // Close menu when navigating
            >
              <Heart className="h-5 w-5 text-gray-700 group-hover:text-red-500 transition-colors" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  {wishlistCount}
                </span>
              )}
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

      {/* Mobile menu */}
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

        <div
          ref={mobileMenuRef}
          className={`absolute right-0 top-0 h-screen w-80 bg-white shadow-xl transform transition-transform duration-500 ease-in-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
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

            <div
              className="px-4 py-3 border-b border-gray-100"
              ref={mobileLocationDropdownRef}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLocationDropdown();
                }}
                disabled={locationsLoading}
                className={`w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg transition-colors ${
                  locationsLoading ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {locationsLoading ? (
                    <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
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
                <div className="mt-2 bg-white rounded-lg shadow-inner p-2 space-y-1 overflow-y-auto max-h-[200px] border border-gray-100">
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select Location
                  </div>
                  {generateCombinedLocationOptions.map((option) => (
                    <button
                      key={`${option.type}_${option.city}`}
                      onClick={() => handleLocationSelect(option)}
                      disabled={
                        detectingGps && option.type === LOCATION_TYPE_GPS
                      }
                      className={`w-full px-3 py-2.5 text-sm rounded-md flex items-center justify-between transition-colors ${
                        selectedLocation?.type === option.type &&
                        selectedLocation?.city?.toLowerCase() ===
                          option.city?.toLowerCase()
                          ? "bg-green-50 text-green-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                      } ${
                        detectingGps && option.type === LOCATION_TYPE_GPS
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {option.type === LOCATION_TYPE_GPS ? (
                          detectingGps ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Navigation className="h-4 w-4" />
                          )
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        {option.name.length > 20
                          ? option.name.substring(0, 20) + "..."
                          : option.name}
                      </span>
                      {selectedLocation?.type === option.type &&
                        selectedLocation?.city?.toLowerCase() ===
                          option.city?.toLowerCase() && (
                          <ChevronRight className="h-4 w-4 text-green-500" />
                        )}
                    </button>
                  ))}
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

              {/* Mobile Wishlist Link */}
              <NavLink
                to="/wishlist"
                onClick={toggleMenu}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg text-base font-medium flex items-center gap-3 transition-colors relative ${
                    isActive
                      ? "bg-green-50 text-green-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                <Heart className="h-5 w-5" />
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="absolute right-3 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
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
                    onClick={handleLogOut}
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
