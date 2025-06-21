import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { login as apiLogin, register as apiRegister } from "/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // --- Cart Management States ---
  const [cartItems, setCartItems] = useState([]);

  // --- Product States ---
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  // --- UI States ---
  const [isOpen, setIsOpen] = useState(false);

  // --- Authentication States ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // --- Location Constants ---
  const USER_LOCATION_KEY = "user_preferred_location_v2";
  const LOCATIONS_CACHE_KEY = "available_locations_cache";
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const LOCATION_TYPE_CURRENT = "current_location";
  const LOCATION_TYPE_PRODUCT_BASED = "product_location";

  const DEFAULT_FALLBACK_LOCATION = {
    name: "Mumbai, Maharashtra",
    city: "mumbai",
    lat: 19.076,
    lng: 72.8777,
    type: "default_fallback",
  };

  // --- Location States ---
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [availableLocations, setAvailableLocations] = useState([
    {
      name: "Current Location",
      city: "current location",
      lat: null,
      lng: null,
      type: LOCATION_TYPE_CURRENT,
    }
  ]); // Start with current location immediately
  const [locationsLoading, setLocationsLoading] = useState(true);
  const initialLocationFetchRef = useRef(false);

  // --- Cache Utilities ---
  const getCachedLocations = useCallback(() => {
    try {
      const cached = localStorage.getItem(LOCATIONS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (e) {
      console.error("Failed to get cached locations:", e);
    }
    return null;
  }, [CACHE_DURATION, LOCATIONS_CACHE_KEY]);

  const setCachedLocations = useCallback((locations) => {
    try {
      localStorage.setItem(LOCATIONS_CACHE_KEY, JSON.stringify({
        data: locations,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error("Failed to cache locations:", e);
    }
  }, [LOCATIONS_CACHE_KEY]);

  // --- Utility Functions (Cart Management) ---
  const addToCart = useCallback(
    (productId, quantity = 1) => {
      const product = products.find((p) => p._id === productId);

      if (!product) {
        toast.error("Product not found");
        return;
      }

      setCartItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex(
          (item) => item._id === productId
        );

        if (existingItemIndex !== -1) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex].quantity = quantity;
          return updatedItems;
        } else {
          return [...prevItems, { ...product, quantity }];
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
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item._id !== productId)
    );
    toast.info("Item removed from cart");
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    toast.info("Cart cleared");
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const quantity = item.quantity || 1;
      return total + item.price * quantity;
    }, 0);
  }, [cartItems]);

  // --- Utility Functions (Geolocation) ---
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const detectedCity =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.display_name ||
        "Unknown Location";
      console.log("Context: Reverse geocoding successful:", detectedCity);
      return detectedCity;
    } catch (error) {
      console.log("Error in fetching location:", error);
      return "Current Location";
    }
  }, []);

  const getCurrentGeolocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        console.log("Context: Calling navigator.geolocation.getCurrentPosition...");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              type: LOCATION_TYPE_CURRENT,
            });
          },
          (error) => {
            console.error("Context: Geolocation error caught:", error);
            let errorMessage = "Failed to get current location.";

            if (error.code === error.PERMISSION_DENIED) {
              errorMessage = "Location access denied. Please enable it in your browser settings.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = "Location information is unavailable. Try again or check device settings.";
            } else if (error.code === error.TIMEOUT) {
              errorMessage = "Timed out trying to get your location. Please check your signal or try again.";
            }
            
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      } else {
        console.warn("Context: Geolocation is not supported by this browser.");
        toast.error("Your browser does not support Geolocation.");
        reject(new Error("Geolocation is not supported by this browser."));
      }
    });
  }, [LOCATION_TYPE_CURRENT]);

  // --- Optimized Data Fetching Functions ---
  const fetchAllProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/products`
      );

      if (
        response.data.status === "success" &&
        Array.isArray(response.data.data.products)
      ) {
        setProducts(response.data.data.products);
      } else {
        console.warn("Context: Unexpected product data format.", response.data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      setProductsError("Failed to load products");
      // Don't show toast here as it might be called multiple times
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchAvailableLocations = useCallback(async () => {
    try {
      setLocationsLoading(true);
      
      // Try cache first
      const cachedLocations = getCachedLocations();
      if (cachedLocations) {
        console.log("Using cached locations");
        setAvailableLocations(prev => {
          const currentLocationExists = prev.some(loc => loc.type === LOCATION_TYPE_CURRENT);
          const finalLocations = currentLocationExists ? 
            [prev[0], ...cachedLocations] : 
            [{
              name: "Current Location",
              city: "current location",
              lat: null,
              lng: null,
              type: LOCATION_TYPE_CURRENT,
            }, ...cachedLocations];
          return finalLocations;
        });
        setLocationsLoading(false);
        return;
      }

      // Fetch from API if no cache
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/locations`
      );

      if (
        response.data.status === "success" &&
        Array.isArray(response.data.data.locations)
      ) {
        const fetchedCities = response.data.data.locations;
        const formattedLocations = fetchedCities.map((city) => ({
          name: city.charAt(0).toUpperCase() + city.slice(1),
          city: city.toLowerCase(),
          lat: null,
          lng: null,
          type: LOCATION_TYPE_PRODUCT_BASED,
        }));

        // Cache the locations
        setCachedLocations(formattedLocations);

        // Update state
        setAvailableLocations(prev => {
          const currentLocationExists = prev.some(loc => loc.type === LOCATION_TYPE_CURRENT);
          const finalLocations = currentLocationExists ? 
            [prev[0], ...formattedLocations] : 
            [{
              name: "Current Location",
              city: "current location",
              lat: null,
              lng: null,
              type: LOCATION_TYPE_CURRENT,
            }, ...formattedLocations];
          return finalLocations;
        });
      } else {
        setError("Unexpected data format from locations API.");
        console.warn("Context: Unexpected locations data format.", response.data);
      }
    } catch (error) {
      console.error("Failed to load available locations:", error);
      // Don't show toast for background loading failures
    } finally {
      setLocationsLoading(false);
    }
  }, [getCachedLocations, setCachedLocations, LOCATION_TYPE_CURRENT, LOCATION_TYPE_PRODUCT_BASED]);

  // --- Effects ---

  // Effect 1: Initialize auth state
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Failed to parse stored user or token:", e);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
        setIsLoggedIn(false);
      }
    }
    setLoading(false);
  }, []);

  // Effect 2: Load all data in parallel on mount
  useEffect(() => {
    // Load products and locations simultaneously
    Promise.all([
      fetchAllProducts(),
      fetchAvailableLocations()
    ]).catch(error => {
      console.error("Error loading initial data:", error);
    });
  }, [fetchAllProducts, fetchAvailableLocations]);

  // Effect 3: Setup initial location (independent of locations loading)
  useEffect(() => {
    const setupInitialLocation = async () => {
      if (initialLocationFetchRef.current) {
        console.log("Context: Initial location setup already attempted, skipping re-run.");
        return;
      }
      initialLocationFetchRef.current = true;

      let userLoc = null;

      // Try to load saved location from localStorage
      const savedLoc = localStorage.getItem(USER_LOCATION_KEY);
      if (savedLoc) {
        try {
          userLoc = JSON.parse(savedLoc);

          // If it was a 'current_location', try to re-acquire for accuracy
          if (userLoc.type === LOCATION_TYPE_CURRENT) {
            try {
              const newCoords = await getCurrentGeolocation();
              const newCityName = await reverseGeocode(newCoords.lat, newCoords.lng);
              userLoc = {
                ...newCoords,
                name: `Current Location (${newCityName})`,
                city: newCityName.toLowerCase(),
                type: LOCATION_TYPE_CURRENT,
              };
              localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
              console.log("Context: Re-acquired current location successfully:", userLoc);
            } catch (geoError) {
              console.warn("Context: Could not re-acquire current location during initial setup:", geoError.message);
              if (!userLoc.lat || !userLoc.lng || userLoc.type === LOCATION_TYPE_CURRENT) {
                userLoc = null;
              }
            }
          }
        } catch (e) {
          console.error("Context: Failed to parse saved location from localStorage, clearing:", e);
          localStorage.removeItem(USER_LOCATION_KEY);
          userLoc = null;
        }
      }

      // If no saved location or invalid, try to get current location
      if (!userLoc) {
        console.log("Context: No valid saved location, attempting to get current location initially...");
        try {
          const coords = await getCurrentGeolocation();
          const cityName = await reverseGeocode(coords.lat, coords.lng);
          userLoc = {
            ...coords,
            name: `Current Location (${cityName})`,
            city: cityName.toLowerCase(),
            type: LOCATION_TYPE_CURRENT,
          };
          localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
        } catch (error) {
          console.warn("Context: Geolocation denied or failed during initial setup:", error.message);
          userLoc = DEFAULT_FALLBACK_LOCATION;
          localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
        }
      }
      
      setSelectedLocation(userLoc);
    };

    // Run setup immediately, don't wait for locations
    setupInitialLocation();
  }, [
    getCurrentGeolocation,
    reverseGeocode,
    DEFAULT_FALLBACK_LOCATION,
    USER_LOCATION_KEY,
    LOCATION_TYPE_CURRENT,
  ]);

  // --- Authentication Functions ---
  const register = useCallback(async (userData) => {
    try {
      const { data } = await apiRegister(userData);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setToken(data.token);
      setIsLoggedIn(true);
      return {
        success: true,
        message: "Registration successful!",
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed.");
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed.",
      };
    }
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const { data } = await apiLogin(credentials);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setToken(data.token);
      setIsLoggedIn(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed from context.");
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setIsLoggedIn(false);
    toast.success("Logged out successfully");
  }, []);

  // Function to update user's selected location
  const updateUserLocation = useCallback(
    async (locationData) => {
      let newSelectedLoc = null;

      // Optimistic UI update
      setSelectedLocation((prev) => ({
        ...prev,
        name:
          locationData.type === LOCATION_TYPE_CURRENT
            ? "Fetching current location..."
            : locationData.name,
        lat: null,
        lng: null,
        type: locationData.type,
      }));

      if (locationData.type === LOCATION_TYPE_CURRENT) {
        console.log("Context: Selected type is 'Current Location', attempting to re-acquire...");
        try {
          const coords = await getCurrentGeolocation();
          const cityName = await reverseGeocode(coords.lat, coords.lng);
          newSelectedLoc = {
            ...coords,
            name: `Current Location (${cityName})`,
            city: cityName.toLowerCase(),
            type: LOCATION_TYPE_CURRENT,
          };
        } catch (error) {
          console.error("Context: Geolocation error on re-acquire:", error);
          newSelectedLoc = {
            ...DEFAULT_FALLBACK_LOCATION,
            name: "Current Location (Denied/Failed)",
            city: DEFAULT_FALLBACK_LOCATION.city,
            type: LOCATION_TYPE_CURRENT,
          };
        }
      } else {
        newSelectedLoc = {
          ...locationData,
          city: locationData.name.toLowerCase(),
        };
      }

      setSelectedLocation(newSelectedLoc);
      localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(newSelectedLoc));
    },
    [
      DEFAULT_FALLBACK_LOCATION,
      getCurrentGeolocation,
      reverseGeocode,
      LOCATION_TYPE_CURRENT,
      USER_LOCATION_KEY,
    ]
  );

  return (
    <AuthContext.Provider
      value={{
        // Cart
        cartItems,
        setCartItems,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,

        // Products
        products,
        productsLoading,
        productsError,
        fetchAllProducts, // Expose for manual refresh

        // UI
        isOpen,
        setIsOpen,

        // Auth
        user,
        token,
        loading,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        admin,
        setAdmin,
        login,
        register,
        logout,

        // Location
        selectedLocation,
        updateUserLocation,
        availableLocations,
        locationsLoading,
        fetchAvailableLocations, // Expose for manual refresh
        LOCATION_TYPE_CURRENT,
        LOCATION_TYPE_PRODUCT_BASED,
        USER_LOCATION_KEY,
        DEFAULT_FALLBACK_LOCATION,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;