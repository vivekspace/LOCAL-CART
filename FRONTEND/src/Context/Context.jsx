import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { toast } from "react-toastify";
import axios from 'axios'; // Import axios for API calls
import { login as apiLogin, register as apiRegister } from "/api"; // Adjust the path as needed

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // --- Cart Management States ---
  const [cartItems, setCartItems] = useState([]);

  // --- Product States (fetched separately from locations now) ---
  const [products, setProducts] = useState([]);

  // --- UI States ---
  const [isOpen, setIsOpen] = useState(false); // Likely for a modal or sidebar

  // --- Authentication States ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // For initial auth loading
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState(null);

  // --- Location Constants ---
  const USER_LOCATION_KEY = "user_preferred_location_v2";
  const LOCATION_TYPE_CURRENT = "current_location";
  const LOCATION_TYPE_PRODUCT_BASED = "product_location";

  // Default fallback location (Mumbai)
  // Note: For product-based locations fetched from the backend, we only get the city name.
  // Lat/Lng are not stored in UniqueLocation collection.
  // If you need Lat/Lng for a product-based selected location in the frontend,
  // you might need a separate mechanism (e.g., geocoding on demand for that specific city).
  const DEFAULT_FALLBACK_LOCATION = {
    name: "Mumbai, Maharashtra",
    city: "Mumbai", // Adding city for consistency if needed for filtering
    lat: 19.076, // Mumbai latitude
    lng: 72.8777, // Mumbai longitude
    type: "default_fallback",
  };

  // --- Location States and Refs ---
  const [selectedLocation, setSelectedLocation] = useState(null); // The user's currently selected/detected location
  const [availableLocations, setAvailableLocations] = useState([]); // The list of unique city names from backend
  const initialLocationFetchRef = useRef(false); // To ensure initial location setup runs only once

  // --- Utility Functions (Cart Management) ---
  const addToCart = useCallback((productId, quantity = 1) => {
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
        toast.success(`Cart updated: ${product.name} (${quantity})`);
        return updatedItems;
      } else {
        toast.success(`${product.name} added to cart`);
        return [...prevItems, { ...product, quantity }];
      }
    });
  }, [products]); // Dependency on products to find product details

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
  // Using useCallback for stability, though dependencies are fixed
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      return (
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.display_name ||
        "Unknown Location"
      );
    } catch (error) {
      console.error("Context: Reverse geocoding failed:", error);
      return "Current Location";
    }
  }, []);

  const getCurrentGeolocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              type: LOCATION_TYPE_CURRENT,
            });
          },
          (error) => {
            console.error("Context: Geolocation error:", error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      } else {
        reject(new Error("Geolocation is not supported by this browser."));
      }
    });
  }, []);

  // --- Effects ---

  // Effect 1: Initial user login state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  // Effect 2: Fetch ALL products (if needed for other parts of the app, e.g., cart details)
  // This useEffect no longer extracts locations.
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/products`
        );

        if (response.data.status === 'success' && Array.isArray(response.data.data.products)) {
          setProducts(response.data.data.products);
          console.log("Context: Products fetched successfully.");
        } else {
          console.warn("Context: Unexpected product data format.", response.data);
          setProducts([]);
        }
      } catch (error) {
        console.error("Context: Failed to fetch products:", error);
        toast.error("Failed to load product data.");
      }
    };
    fetchAllProducts();
  }, []); // Run once on mount

  // Effect 3: Fetch AVAILABLE UNIQUE LOCATIONS from the new backend API
  useEffect(() => {
    const fetchAvailableLocations = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/locations`
        );

        if (response.data.status === 'success' && Array.isArray(response.data.data.locations)) {
          // The backend returns an array of strings (city names in lowercase)
          const fetchedCities = response.data.data.locations;
          
          // Structure them as { name: "City Name", type: LOCATION_TYPE_PRODUCT_BASED }
          // We don't have lat/lng for these from the /api/locations endpoint,
          // so leave them null or add a mechanism to resolve them if truly needed later.
          const formattedLocations = fetchedCities.map(city => ({
            name: city, // Backend provides lowercase, can capitalize on display in component
            city: city, // Keep lowercase for internal use/matching
            lat: null, // No coordinates from this endpoint
            lng: null, // No coordinates from this endpoint
            type: LOCATION_TYPE_PRODUCT_BASED,
          }));

          // Add the 'Current Location' option at the beginning if not already there
          const hasCurrentLocationOption = formattedLocations.some(
            (loc) => loc.type === LOCATION_TYPE_CURRENT
          );
          let finalLocations = formattedLocations;
          if (!hasCurrentLocationOption) {
            finalLocations = [{
              name: "Current Location",
              city: "Current Location", // Placeholder, actual city name will be reverse geocoded
              lat: null,
              lng: null,
              type: LOCATION_TYPE_CURRENT,
            }, ...formattedLocations];
          }

          setAvailableLocations(finalLocations);
          console.log("Context: Available locations fetched:", finalLocations);
        } else {
          setError('Unexpected data format from locations API.');
          console.warn("Context: Unexpected locations data format.", response.data);
        }
      } catch (error) {
        console.error("Context: Failed to fetch available locations:", error);
        toast.error("Failed to load available locations.");
      }
    };
    fetchAvailableLocations();
  }, []); // Run once on mount

  // Effect 4: Initial location setup (from localStorage or geolocation)
  // This logic remains largely the same, but it now relies on availableLocations
  // if you want to ensure the initial 'selectedLocation' matches one of the product locations.
  useEffect(() => {
    const setupInitialLocation = async () => {
      if (initialLocationFetchRef.current) return;
      initialLocationFetchRef.current = true;

      let userLoc = null;

      // 1. Try to load saved location from localStorage
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
                name: `Current Location (${newCityName})`, // Display name
                city: newCityName.toLowerCase(), // Store actual city for filtering
                type: LOCATION_TYPE_CURRENT,
              };
              localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
            } catch (geoError) {
              console.warn(
                "Context: Could not re-acquire current location, using saved (or fallback):",
                geoError
              );
              // Invalidate if saved data is incomplete OR if geolocation failed and it was a 'current_location' type
              if (!userLoc.lat || !userLoc.lng || userLoc.type === LOCATION_TYPE_CURRENT) {
                  userLoc = null; // Forces fallback or new geolocation attempt
              }
            }
          } else {
             // For product-based saved location, ensure it's still a valid available location
             // (Optional: this ensures old product-based locations that no longer exist are not used)
             const foundInAvailable = availableLocations.find(loc => loc.city === userLoc.city);
             if(!foundInAvailable) {
                 userLoc = null; // Invalidate if not found in current available locations
                 console.warn("Context: Saved product-based location not found in available locations, resetting.");
             }
          }
        } catch (e) {
          console.error(
            "Context: Failed to parse saved location, clearing:",
            e
          );
          localStorage.removeItem(USER_LOCATION_KEY);
          userLoc = null;
        }
      }

      // 2. If no saved location or invalid, try to get current location
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
          localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
        } catch (error) {
          console.warn(
            "Context: Geolocation denied or failed, using fallback:",
            error
          );
          userLoc = DEFAULT_FALLBACK_LOCATION;
          localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
        }
      }
      setSelectedLocation(userLoc);
      console.log("Context: Initial selected location set to:", userLoc);
    };

    // Only run this effect once availableLocations are potentially loaded (or after a short delay)
    // and if it hasn't run already
    if (availableLocations.length > 0 || initialLocationFetchRef.current) { // Run if locations are loaded or if it's already tried
      setupInitialLocation();
    }
  }, [availableLocations, getCurrentGeolocation, reverseGeocode, DEFAULT_FALLBACK_LOCATION]); // Dependencies for useCallback functions and default fallback

  // --- Authentication Functions ---
  const register = useCallback(async (userData) => {
    try {
      const { data } = await apiRegister(userData);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setIsLoggedIn(true);

      return {
        success: true,
        message: "Registration successful!",
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      console.error("register error:", error);
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
      setIsLoggedIn(true);
    } catch (error) {
      console.error("login error in AuthContext:", error);
      toast.error(error.response?.data?.message || "Login failed from context.");
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
    toast.success("Logged out successfully");
  }, []);

  const adminSignOut = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    setAdmin(null);
    toast.success("Admin logged out successfully");
  }, []);

  // --- Location Update Function ---
  // This function is called when a user selects a location from the dropdown
  // or when 'Current Location' is re-acquired.
  const updateUserLocation = useCallback(
    async (locationData) => { // locationData will be the object from availableLocations
      let newSelectedLoc = null;

      setSelectedLocation((prev) => ({
        ...prev,
        name:
          locationData.type === LOCATION_TYPE_CURRENT
            ? "Fetching current location..."
            : locationData.name,
        lat: null, // Reset while fetching/setting
        lng: null, // Reset while fetching/setting
        type: locationData.type,
      }));
      toast.info(
        locationData.type === LOCATION_TYPE_CURRENT
          ? "Fetching your current location..."
          : `Setting location to ${locationData.name}...`
      );

      if (locationData.type === LOCATION_TYPE_CURRENT) {
        try {
          const coords = await getCurrentGeolocation();
          const cityName = await reverseGeocode(coords.lat, coords.lng);
          newSelectedLoc = {
            ...coords,
            name: `Current Location (${cityName})`,
            city: cityName.toLowerCase(), // Store city in lowercase for consistency
            type: LOCATION_TYPE_CURRENT,
          };
          toast.success("Location updated successfully!");
        } catch (error) {
          console.error(
            "Context: Geolocation error on re-acquire for 'Current Location' type:",
            error
          );
          newSelectedLoc = {
            ...DEFAULT_FALLBACK_LOCATION,
            name: "Current Location (Denied/Failed)",
            city: DEFAULT_FALLBACK_LOCATION.city, // Ensure city is also consistent
            type: LOCATION_TYPE_CURRENT,
          };
          toast.error(
            "Failed to get current location. Using default fallback."
          );
        }
      } else {
        // For product-based locations selected from the dropdown:
        // `locationData` already contains `name` (which is the city name).
        // If you need `lat`/`lng` for these, you'd need to either:
        // 1. Fetch it from a geocoding service using `locationData.name`
        // 2. Have the /api/locations endpoint return lat/lng for each city (more complex backend)
        // For now, we'll store only what we have (name/city), and lat/lng will be null.
        newSelectedLoc = {
            ...locationData, // This includes name, city, type. Lat/lng might be null.
            city: locationData.name.toLowerCase() // Ensure city is lowercase from original name
        };
        toast.info(`Location set to ${locationData.name}`);
      }

      setSelectedLocation(newSelectedLoc);
      localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(newSelectedLoc));
    },
    [DEFAULT_FALLBACK_LOCATION, getCurrentGeolocation, reverseGeocode]
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

        // UI
        isOpen,
        setIsOpen,

        // Auth
        user,
        loading,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        adminSignOut,
        admin,
        setAdmin,
        login,
        register,
        logout,

        // Location
        selectedLocation,
        updateUserLocation,
        availableLocations, // Expose the fetched available locations
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