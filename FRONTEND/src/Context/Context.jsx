// src/Context/AuthContext.js

import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// Note: 'react-toastify/dist/ReactToastify.css' should ideally be imported once in main.jsx
// or at the top-level of your application to prevent potential conflicts.

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  console.log("AuthContext: AuthProvider rendering...");

  // Keeping 'user' and 'setUser' for now to avoid breaking existing components
  // that might still directly use them (e.g., UserProfile.jsx, as per error logs).
  // Ideally, components should migrate to use 'auth.user' and functions like login/logout.
  const [user, setUser] = useState(() => {
    let storedUser = null;
    try {
      // Check for user in any role
      const adminInfoJson = localStorage.getItem("adminInfo");
      const vendorInfoJson = localStorage.getItem("vendorInfo");
      const userJson = localStorage.getItem("user");

      if (adminInfoJson) {
        storedUser = JSON.parse(adminInfoJson);
      } else if (vendorInfoJson) {
        storedUser = JSON.parse(vendorInfoJson);
      } else if (userJson) {
        storedUser = JSON.parse(userJson);
      }
    } catch (e) {
      console.error("AuthContext: Error parsing user from localStorage in setUser init:", e);
      // Clean up potentially corrupt data
      localStorage.removeItem("user");
      localStorage.removeItem("adminInfo");
      localStorage.removeItem("vendorInfo");
      storedUser = null;
    }
    return storedUser;
  });

  const [auth, setAuth] = useState(() => {
    let storedUser = null;
    let storedToken = null;
    let isAuthLoading = true;
    try {
      // Prioritize admin, then vendor, then regular user
      const adminInfoJson = localStorage.getItem("adminInfo");
      const adminTokenVal = localStorage.getItem("adminToken");
      const vendorInfoJson = localStorage.getItem("vendorInfo");
      const vendorTokenVal = localStorage.getItem("vendorToken");
      const userJson = localStorage.getItem("user");
      const tokenVal = localStorage.getItem("token");

      if (adminInfoJson && adminTokenVal) {
        storedUser = JSON.parse(adminInfoJson);
        storedToken = adminTokenVal;
      } else if (vendorInfoJson && vendorTokenVal) {
        storedUser = JSON.parse(vendorInfoJson);
        storedToken = vendorTokenVal;
      } else if (userJson && tokenVal) {
        storedUser = JSON.parse(userJson);
        storedToken = tokenVal;
      }
      isAuthLoading = false;
    } catch (e) {
      console.error(
        "AuthContext: Error parsing auth data from localStorage on init:",
        e
      );
      // Clear all auth-related localStorage items if any parsing error occurs
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("adminInfo");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("vendorInfo");
      localStorage.removeItem("vendorToken");
      isAuthLoading = false;
    }
    return {
      user: storedUser,
      token: storedToken,
      isAuthLoading: isAuthLoading,
      authError: null,
    };
  });

  const currentRole = useMemo(() => auth.user?.role || null, [auth.user]);
  const isLoggedIn = useMemo(() => !!auth.token && !!auth.user, [auth.token, auth.user]);
  const isAdmin = useMemo(() => auth.user?.role === "admin", [auth.user]);
  const isVendor = useMemo(() => auth.user?.role === "vendor", [auth.user]);

  const [isOpen, setIsOpen] = useState(false);

  // --- START: Location & Cart related constants & states (UNCHANGED logic, but fixed bugs) ---
  const USER_LOCATION_KEY = "user_preferred_location_v2";
  const LOCATIONS_CACHE_KEY = "available_locations_cache";
  const CACHE_DURATION = 5 * 60 * 1000;
  const GEOLOCATION_TIMEOUT = 10000;
  const REVERSE_GEOCODE_TIMEOUT = 5000;

  const LOCATION_TYPE_CURRENT = "current_location";
  const LOCATION_TYPE_PRODUCT_BASED = "product_location";
  const LOCATION_TYPE_INITIAL_DEFAULT = "initial_default";

  const DEFAULT_FALLBACK_LOCATION = useMemo(() => ({
    name: "Mumbai, Maharashtra",
    city: "mumbai",
    lat: 19.076,
    lng: 72.8777,
    type: LOCATION_TYPE_INITIAL_DEFAULT,
  }), [LOCATION_TYPE_INITIAL_DEFAULT]);

  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const storedLocation = localStorage.getItem(USER_LOCATION_KEY);
      if (storedLocation) {
        const parsedLocation = JSON.parse(storedLocation);
        if (parsedLocation && typeof parsedLocation.city === 'string' && typeof parsedLocation.name === 'string') {
          console.log("AuthContext: Loaded selectedLocation from localStorage.", parsedLocation.name);
          // If it was previously 'current_location', update name to show detection message
          if (parsedLocation.type === LOCATION_TYPE_CURRENT && (parsedLocation.lat === null || parsedLocation.lng === null)) {
            return {
              ...parsedLocation,
              name: "Detecting current location...",
            };
          }
          return parsedLocation;
        }
      }
    } catch (e) {
      console.error("AuthContext: Error parsing user_preferred_location_v2 from localStorage:", e);
      localStorage.removeItem(USER_LOCATION_KEY);
    }
    console.log("AuthContext: Initializing selectedLocation to DEFAULT_FALLBACK_LOCATION.");
    return { ...DEFAULT_FALLBACK_LOCATION };
  });

  const [availableLocations, setAvailableLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const initialLocationSetupRef = useRef(false);
  const uiFeedbackTimeoutRef = useRef(null);

  const [hasUserManuallySelectedLocation, setHasUserManuallySelectedLocation] = useState(() => {
    try {
      const storedLocation = localStorage.getItem(USER_LOCATION_KEY);
      if (storedLocation) {
        const parsedLocation = JSON.parse(storedLocation);
        // A location is manually selected if it's not the initial default AND not a freshly detected current location
        return (parsedLocation.city.toLowerCase() !== DEFAULT_FALLBACK_LOCATION.city.toLowerCase() &&
                parsedLocation.type !== LOCATION_TYPE_INITIAL_DEFAULT) ||
               (parsedLocation.type === LOCATION_TYPE_CURRENT && typeof parsedLocation.lat === 'number');
      }
    } catch (e) {
      console.error("AuthContext: Error reading hasUserManuallySelectedLocation from localStorage:", e);
    }
    return false;
  });

  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const CART_STORAGE_KEY = "user_cart_items";
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.error(
        "AuthContext: Error parsing cart items from localStorage on init:",
        e
      );
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error(
        "AuthContext: Failed to save cart items to localStorage:",
        e
      );
    }
  }, [cartItems, CART_STORAGE_KEY]);

  const addToCart = useCallback(
    (productId, quantity = 1) => {
      const product = products.find((p) => p._id === productId);
      if (!product) {
        toast.error("Product is currently unavailable or not found.");
        return;
      }
      setCartItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex((item) => item._id === productId);
        if (existingItemIndex !== -1) {
          const updatedItems = [...prevItems];
          const currentQuantity = updatedItems[existingItemIndex].quantity || 0;
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: currentQuantity + quantity,
          };
          toast.success(`${product.name} quantity updated in cart!`);
          return updatedItems;
        } else {
          const newItem = { ...product, quantity };
          toast.success(`${product.name} added to cart!`);
          return [...prevItems, newItem];
        }
      });
    },
    [products]
  );

  const updateCartItemQuantity = useCallback((productId, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
    toast.info("Cart item quantity updated.");
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== productId));
    toast.info("Item removed from cart.");
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    toast.info("Cart cleared.");
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const quantity = item.quantity || 1;
      return total + item.price * quantity;
    }, 0);
  }, [cartItems]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), REVERSE_GEOCODE_TIMEOUT);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        { signal: controller.signal }
      );
      clearTimeout(id);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county;
      const display = data.display_name;

      if (city) return city;
      if (display) {
        const parts = display.split(',');
        return parts.length > 1 ? parts[1].trim() : parts[0].trim();
      }

      return "Unknown Location";
    } catch (error) {
      console.error("AuthContext: Error in reverse geocoding:", error);
      if (error.name === 'AbortError') {
        toast.warn("Reverse geocoding timed out. Displayed location might be less precise.");
      } else {
        toast.warn("Could not determine precise location name.");
      }
      return "Current Location";
    }
  }, [REVERSE_GEOCODE_TIMEOUT]);

  const getCurrentGeolocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        toast.error("Geolocation is not supported by your browser.", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            type: LOCATION_TYPE_CURRENT,
          });
        },
        (error) => {
          let errorMessage = "Failed to get current location.";
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location access denied. Please enable it in your browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Location information is unavailable. Try again or check device settings.";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Timed out trying to get your location. Please check your signal or try again.";
          }
          reject(new Error(errorMessage));
          toast.error(errorMessage, {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: GEOLOCATION_TIMEOUT,
          maximumAge: 60000,
        }
      );
    });
  }, [GEOLOCATION_TIMEOUT, LOCATION_TYPE_CURRENT]);

  const getCachedLocations = useCallback(() => {
    try {
      const cached = localStorage.getItem(LOCATIONS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Check if data is an array before checking length
        if (Array.isArray(data) && Date.now() - timestamp < CACHE_DURATION) {
          console.log("AuthContext: Using cached available locations.");
          return data;
        }
        console.log("AuthContext: Cached available locations expired or invalid, clearing.");
        localStorage.removeItem(LOCATIONS_CACHE_KEY);
      }
    } catch (e) {
      console.error("AuthContext: Error parsing cached locations:", e);
      localStorage.removeItem(LOCATIONS_CACHE_KEY);
    }
    return null;
  }, [CACHE_DURATION, LOCATIONS_CACHE_KEY]);

  const setCachedLocations = useCallback((locations) => {
    try {
      localStorage.setItem(
        LOCATIONS_CACHE_KEY,
        JSON.stringify({
          data: locations,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.error("AuthContext: Failed to cache locations:", e);
    }
  }, [LOCATIONS_CACHE_KEY]);

  const fetchAvailableLocations = useCallback(async () => {
    setLocationsLoading(true);
    let successToastShown = false;

    // A timeout promise, slightly shorter than overall operation
    const apiTimeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Loading available cities timed out."));
      }, 10000); // 10 seconds timeout for API
    });


    const cachedLocations = getCachedLocations();
    if (Array.isArray(cachedLocations) && cachedLocations.length > 0) {
      setAvailableLocations([
        {
          name: "Current Location",
          city: "current_location",
          lat: null,
          lng: null,
          type: LOCATION_TYPE_CURRENT,
        },
        ...cachedLocations,
      ]);
      setLocationsLoading(false);
      console.log("AuthContext: Using cached available locations, count:", cachedLocations.length);
      toast.success("Using cached locations!", { autoClose: 1500 });
      return;
    }

    try {
      console.log("AuthContext: Attempting to fetch available locations from API...");
      const response = await Promise.race([
        axios.get(`${import.meta.env.VITE_API_URL}/api/locations`),
        apiTimeoutPromise // Race with the timeout
      ]);

      const apiData = response.data?.data?.locations;
      console.log("AuthContext: Raw API response data.locations:", apiData);

      if (response.data?.status === "success" && Array.isArray(apiData)) {
        const formattedLocations = apiData
          .filter(loc => loc && typeof loc.name === 'string' && loc.name.trim() !== '' && typeof loc.city === 'string' && loc.city.trim() !== '')
          .map((loc) => ({
            name: loc.name.charAt(0).toUpperCase() + loc.name.slice(1),
            city: loc.city.toLowerCase(),
            lat: loc.lat,
            lng: loc.lng,
            type: LOCATION_TYPE_PRODUCT_BASED,
          }));

        setCachedLocations(formattedLocations);
        setAvailableLocations([
          {
            name: "Current Location",
            city: "current_location",
            lat: null,
            lng: null,
            type: LOCATION_TYPE_CURRENT,
          },
          ...formattedLocations,
        ]);
        console.log("AuthContext: Available locations fetched from API, formatted count:", formattedLocations.length);
        if (!successToastShown) {
          toast.success("Available cities loaded successfully!", { autoClose: 2000, position: "top-right" });
          successToastShown = true;
        }
      } else {
        console.warn("AuthContext: API did not return expected location data for available cities:", response.data);
        setAvailableLocations([]);
        toast.error("Could not load available cities. API response invalid or empty.");
      }
    } catch (error) {
      console.error("AuthContext: Failed to load available locations during API call:", error);
      if (error.message === "Loading available cities timed out.") {
        toast.error("Failed to load available cities. Request timed out.");
      } else {
        toast.error(error.message || "Failed to load available cities. Please refresh or check your internet.");
      }
      setAvailableLocations([]);
    } finally {
      setLocationsLoading(false);
      console.log("AuthContext: fetchAvailableLocations finished.");
    }
  }, [getCachedLocations, setCachedLocations, LOCATION_TYPE_CURRENT, LOCATION_TYPE_PRODUCT_BASED]);

  const fetchAllProducts = useCallback(
    async (location) => {
      if (!location || !location.city ||
        (location.type === LOCATION_TYPE_INITIAL_DEFAULT && location.city.toLowerCase() === DEFAULT_FALLBACK_LOCATION.city.toLowerCase()) ||
        (location.type === LOCATION_TYPE_CURRENT && (typeof location.lat !== "number" || typeof location.lng !== "number"))) {
        console.log("AuthContext: Skipping product fetch. Location is not fully resolved, invalid, or is the initial fallback state.", location);
        setProducts([]);
        setProductsLoading(false);
        return;
      }

      setProductsLoading(true);
      setProductsError(null);

      try {
        let apiUrl = `${import.meta.env.VITE_API_URL}/api/products`;
        const params = {};

        if (location.type === LOCATION_TYPE_CURRENT && typeof location.lat === "number" && typeof location.lng === "number") {
          apiUrl = `${import.meta.env.VITE_API_URL}/api/products/nearby`;
          params.lat = location.lat;
          params.lng = location.lng;
          params.distance = 10; // Default distance, adjust as needed
          console.log(`AuthContext: Fetching nearby products for (${location.lat}, ${location.lng})`);
        }
        else if (location.city) {
          params.city = location.city;
          console.log(`AuthContext: Fetching products for city: ${location.city}`);
        } else {
          console.warn("AuthContext: Ambiguous location for product fetch, showing general products. Location:", location);
        }

        const response = await axios.get(apiUrl, { params }); // Using general axios as products are public

        if (response.data?.status === "success" && Array.isArray(response.data?.data?.products)) {
          setProducts(response.data.data.products);
          console.log(`AuthContext: Products fetched successfully. Count: ${response.data.data.products.length}`);
          if (response.data.data.products.length === 0) {
            toast.warn("No products found for this location.");
          }
        } else {
          setProducts([]);
          toast.warn("No products found for this location.");
          console.log("AuthContext: API returned no products or invalid data.");
        }
      } catch (error) {
        console.error("AuthContext: Error fetching products:", error);
        setProductsError(error.message || "Failed to fetch products.");
        toast.error("Failed to load products for this location. Please try again.");
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    },
    [LOCATION_TYPE_CURRENT, LOCATION_TYPE_INITIAL_DEFAULT, DEFAULT_FALLBACK_LOCATION]
  );


  const updateUserLocation = useCallback(async (locationObj) => {
    console.log("AuthContext: updateUserLocation called with:", locationObj);
    if (!locationObj || !locationObj.city) {
      console.warn("AuthContext: Invalid location object passed to updateUserLocation.");
      toast.error("Invalid location selected.");
      return;
    }

    let finalLocation = { ...locationObj };

    // If "Current Location" is selected from dropdown, re-run geolocation to get fresh coords
    if (locationObj.type === LOCATION_TYPE_CURRENT && (typeof locationObj.lat !== 'number' || typeof locationObj.lng !== 'number')) {
      console.log("AuthContext: User selected 'Current Location' from dropdown, re-running geolocation...");
      setSelectedLocation(prev => ({
        ...prev,
        name: "Detecting current location...", // Update dropdown text
        city: "detecting...",
        lat: null,
        lng: null,
      }));
      try {
        const coords = await getCurrentGeolocation();
        const cityName = await reverseGeocode(coords.lat, coords.lng);
        finalLocation = {
          ...coords,
          name: `Current Location (${cityName})`,
          city: cityName.toLowerCase(),
          type: LOCATION_TYPE_CURRENT,
        };
        toast.success("Your current location has been updated!");
        setHasUserManuallySelectedLocation(true); // Mark as user-determined location
      } catch (geoError) {
        console.error("AuthContext: Failed to re-detect current location after user selection:", geoError);
        toast.error(geoError.message || "Failed to get current location. Please try selecting a city.");
        finalLocation = { ...DEFAULT_FALLBACK_LOCATION }; // Fallback to default on failure
        setHasUserManuallySelectedLocation(false); // Reset if detection failed
      }
    } else if (locationObj.type !== LOCATION_TYPE_CURRENT && locationObj.type !== LOCATION_TYPE_INITIAL_DEFAULT) {
      setHasUserManuallySelectedLocation(true); // Any non-current, non-default choice counts as manual
      toast.success(`Location set to ${locationObj.name}!`);
    } else if (locationObj.type === LOCATION_TYPE_INITIAL_DEFAULT) {
      setHasUserManuallySelectedLocation(false); // Reset if explicitly selecting the initial default
    }

    localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(finalLocation));
    setSelectedLocation(finalLocation);
    console.log("AuthContext: Selected location updated to:", finalLocation);
  }, [getCurrentGeolocation, reverseGeocode, DEFAULT_FALLBACK_LOCATION, USER_LOCATION_KEY, LOCATION_TYPE_CURRENT, LOCATION_TYPE_INITIAL_DEFAULT]);
  // --- END: Location & Cart related constants & states ---

  // New helper function to update auth state and localStorage consistently
  const updateAuthLocalStorageAndState = useCallback((token, user, role) => {
    // Clear all existing auth-related items first to ensure single active session
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorInfo");

    if (token && user) {
      if (role === "admin") {
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminInfo", JSON.stringify(user));
      } else if (role === "vendor") {
        localStorage.setItem("vendorToken", token);
        localStorage.setItem("vendorInfo", JSON.stringify(user));
      } else { // Default to regular user
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      }
      setAuth({ user, token, isAuthLoading: false, authError: null });
      setUser(user); // Keep setUser updated to support legacy components
    } else {
      setAuth({ user: null, token: null, isAuthLoading: false, authError: null });
      setUser(null); // Keep setUser updated to support legacy components
    }
  }, []);

  const logoutRef = useRef(null); // Used for interceptor

  // Consolidated logout function
  const logout = useCallback(() => {
    try {
      updateAuthLocalStorageAndState(null, null, null); // Clears all auth local storage
      localStorage.removeItem(USER_LOCATION_KEY); // Also clear non-auth specific user data
      localStorage.removeItem(CART_STORAGE_KEY); // Also clear non-auth specific user data

      // Reset states related to user session but not directly auth
      setSelectedLocation({ ...DEFAULT_FALLBACK_LOCATION });
      setProducts([]);
      setCartItems([]);
      setHasUserManuallySelectedLocation(false);
      toast.info("Logged out successfully!");
      navigate("/");
    } catch (e) {
      console.error("AuthContext: Error during logout process:", e);
      toast.error("An error occurred during logout.");
    }
  }, [navigate, USER_LOCATION_KEY, CART_STORAGE_KEY, DEFAULT_FALLBACK_LOCATION, updateAuthLocalStorageAndState]);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const authAxios = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      withCredentials: true,
    });

    instance.interceptors.request.use(
      (config) => {
        let activeToken = null;
        // Prioritize admin, then vendor, then regular user token for outgoing requests
        if (localStorage.getItem("adminToken")) {
          activeToken = localStorage.getItem("adminToken");
        } else if (localStorage.getItem("vendorToken")) {
          activeToken = localStorage.getItem("vendorToken");
        } else if (localStorage.getItem("token")) {
          activeToken = localStorage.getItem("token");
        }

        if (activeToken) {
          config.headers.Authorization = `Bearer ${activeToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Check if the current path is *not* a login/register page
          if (
            !window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/register") &&
            !window.location.pathname.includes("/admin/login") &&
            !window.location.pathname.includes("/vendor/login")
          ) {
            logoutRef.current(); // Use the ref to call logout
            toast.error("Your session has expired. Please log in again.");
          }
        }
        return Promise.reject(error);
      }
    );
    return instance;
  }, []);

  // Login/Registration functions using the new helper
  const register = useCallback(async (userData) => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true, authError: null }));
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, userData);
      const { token, user, message } = response.data;
      if (token && user) {
        updateAuthLocalStorageAndState(token, user, user.role); // Assuming user object contains role
        toast.success("Registration successful!");
        return { success: true, message: "Registration successful!", user: user, token: token };
      } else {
        const errorMessage = message || "Registration failed: Missing token or user data in response.";
        setAuth((prev) => ({ ...prev, authError: errorMessage }));
        toast.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Registration failed.";
      setAuth((prev) => ({ ...prev, authError: errorMessage }));
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setAuth((prev) => ({ ...prev, isAuthLoading: false }));
    }
  }, [updateAuthLocalStorageAndState]);

  const login = useCallback(async (credentials) => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true, authError: null }));
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, credentials, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      const { success, token, user, message } = response.data;
      if (success && token && user) {
        updateAuthLocalStorageAndState(token, user, user.role); // Assuming user object contains role
        toast.success("Login successful!");
        return { success: true, user };
      } else {
        const errorMessage = message || "Login failed.";
        setAuth((prev) => ({ ...prev, authError: errorMessage }));
        toast.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (err) {
      let errorMessage = "Login failed. Please try again.";
      if (err.response) {
        errorMessage = err.response.data.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      setAuth((prev) => ({ ...prev, authError: errorMessage }));
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setAuth((prev) => ({ ...prev, isAuthLoading: false }));
    }
  }, [updateAuthLocalStorageAndState]);

  const adminLogin = useCallback(async (credentials) => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true, authError: null }));
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/login`, credentials, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      const { success, token, user, message } = response.data;
      if (success && token && user) {
        updateAuthLocalStorageAndState(token, user, "admin");
        toast.success("Admin Login successful!");
        return { success: true, admin: user };
      } else {
        const errorMessage = message || "Admin login failed.";
        setAuth((prev) => ({ ...prev, authError: errorMessage }));
        toast.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (err) {
      let errorMessage = "Admin login failed. Please try again.";
      if (err.response) {
        errorMessage = err.response.data.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      setAuth((prev) => ({ ...prev, authError: errorMessage }));
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setAuth((prev) => ({ ...prev, isAuthLoading: false }));
    }
  }, [updateAuthLocalStorageAndState]);

  const vendorLogin = useCallback(async (credentials) => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true, authError: null }));
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/vendor/login`, credentials, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      const { token, user, message } = response.data;
      if (token && user) {
        updateAuthLocalStorageAndState(token, user, "vendor");
        toast.success("Vendor Login successful!");
        return { success: true, vendor: user, message: message || "Vendor Login successful!" };
      } else {
        const errorMessage = message || "Vendor login failed: Missing token or user data in response.";
        setAuth((prev) => ({ ...prev, authError: errorMessage }));
        toast.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (err) {
      let errorMessage = "Vendor login failed. Please try again.";
      if (err.response) {
        errorMessage = err.response.data.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      setAuth((prev) => ({ ...prev, authError: errorMessage }));
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setAuth((prev) => ({ ...prev, isAuthLoading: false }));
    }
  }, [updateAuthLocalStorageAndState]);

  const vendorRegister = useCallback(async (userData) => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true, authError: null }));
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/vendor/register`, userData);
      const { token, user, message } = response.data;
      if (token && user) {
        updateAuthLocalStorageAndState(token, user, "vendor");
        return { success: true, message: message || "Vendor account created successfully!", user: user, token: token };
      } else {
        const errorMessage = message || "Vendor registration failed: Missing token or user data in response.";
        setAuth((prev) => ({ ...prev, authError: errorMessage }));
        toast.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Vendor registration failed.";
      setAuth((prev) => ({ ...prev, authError: errorMessage }));
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setAuth((prev) => ({ ...prev, isAuthLoading: false }));
    }
  }, [updateAuthLocalStorageAndState]);

  // Simplified admin/vendor sign-out using the consolidated logout
  const adminSignOut = useCallback(() => {
    logout(); // Calls the central logout
    navigate("/admin/login");
    toast.info("Admin logged out.");
  }, [logout, navigate]);

  const vendorSignOut = useCallback(() => {
    logout(); // Calls the central logout
    navigate("/vendor/login");
    toast.info("Vendor logged out.");
  }, [logout, navigate]);


  // Refactored useEffect for initial auth load and storage changes
  useEffect(() => {
    const initializeAuthFromStorage = () => {
      let storedUser = null;
      let storedToken = null;
      try {
        const adminInfoJson = localStorage.getItem("adminInfo");
        const adminTokenVal = localStorage.getItem("adminToken");
        const vendorInfoJson = localStorage.getItem("vendorInfo");
        const vendorTokenVal = localStorage.getItem("vendorToken");
        const userJson = localStorage.getItem("user");
        const tokenVal = localStorage.getItem("token");

        if (adminInfoJson && adminTokenVal) {
          storedUser = JSON.parse(adminInfoJson);
          storedToken = adminTokenVal;
          // Clear other roles if admin is active
          localStorage.removeItem("vendorInfo");
          localStorage.removeItem("vendorToken");
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        } else if (vendorInfoJson && vendorTokenVal) {
          storedUser = JSON.parse(vendorInfoJson);
          storedToken = vendorTokenVal;
          // Clear other roles if vendor is active
          localStorage.removeItem("adminInfo");
          localStorage.removeItem("adminToken");
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        } else if (userJson && tokenVal) {
          storedUser = JSON.parse(userJson);
          storedToken = tokenVal;
          // Clear other roles if regular user is active
          localStorage.removeItem("adminInfo");
          localStorage.removeItem("adminToken");
          localStorage.removeItem("vendorInfo");
          localStorage.removeItem("vendorToken");
        }
      } catch (e) {
        console.error("AuthContext: Error parsing auth data from localStorage on init/storage change:", e);
        // Clear all auth-related localStorage items if any parsing error occurs
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("adminInfo");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("vendorInfo");
        localStorage.removeItem("vendorToken");
        storedUser = null;
        storedToken = null;
      }
      setAuth((prev) => ({
        ...prev,
        user: storedUser,
        token: storedToken,
        isAuthLoading: false,
      }));
      setUser(storedUser); // Ensure the independent 'user' state is also updated
    };

    initializeAuthFromStorage(); // Run once on component mount

    const handleStorageChange = (e) => {
      // Only re-initialize auth if an auth-related key changed
      if (
        [
          "user", "token", "adminInfo", "adminToken", "vendorInfo", "vendorToken"
        ].includes(e.key) || e.key === null // e.key === null signifies a localStorage.clear()
      ) {
        console.log(`AuthContext: Storage key changed: ${e.key}. Re-initializing auth.`);
        initializeAuthFromStorage();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []); // Depend on nothing to run once for listener setup


  // --- START: Location & Product related Effects (fixed minor bugs) ---
  useEffect(() => {
    if (initialLocationSetupRef.current || auth.isAuthLoading) {
      console.log("AuthContext: Skipping initial location setup. Already run or auth loading.");
      return;
    }

    const setupInitialLocation = async () => {
      initialLocationSetupRef.current = true;
      setLocationsLoading(true);

      await fetchAvailableLocations();

      let userLoc = { ...DEFAULT_FALLBACK_LOCATION };
      let loadedFromStorage = false;

      const savedLoc = localStorage.getItem(USER_LOCATION_KEY);
      if (savedLoc) {
        try {
          const parsedSavedLoc = JSON.parse(savedLoc);
          if (parsedSavedLoc && typeof parsedSavedLoc.city === 'string') {
            userLoc = parsedSavedLoc;
            loadedFromStorage = true;
            console.log("AuthContext: Initial setup loaded location from localStorage:", userLoc.name);
          }
        } catch (e) {
          console.error("AuthContext: Failed to parse saved location from localStorage during initial setup:", e);
          localStorage.removeItem(USER_LOCATION_KEY);
        }
      }

      if (!loadedFromStorage || userLoc.type === LOCATION_TYPE_INITIAL_DEFAULT || (userLoc.type === LOCATION_TYPE_CURRENT && (userLoc.lat === null || userLoc.lng === null))) {
        console.log("AuthContext: Attempting to get current geolocation for initial setup.");
        try {
          const coords = await getCurrentGeolocation();
          const cityName = await reverseGeocode(coords.lat, coords.lng);
          userLoc = {
            ...coords,
            name: `Current Location (${cityName})`,
            city: cityName.toLowerCase(),
            type: LOCATION_TYPE_CURRENT,
          };
          setHasUserManuallySelectedLocation(true);
        } catch (geoError) {
          console.warn("AuthContext: Geolocation failed on initial load:", geoError.message);
          // Only fallback to default if we didn't already have a valid stored location that wasn't CURRENT
          if (!loadedFromStorage || userLoc.type === LOCATION_TYPE_CURRENT) { // If loaded from storage but it was an incomplete CURRENT or INITIAL_DEFAULT, force fallback
            userLoc = {
              ...DEFAULT_FALLBACK_LOCATION,
              name: `Select Your Location or Use Current (${DEFAULT_FALLBACK_LOCATION.name})`,
              type: LOCATION_TYPE_INITIAL_DEFAULT,
            };
            setHasUserManuallySelectedLocation(false);
            // Show toast only if the location is indeed the initial default and not a subsequent re-render
            if (selectedLocation.type === LOCATION_TYPE_INITIAL_DEFAULT) {
              toast.info("Welcome! Please select your location to see relevant products.", { position: "top-center", autoClose: 5000 });
            }
          }
        }
      } else if (userLoc.type === LOCATION_TYPE_PRODUCT_BASED || (userLoc.type === LOCATION_TYPE_CURRENT && typeof userLoc.lat === 'number')) {
        setHasUserManuallySelectedLocation(true);
        console.log("AuthContext: Initial setup confirmed product-based or valid current location:", userLoc.name);
      }

      const areLocationsEffectivelySame = (loc1, loc2) => {
        if (!loc1 || !loc2) return false;
        if (loc1.type === LOCATION_TYPE_CURRENT && loc2.type === LOCATION_TYPE_CURRENT) {
          const latDiff = Math.abs(loc1.lat - loc2.lat);
          const lngDiff = Math.abs(loc1.lng - loc2.lng);
          // Using a small epsilon for float comparison
          return latDiff < 0.0001 && lngDiff < 0.0001 && loc1.city === loc2.city;
        }
        return loc1.type === loc2.type && loc1.city === loc2.city;
      };

      if (!areLocationsEffectivelySame(selectedLocation, userLoc)) {
        localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
        setSelectedLocation(userLoc);
      } else {
        console.log("AuthContext: Initial setup determined selectedLocation is already effectively set, skipping setSelectedLocation.");
      }

      setLocationsLoading(false);
    };

    // Delay initial setup slightly to allow initial renders to complete, preventing race conditions
    const timeoutId = setTimeout(setupInitialLocation, 100);

    return () => clearTimeout(timeoutId);
  }, [
    auth.isAuthLoading,
    getCurrentGeolocation,
    reverseGeocode,
    fetchAvailableLocations,
    DEFAULT_FALLBACK_LOCATION,
    USER_LOCATION_KEY,
    LOCATION_TYPE_CURRENT,
    LOCATION_TYPE_PRODUCT_BASED,
    LOCATION_TYPE_INITIAL_DEFAULT,
    selectedLocation
  ]);

  useEffect(() => {
    console.log("AuthContext: selectedLocation or locationsLoading changed, evaluating product fetch.", { selectedLocation, locationsLoading });

    if (locationsLoading) {
      console.log("AuthContext: Locations still loading/processing, skipping product fetch.");
      setProducts([]);
      setProductsLoading(true);
      return;
    }

    if (!selectedLocation || !selectedLocation.city) {
      console.log("AuthContext: selectedLocation is invalid (null or missing city), clearing products.");
      setProducts([]);
      setProductsLoading(false);
      return;
    }

    // Corrected logic for fetching products based on location type
    if (selectedLocation.type === LOCATION_TYPE_CURRENT) {
      if (typeof selectedLocation.lat === "number" && typeof selectedLocation.lng === "number") {
        console.log("AuthContext: selectedLocation (CURRENT with coords) ready, triggering fetchAllProducts (nearby).");
        fetchAllProducts(selectedLocation);
      } else {
        console.log("AuthContext: selectedLocation (CURRENT, but no coords yet), skipping immediate product fetch. Products cleared.");
        setProducts([]);
        setProductsLoading(false);
      }
    } else if (selectedLocation.type === LOCATION_TYPE_PRODUCT_BASED || selectedLocation.type === LOCATION_TYPE_INITIAL_DEFAULT) {
      console.log("AuthContext: selectedLocation (CITY/DEFAULT) ready, triggering fetchAllProducts (by city).");
      fetchAllProducts(selectedLocation);
    } else {
      console.warn("AuthContext: selectedLocation is in an unhandled type state, clearing products.", selectedLocation);
      setProducts([]);
      setProductsLoading(false);
    }
  }, [selectedLocation, fetchAllProducts, LOCATION_TYPE_CURRENT, LOCATION_TYPE_PRODUCT_BASED, LOCATION_TYPE_INITIAL_DEFAULT, locationsLoading, DEFAULT_FALLBACK_LOCATION]);


  useEffect(() => {
    return () => {
      if (uiFeedbackTimeoutRef.current) {
        clearTimeout(uiFeedbackTimeoutRef.current);
      }
    };
  }, []);
  // --- END: Location & Product related Effects ---

  const contextValue = useMemo(() => ({
    auth,
    setAuth,
    currentRole,
    isLoggedIn,
    isAdmin,
    isVendor,
    register,
    login,
    adminLogin,
    vendorLogin,
    vendorRegister,
    logout,
    adminSignOut,
    vendorSignOut,

    isOpen,
    setIsOpen,
    setUser, // Explicitly included for backward compatibility
    user,    // Explicitly included for backward compatibility

    // Location & Product related values
    selectedLocation,
    updateUserLocation,
    availableLocations,
    locationsLoading,
    hasUserManuallySelectedLocation,

    LOCATION_TYPE_CURRENT,
    LOCATION_TYPE_PRODUCT_BASED,
    LOCATION_TYPE_INITIAL_DEFAULT,
    DEFAULT_FALLBACK_LOCATION,

    products,
    productsLoading,
    productsError,
    fetchAllProducts, // Ensure this is explicitly included

    cartItems,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,

    authAxios,
  }), [
    auth, currentRole, isLoggedIn, isAdmin, isVendor,
    register, login, adminLogin, vendorLogin, vendorRegister, logout, adminSignOut, vendorSignOut,
    isOpen, setIsOpen,
    setUser, user, // Dependencies for the included 'user' state
    selectedLocation, updateUserLocation, availableLocations, locationsLoading, hasUserManuallySelectedLocation,
    products, productsLoading, productsError, fetchAllProducts, // fetchAllProducts dependency
    cartItems, addToCart, updateCartItemQuantity, removeFromCart, clearCart, getCartTotal,
    authAxios,
    LOCATION_TYPE_CURRENT, LOCATION_TYPE_PRODUCT_BASED, LOCATION_TYPE_INITIAL_DEFAULT, DEFAULT_FALLBACK_LOCATION
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;