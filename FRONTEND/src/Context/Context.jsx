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

// Create the AuthContext
export const AuthContext = createContext(null);

// Custom Hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// AuthProvider Component
const AuthProvider = ({ children }) => {
  console.log("AuthContext: AuthProvider rendering...");

  // --- Authentication States ---
  const [auth, setAuth] = useState(() => {
    // Initialize auth state from localStorage on first render
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
      } else if (vendorInfoJson && vendorTokenVal) {
        storedUser = JSON.parse(vendorInfoJson);
        storedToken = vendorTokenVal;
      } else if (userJson && tokenVal) {
        storedUser = JSON.parse(userJson);
        storedToken = tokenVal;
      }
    } catch (e) {
      console.error(
        "AuthContext: Error parsing auth data from localStorage on init:",
        e
      );
      localStorage.clear(); // Clear all if parsing fails
    }
    return {
      user: storedUser,
      token: storedToken,
      isAuthLoading: true,
      authError: null,
    };
  });

  // Derived authentication states using useMemo for optimization
  const currentRole = useMemo(() => auth.user?.role || null, [auth.user]);
  const isLoggedIn = useMemo(
    () => !!auth.token && !!auth.user,
    [auth.token, auth.user]
  );
  const isAdmin = useMemo(() => auth.user?.role === "admin", [auth.user]);
  const isVendor = useMemo(() => auth.user?.role === "vendor", [auth.user]);

  // --- UI States ---
  const [isOpen, setIsOpen] = useState(false);

  // --- Location Constants & States ---
  const USER_LOCATION_KEY = "user_preferred_location_v2";
  const LOCATIONS_CACHE_KEY = "available_locations_cache";
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const LOCATION_TYPE_CURRENT = "current_location";
  const LOCATION_TYPE_PRODUCT_BASED = "product_location";
  const CART_STORAGE_KEY = "user_cart_items";
  const LOCATION_FETCH_TIMEOUT = 10000; // 10 seconds timeout for location operations

  const DEFAULT_FALLBACK_LOCATION = {
    name: "Mumbai, Maharashtra",
    city: "mumbai",
    lat: 19.076,
    lng: 72.8777,
    type: "default_fallback",
  };

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const initialLocationSetupRef = useRef(false);
  const locationFetchTimeoutRef = useRef(null);

  const navigate = useNavigate();

  // --- Product States and Functions ---
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  // --- Cart Management States and Functions ---
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

  // Effect to save cart items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error(
        "AuthContext: Failed to save cart items to localStorage:",
        e
      );
    }
  }, [cartItems]);

  // Cart operations
  const addToCart = useCallback(
    (productId, quantity = 1) => {
      const product = products.find((p) => p._id === productId);
      if (!product) {
        toast.error("Product is currently unavailable or not found.");
        return;
      }

      setCartItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex(
          (item) => item._id === productId
        );

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

  // --- Logout Function and Ref for Interceptor ---
  const logoutRef = useRef(null);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
      localStorage.removeItem("vendorToken");
      localStorage.removeItem("vendorInfo");
      localStorage.removeItem(USER_LOCATION_KEY);
      localStorage.removeItem(CART_STORAGE_KEY);

      setAuth({
        user: null,
        token: null,
        isAuthLoading: false,
        authError: null,
      });
      setSelectedLocation(null);
      setProducts([]);
      setCartItems([]);
      toast.info("Logged out successfully!");
      navigate("/");
    } catch (e) {
      console.error("AuthContext: Error during logout process:", e);
      toast.error("An error occurred during logout.");
    }
  }, [navigate]);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // --- Axios Instance Setup ---
  const authAxios = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      withCredentials: true,
    });

    instance.interceptors.request.use(
      (config) => {
        let activeToken = null;
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
          if (
            !window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/register") &&
            !window.location.pathname.includes("/admin/login") &&
            !window.location.pathname.includes("/vendor/login")
          ) {
            logoutRef.current();
            toast.error("Your session has expired. Please log in again.");
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []);

  // --- Location Utility Functions ---
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      return (
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        data.display_name ||
        "Unknown Location"
      );
    } catch (error) {
      console.error("AuthContext: Error in reverse geocoding:", error);
      return "Current Location";
    }
  }, []);

  const getCurrentGeolocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      // Set timeout for geolocation
      const timeoutId = setTimeout(() => {
        reject(new Error("Geolocation request timed out."));
      }, LOCATION_FETCH_TIMEOUT);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            type: LOCATION_TYPE_CURRENT,
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          let errorMessage = "Failed to get current location.";
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location access denied. Please enable it in your browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Location information is unavailable. Try again or check device settings.";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Timed out trying to get your location. Please check your signal or try again.";
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: LOCATION_FETCH_TIMEOUT,
          maximumAge: 60000,
        }
      );
    });
  }, [LOCATION_FETCH_TIMEOUT, LOCATION_TYPE_CURRENT]);

  // --- Cache Utilities ---
  const getCachedLocations = useCallback(() => {
    try {
      const cached = localStorage.getItem(LOCATIONS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
        localStorage.removeItem(LOCATIONS_CACHE_KEY);
      }
    } catch (e) {
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
    
    const cachedLocations = getCachedLocations();
    if (cachedLocations) {
      setAvailableLocations([
        {
          name: "Current Location",
          city: "current location",
          lat: null,
          lng: null,
          type: LOCATION_TYPE_CURRENT,
        },
        ...cachedLocations,
      ]);
      setLocationsLoading(false);
      return;
    }

    try {
      const response = await authAxios.get(`${import.meta.env.VITE_API_URL}/api/locations`);
      const apiLocations = response.data?.data?.locations;

      if (response.data?.status === "success" && Array.isArray(apiLocations)) {
        const formattedLocations = apiLocations.map((city) => ({
          name: city.charAt(0).toUpperCase() + city.slice(1),
          city: city.toLowerCase(),
          lat: null,
          lng: null,
          type: LOCATION_TYPE_PRODUCT_BASED,
        }));

        setCachedLocations(formattedLocations);
        setAvailableLocations([
          {
            name: "Current Location",
            city: "current location",
            lat: null,
            lng: null,
            type: LOCATION_TYPE_CURRENT,
          },
          ...formattedLocations,
        ]);
      }
    } catch (error) {
      console.error("AuthContext: Failed to load available locations:", error);
      toast.error("Failed to load available cities.");
    } finally {
      setLocationsLoading(false);
    }
  }, [authAxios, getCachedLocations, setCachedLocations, LOCATION_TYPE_CURRENT, LOCATION_TYPE_PRODUCT_BASED]);

  const fetchAllProducts = useCallback(
    async (location) => {
      if (!location) {
        setProducts([]);
        setProductsLoading(false);
        return;
      }

      setProductsLoading(true);
      setProductsError(null);

      try {
        let apiUrl = `${import.meta.env.VITE_API_URL}/api/products`;
        const params = {};

        const hasValidCoordinates =
          typeof location.lat === "number" &&
          typeof location.lng === "number" &&
          !isNaN(location.lat) &&
          !isNaN(location.lng);

        if (location.type === LOCATION_TYPE_CURRENT && hasValidCoordinates) {
          apiUrl = `${import.meta.env.VITE_API_URL}/api/products/nearby`;
          params.lat = location.lat;
          params.lng = location.lng;
          params.distance = 10;
        } else if (location.city && location.city.toLowerCase() !== "current location") {
          params.city = location.city;
        }

        const response = await authAxios.get(apiUrl, { params });

        if (response.data?.status === "success" && Array.isArray(response.data?.data?.products)) {
          setProducts(response.data.data.products);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("AuthContext: Error fetching products:", error);
        setProductsError(error.message || "Failed to fetch products.");
        toast.error("Failed to load products for this location.");
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    },
    [authAxios, LOCATION_TYPE_CURRENT]
  );

  // --- Authentication Functions ---
  const register = useCallback(async (userData) => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true, authError: null }));
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        userData
      );
      const { token, user, message } = response.data;

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.removeItem("adminInfo");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("vendorInfo");
        localStorage.removeItem("vendorToken");

        setAuth({
          user: user,
          token: token,
          isAuthLoading: false,
          authError: null,
        });
        toast.success("Registration successful!");
        return {
          success: true,
          message: "Registration successful!",
          user: user,
          token: token,
        };
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
  }, []);

  const login = useCallback(async (credentials) => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true, authError: null }));
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        credentials,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const { success, token, user, message } = response.data;

      if (success && token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.removeItem("adminInfo");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("vendorInfo");
        localStorage.removeItem("vendorToken");

        setAuth({
          user: user,
          token: token,
          isAuthLoading: false,
          authError: null,
        });
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
  }, []);

  const adminLogin = useCallback(async (credentials) => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true, authError: null }));
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/login`,
        credentials,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const { success, token, user, message } = response.data;

      if (success && token && user) {
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminInfo", JSON.stringify(user));
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("vendorInfo");
        localStorage.removeItem("vendorToken");

        setAuth({
          user: user,
          token: token,
          isAuthLoading: false,
          authError: null,
        });
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
  }, []);

  const vendorLogin = useCallback(async (credentials) => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true, authError: null }));
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/vendor/login`,
        credentials,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const { token, user, message } = response.data;

      if (token && user) {
        localStorage.setItem("vendorToken", token);
        localStorage.setItem("vendorInfo", JSON.stringify(user));
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("adminInfo");
        localStorage.removeItem("adminToken");

        setAuth({
          user: user,
          token: token,
          isAuthLoading: false,
          authError: null,
        });
        toast.success("Vendor Login successful!");
        return {
          success: true,
          vendor: user,
          message: message || "Vendor Login successful!",
        };
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
  }, []);

  const vendorRegister = useCallback(async (userData) => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true, authError: null }));
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/vendor/register`,
        userData
      );

      const { token, user, message } = response.data;

      if (token && user) {
        localStorage.setItem("vendorToken", token);
        localStorage.setItem("vendorInfo", JSON.stringify(user));
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("adminInfo");
        localStorage.removeItem("adminToken");

        setAuth({
          user: user,
          token: token,
          isAuthLoading: false,
          authError: null,
        });
        return {
          success: true,
          message: message || "Vendor account created successfully!",
          user: user,
          token: token,
        };
      } else {
        const errorMessage = message || "Vendor registration failed: Missing token or user data in response.";
        setAuth((prev) => ({ ...prev, authError: errorMessage }));
        toast.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Vendor registration failed. Please try again.";
      setAuth((prev) => ({ ...prev, authError: errorMessage }));
      return { success: false, message: errorMessage };
    } finally {
      setAuth((prev) => ({ ...prev, isAuthLoading: false }));
    }
  }, []);

  const adminSignOut = useCallback(() => {
    logout();
    navigate("/admin/login");
  }, [logout, navigate]);

  const vendorSignOut = useCallback(() => {
    logout();
    navigate("/vendor/login");
  }, [logout, navigate]);

  // --- Location Management Functions ---
  const updateUserLocation = useCallback(
    async (locationData) => {
      // Clear any pending location timeout
      if (locationFetchTimeoutRef.current) {
        clearTimeout(locationFetchTimeoutRef.current);
      }

      setLocationsLoading(true);
      let newSelectedLoc = null;

      // Set loading state immediately
      setSelectedLocation((prev) => ({
        ...prev,
        name: locationData.type === LOCATION_TYPE_CURRENT 
          ? "Fetching current location..." 
          : locationData.name,
        lat: locationData.lat,
        lng: locationData.lng,
        type: locationData.type,
        city: locationData.city || "",
      }));

      try {
        // Set timeout for location operation
        locationFetchTimeoutRef.current = setTimeout(() => {
          toast.warn("Location detection is taking longer than expected. Please wait...");
        }, 3000);

        if (locationData.type === LOCATION_TYPE_CURRENT) {
          const coords = await getCurrentGeolocation();
          const cityName = await reverseGeocode(coords.lat, coords.lng);
          
          newSelectedLoc = {
            ...coords,
            name: `Current Location (${cityName})`,
            city: cityName.toLowerCase(),
            type: LOCATION_TYPE_CURRENT,
          };
          
          toast.success(`Location updated to your current position in ${cityName}!`);
        } else {
          newSelectedLoc = {
            ...locationData,
            city: locationData.city 
              ? locationData.city.toLowerCase() 
              : locationData.name 
                ? locationData.name.toLowerCase() 
                : "",
            type: LOCATION_TYPE_PRODUCT_BASED,
          };
          toast.success(`Location updated to ${locationData.name || locationData.city}!`);
        }

        // Save to localStorage and state
        localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(newSelectedLoc));
        setSelectedLocation(newSelectedLoc);
      } catch (error) {
        console.error("AuthContext: Error updating location:", error);
        
        newSelectedLoc = {
          ...DEFAULT_FALLBACK_LOCATION,
          name: `Current Location (Unavailable - ${DEFAULT_FALLBACK_LOCATION.name})`,
          type: locationData.type === LOCATION_TYPE_CURRENT 
            ? LOCATION_TYPE_CURRENT 
            : LOCATION_TYPE_PRODUCT_BASED,
        };
        
        localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(newSelectedLoc));
        toast.warn("Could not pinpoint your location. Using a default location.");
        setSelectedLocation(newSelectedLoc);
      } finally {
        if (locationFetchTimeoutRef.current) {
          clearTimeout(locationFetchTimeoutRef.current);
        }
        setLocationsLoading(false);
      }
    },
    [
      getCurrentGeolocation,
      reverseGeocode,
      DEFAULT_FALLBACK_LOCATION,
      USER_LOCATION_KEY,
      LOCATION_TYPE_CURRENT,
      LOCATION_TYPE_PRODUCT_BASED,
    ]
  );

  // --- Effects ---

  // Effect 1: Initialize auth state
  useEffect(() => {
    const initializeAuth = () => {
      let storedUser = null;
      let storedToken = null;

      try {
        const userJson = localStorage.getItem("user");
        const tokenVal = localStorage.getItem("token");
        const adminInfoJson = localStorage.getItem("adminInfo");
        const adminTokenVal = localStorage.getItem("adminToken");
        const vendorInfoJson = localStorage.getItem("vendorInfo");
        const vendorTokenVal = localStorage.getItem("vendorToken");

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
      } catch (e) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("adminInfo");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("vendorInfo");
        localStorage.removeItem("vendorToken");
      }

      setAuth((prev) => ({
        ...prev,
        user: storedUser,
        token: storedToken,
        isAuthLoading: false,
      }));
    };

    initializeAuth();

    const handleStorageChange = (e) => {
      if (
        [
          "user",
          "token",
          "adminInfo",
          "adminToken",
          "vendorInfo",
          "vendorToken",
        ].includes(e.key)
      ) {
        initializeAuth();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Effect 2: Setup initial location (runs once after auth is loaded)
  useEffect(() => {
    if (initialLocationSetupRef.current || auth.isAuthLoading) return;

    const setupInitialLocation = async () => {
      initialLocationSetupRef.current = true;
      setLocationsLoading(true);

      try {
        let userLoc = null;
        const savedLoc = localStorage.getItem(USER_LOCATION_KEY);

        // Try to use saved location if available
        if (savedLoc) {
          try {
            userLoc = JSON.parse(savedLoc);
            
            // If saved location is "current", try to refresh it
            if (userLoc.type === LOCATION_TYPE_CURRENT) {
              try {
                const coords = await getCurrentGeolocation();
                const cityName = await reverseGeocode(coords.lat, coords.lng);
                userLoc = {
                  ...coords,
                  name: `Current Location (${cityName})`,
                  city: cityName.toLowerCase(),
                  type: LOCATION_TYPE_CURRENT,
                };
              } catch (geoError) {
                console.warn("Could not refresh current location:", geoError);
                // Keep the saved location but mark it as potentially stale
                userLoc.name = `Current Location (Last known: ${userLoc.city || userLoc.name})`;
              }
            }
          } catch (e) {
            console.error("Failed to parse saved location:", e);
            localStorage.removeItem(USER_LOCATION_KEY);
          }
        }

        // If no valid saved location, try to get current location
        if (!userLoc) {
          try {
            const coords = await getCurrentGeolocation();
            const cityName = await reverseGeocode(coords.lat, coords.lng);
            userLoc = {
              ...coords,
              name: `Current Location (${cityName})`,
              city: cityName.toLowerCase(),
              type: LOCATION_TYPE_CURRENT,
            };
          } catch (error) {
            console.warn("Geolocation failed, using default:", error);
            userLoc = {
              ...DEFAULT_FALLBACK_LOCATION,
              name: `Current Location (Unavailable - ${DEFAULT_FALLBACK_LOCATION.name})`,
              type: LOCATION_TYPE_CURRENT,
            };
          }
        }

        // Save the determined location
        localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
        setSelectedLocation(userLoc);
      } catch (error) {
        console.error("Error during initial location setup:", error);
      } finally {
        setLocationsLoading(false);
      }
    };

    setupInitialLocation();
  }, [auth.isAuthLoading, getCurrentGeolocation, reverseGeocode, DEFAULT_FALLBACK_LOCATION, USER_LOCATION_KEY, LOCATION_TYPE_CURRENT]);

  // Effect 3: Fetch available locations when needed
  useEffect(() => {
    if (!locationsLoading && (selectedLocation || !initialLocationSetupRef.current)) {
      fetchAvailableLocations();
    }
  }, [selectedLocation, locationsLoading, fetchAvailableLocations]);

  // Effect 4: Fetch products when location changes
  useEffect(() => {
    if (selectedLocation) {
      fetchAllProducts(selectedLocation);
    } else {
      setProducts([]);
    }
  }, [selectedLocation, fetchAllProducts]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (locationFetchTimeoutRef.current) {
        clearTimeout(locationFetchTimeoutRef.current);
      }
    };
  }, []);


  return (
    <AuthContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,
        products,
        productsLoading,
        productsError,
        fetchAllProducts,
        isOpen,
        setIsOpen,
        user: auth.user,
        token: auth.token,
        isAuthLoading: auth.isAuthLoading,
        authError: auth.authError,
        currentRole,
        isLoggedIn,
        isAdmin,
        isVendor,
        login,
        register,
        adminLogin,
        vendorLogin,
        vendorRegister,
        logout,
        adminSignOut,
        vendorSignOut,
        selectedLocation,
        updateUserLocation,
        availableLocations,
        locationsLoading,
        fetchAvailableLocations,
        LOCATION_TYPE_CURRENT,
        LOCATION_TYPE_PRODUCT_BASED,
        USER_LOCATION_KEY,
        DEFAULT_FALLBACK_LOCATION,
        authAxios,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;