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
  Heart
} from "lucide-react";
import { AuthContext } from "../../Context/Context.jsx";
import { useLocation } from "../../LocationContext/LocationContext.jsx";
import logo from "/src/assets/logo.svg";
import { toast } from "react-toastify";

const Header = () => {
  // Authentication-related states/methods from AuthContext
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

  // Handle scroll effect with improved threshold
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  // Enhanced desktop click outside handlers
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

  // Enhanced mobile click outside handlers
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

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setLocationDropdownOpen(false);
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update location display name with better formatting
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
          setCurrentLocationDisplayName(` ${formattedCity}`);
          break;

        case LOCATION_TYPE_IP:
          setCurrentLocationDisplayName(
            `📍 ${selectedLocation.name || "Approximate Location"}`
          );
          break;

        case LOCATION_TYPE_MANUAL:
          setCurrentLocationDisplayName(` ${selectedLocation.name}`);
          break;

        case LOCATION_TYPE_DEFAULT:
          setCurrentLocationDisplayName(` ${selectedLocation.name}`);
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
          console.warn("Skipping malformed location object:", loc);
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
      name: detectingGps ? "Detecting your location..." : "📍 Current Location",
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
    toast.success("Logged out successfully");
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
        ? "bg-green-50 text-green-600 font-medium shadow-sm border border-green-100"
        : "text-gray-700 hover:bg-gray-50 hover:text-green-600 hover:shadow-sm"
    }`;

  // Calculate counts safely
  const wishlistCount = wishlistItems?.length || 0;
  const cartCount = cartItems?.length || 0;

  return (
    <>
      {/* Enhanced backdrop overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-all duration-300 ease-out"
          onClick={toggleMenu}
          aria-label="Close menu"
        />
      )}

      <nav
        className={`bg-white/95 backdrop-blur-lg border-b fixed border-gray-100 top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "shadow-xl bg-white/98" : "shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 text-2xl font-bold text-green-600 hover:text-green-700 transition-all duration-300 hover:scale-105"
              onClick={() => {
                setMenuOpen(false);
                setLocationDropdownOpen(false);
                setUserDropdownOpen(false);
              }}
            >
              <img
                src={logo}
                alt="LocalCart Logo"
                className="h-12 w-auto min-w-[48px] min-h-[48px] drop-shadow-sm"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Location Dropdown */}
              <div className="relative mr-2" ref={locationDropdownRef}>
                <button
                  onClick={toggleLocationDropdown}
                  disabled={locationsLoading}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                    locationDropdownOpen
                      ? "bg-green-50 text-green-600 shadow-md border border-green-100"
                      : "hover:bg-gray-50 text-gray-700 hover:text-green-600 hover:shadow-sm"
                  } ${locationsLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                  aria-haspopup="true"
                  aria-expanded={locationDropdownOpen}
                >
                  {locationsLoading ? (
                    <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
                  ) : (
                    <MapPin className="h-5 w-5 text-green-600" />
                  )}
                  <span className="max-w-[140px] truncate font-medium">
                    {currentLocationDisplayName}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      locationDropdownOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                {locationDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 transition-all duration-300 origin-top animate-in slide-in-from-top-2">
                    <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1 bg-gray-50 rounded-t-xl">
                      Select Location
                    </div>
                    <div className="max-h-[320px] overflow-y-auto px-2">
                      {generateCombinedLocationOptions.map((option) => (
                        <button
                          key={`${option.type}_${option.city}`}
                          onClick={() => handleLocationSelect(option)}
                          disabled={detectingGps && option.type === LOCATION_TYPE_GPS}
                          className={`w-full px-3 py-3 text-sm text-left font-medium rounded-lg flex items-center justify-between transition-all duration-200 my-1 ${
                            selectedLocation?.type === option.type &&
                            selectedLocation?.city?.toLowerCase() === option.city?.toLowerCase()
                              ? "bg-green-50 text-green-600 shadow-sm border border-green-100"
                              : "text-gray-700 hover:bg-green-50 hover:text-green-600 hover:shadow-sm"
                          } ${
                            detectingGps && option.type === LOCATION_TYPE_GPS
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            {option.type === LOCATION_TYPE_GPS ? (
                              detectingGps ? (
                                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                              ) : (
                                <Navigation className="h-4 w-4 text-green-600" />
                              )
                            ) : (
                              <MapPin className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="truncate">{option.name}</span>
                          </span>
                          {selectedLocation?.type === option.type &&
                            selectedLocation?.city?.toLowerCase() === option.city?.toLowerCase() && (
                              <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse"></div>
                            )}
                        </button>
                      ))}
                    </div>
                    {showLocationError && (
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <p className="text-red-500 text-xs px-4 py-1 bg-red-50 rounded-lg mx-2">
                          ⚠️ Failed to update location. Please try again.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <NavLink to="/" className={navItemClasses}>
                <Home className="h-5 w-5" />
                <span>Home</span>
              </NavLink>

              <NavLink to="/shopping" className={navItemClasses}>
                <Leaf className="h-5 w-5" />
                <span>Products</span>
              </NavLink>

              {/* User Authentication Section */}
              {isLoggedIn ? (
                <div className="relative ml-1" ref={userDropdownRef}>
                  <button
                    onClick={toggleUserDropdown}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                      userDropdownOpen
                        ? "bg-green-50 text-green-600 shadow-md border border-green-100"
                        : "hover:bg-gray-50 text-gray-700 hover:text-green-600 hover:shadow-sm"
                    }`}
                    aria-haspopup="true"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-medium">
                      {user?.name ? `Hi, ${user.name.split(" ")[0]}` : "Account"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        userDropdownOpen ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 transition-all duration-300 origin-top ${
                      userDropdownOpen
                        ? "opacity-100 scale-100 animate-in slide-in-from-top-2"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all duration-200 rounded-lg mx-2 flex items-center gap-3"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <UserCog className="h-4 w-4" />
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all duration-200 rounded-lg mx-2 flex items-center gap-3"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      My Orders
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={handleLogOut}
                      className="w-full px-4 py-3 text-sm bg-red-50 rounded-lg text-red-600 font-medium hover:bg-red-100 transition-all duration-200 flex items-center justify-center gap-3 "
                    >
                      <Power className="h-4 w-4" />
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
                    className="ml-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center gap-2"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Register</span>
                  </NavLink>

                  <NavLink to="/vendor/login" className={navItemClasses}>
                    <Store className="h-5 w-5" />
                    <span>Vendor</span>
                  </NavLink>
                </>
              )}

              {/* Cart Icon (Desktop) */}
              <NavLink
                to="/cart"
                className="ml-2 p-3 rounded-lg relative hover:bg-gray-50 transition-all duration-300 group hover:shadow-sm"
              >
                <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:text-green-600 transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-sm">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </NavLink>

              {/* Wishlist Icon (Desktop) */}
              <NavLink
                to="/wishlist"
                className="p-3 rounded-lg relative hover:bg-gray-50 transition-all duration-300 group hover:shadow-sm"
              >
                <Heart className="h-5 w-5 text-gray-700 group-hover:text-red-500 transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-sm">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </NavLink>
            </div>

            {/* Mobile Header Icons and Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <NavLink
                to="/cart"
                className="p-2 rounded-lg relative hover:bg-gray-50 transition-all duration-300 group"
                onClick={() => setMenuOpen(false)}
              >
                <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:text-green-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </NavLink>

              {/* Mobile Wishlist Icon */}
              <NavLink
                to="/wishlist"
                className="p-2 rounded-lg relative hover:bg-gray-50 transition-all duration-300 group"
                onClick={() => setMenuOpen(false)}
              >
                <Heart className="h-5 w-5 text-gray-700 group-hover:text-red-500 transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </NavLink>

              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-all duration-300 hover:shadow-sm"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <X className="h-6 w-6 transform transition-transform duration-300 rotate-90" />
                ) : (
                  <Menu className="h-6 w-6 transform transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        <div
          ref={mobileMenuRef}
          className={`md:hidden fixed right-0 top-0 h-screen w-80 max-w-[90vw] bg-white shadow-2xl transform transition-all duration-500 ease-in-out z-50 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Mobile Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50">
              <Link
                to="/"
                className="flex items-center gap-2 text-xl font-bold text-green-600"
                onClick={toggleMenu}
              >
                <img src={logo} alt="LocalCart Logo" className="h-8 w-auto" />
                
              </Link>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-full text-gray-500 hover:bg-white hover:text-green-600 transition-all duration-300 shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Location Selector */}
            <div
              className="px-4 py-4 border-b border-gray-100 bg-gray-50/50"
              ref={mobileLocationDropdownRef}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLocationDropdown();
                }}
                disabled={locationsLoading}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm transition-all duration-300 border ${
                  locationDropdownOpen ? "border-green-200 shadow-md" : "border-gray-200"
                } ${locationsLoading ? "opacity-75 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-3">
                  {locationsLoading ? (
                    <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
                  ) : (
                    <MapPin className="h-5 w-5 text-green-600" />
                  )}
                  <span className="font-medium truncate flex-1 text-left">
                    {currentLocationDisplayName.length > 22
                      ? currentLocationDisplayName.substring(0, 22) + "..."
                      : currentLocationDisplayName}
                  </span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 transition-transform duration-300 ${
                    locationDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {locationDropdownOpen && (
                <div className="mt-3 bg-white rounded-xl shadow-lg p-2 space-y-1 overflow-y-auto max-h-[240px] border border-gray-100">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Select Location
                  </div>
                  {generateCombinedLocationOptions.map((option) => (
                    <button
                      key={`${option.type}_${option.city}`}
                      onClick={() => handleLocationSelect(option)}
                      disabled={detectingGps && option.type === LOCATION_TYPE_GPS}
                      className={`w-full px-3 py-3 text-sm rounded-lg flex items-center justify-between transition-all duration-200 ${
                        selectedLocation?.type === option.type &&
                        selectedLocation?.city?.toLowerCase() === option.city?.toLowerCase()
                          ? "bg-green-50 text-green-600 shadow-sm border border-green-100"
                          : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                      } ${
                        detectingGps && option.type === LOCATION_TYPE_GPS
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {option.type === LOCATION_TYPE_GPS ? (
                          detectingGps ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Navigation className="h-4 w-4" />
                          )
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        <span className="truncate">
                          {option.name.length > 20
                            ? option.name.substring(0, 20) + "..."
                            : option.name}
                        </span>
                      </span>
                      {selectedLocation?.type === option.type &&
                        selectedLocation?.city?.toLowerCase() === option.city?.toLowerCase() && (
<ChevronRight className="h-4 w-4 text-green-500" />
                        )}
                    </button>
                  ))}
                  {showLocationError && (
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <p className="text-red-500 text-xs px-3 py-1 bg-red-50 rounded-lg">
                        ⚠️ Failed to update location. Please try again.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Navigation Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-6 space-y-3">
                {/* Home Link */}
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-green-50 text-green-600 font-semibold shadow-sm border border-green-100"
                        : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                    }`
                  }
                  onClick={toggleMenu}
                >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </NavLink>

                {/* Products Link */}
                <NavLink
                  to="/shopping"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-green-50 text-green-600 font-semibold shadow-sm border border-green-100"
                        : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                    }`
                  }
                  onClick={toggleMenu}
                >
                  <Leaf className="h-5 w-5" />
                  <span>Products</span>
                </NavLink>

                {/* Cart Link */}
                <NavLink
                  to="/cart"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                      isActive
                        ? "bg-green-50 text-green-600 font-semibold shadow-sm border border-green-100"
                        : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                    }`
                  }
                  onClick={toggleMenu}
                >
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </div>
                  <span>Shopping Cart</span>
                  {cartCount > 0 && (
                    <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </NavLink>

                {/* Wishlist Link */}
                <NavLink
                  to="/wishlist"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                      isActive
                        ? "bg-red-50 text-red-600 font-semibold shadow-sm border border-red-100"
                        : "text-gray-700 hover:bg-gray-50 hover:text-red-600"
                    }`
                  }
                  onClick={toggleMenu}
                >
                  <div className="relative">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </span>
                    )}
                  </div>
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </NavLink>

                {/* Divider */}
                <hr className="border-gray-200 my-4" />

                {/* Authentication Section */}
                {isLoggedIn ? (
                  <div className="space-y-3">
                    {/* User Welcome */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-sm">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user?.name ? `Hi, ${user.name.split(" ")[0]}!` : "Welcome!"}
                        </p>
                        <p className="text-xs text-gray-600">
                          {user?.email || "Manage your account"}
                        </p>
                      </div>
                    </div>

                    {/* Profile Link */}
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-blue-50 text-blue-600 font-semibold shadow-sm border border-blue-100"
                            : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        }`
                      }
                      onClick={toggleMenu}
                    >
                      <UserCog className="h-5 w-5" />
                      <span>My Profile</span>
                    </NavLink>

                    {/* Orders Link */}
                    <NavLink
                      to="/orders"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-blue-50 text-blue-600 font-semibold shadow-sm border border-blue-100"
                            : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        }`
                      }
                      onClick={toggleMenu}
                    >
                      <ShoppingBag className="h-5 w-5" />
                      <span>My Orders</span>
                    </NavLink>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-all duration-300 border border-red-100"
                    >
                      <Power className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Login Link */}
                    <NavLink
                      to="/login"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-green-50 text-green-600 font-semibold shadow-sm border border-green-100"
                            : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                        }`
                      }
                      onClick={toggleMenu}
                    >
                      <LogIn className="h-5 w-5" />
                      <span>Login</span>
                    </NavLink>

                    {/* Register Link */}
                    <NavLink
                      to="/register"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-md"
                      onClick={toggleMenu}
                    >
                      <UserPlus className="h-5 w-5" />
                      <span>Create Account</span>
                    </NavLink>

                    {/* Vendor Login Link */}
                    <NavLink
                      to="/vendor/login"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-purple-50 text-purple-600 font-semibold shadow-sm border border-purple-100"
                            : "text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                        }`
                      }
                      onClick={toggleMenu}
                    >
                      <Store className="h-5 w-5" />
                      <span>Vendor Login</span>
                    </NavLink>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Footer */}
            <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/50">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span>© 2024 LocalCart</span>
                <span>•</span>
                <span>Made with ❤️</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;