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
  const [error, setError] = useState(null); // General error state for context
  const [token , setToken] = useState(null);
  // --- Location Constants ---
  const USER_LOCATION_KEY = "user_preferred_location_v2";
  const LOCATION_TYPE_CURRENT = "current_location";
  const LOCATION_TYPE_PRODUCT_BASED = "product_location";

  const DEFAULT_FALLBACK_LOCATION = {
    name: "Mumbai, Maharashtra",
    city: "mumbai", // Stored in lowercase for consistency
    lat: 19.076, // Mumbai latitude
    lng: 72.8777, // Mumbai longitude
    type: "default_fallback",
  };

  // --- Location States and Refs ---
  const [selectedLocation, setSelectedLocation] = useState(null); // The user's currently selected/detected location
  const [availableLocations, setAvailableLocations] = useState([]); // The list of unique city names from backend
  const initialLocationFetchRef = useRef(false); // To ensure initial location setup runs only once

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
          toast.success(`Cart updated: ${product.name} (${quantity})`);
          return updatedItems;
        } else {
          toast.success(`${product.name} added to cart`);
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
      toast.error("Could not determine city name for your location.", error);
      return "Current Location"; // Fallback name for display
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
            } else {
              toast.error(errorMessage + ` Error code: ${error.code}`);
            }
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // 10 seconds
            maximumAge: 60000, // Use cached position if less than 1 minute old
          }
        );
      } else {
        console.warn("Context: Geolocation is not supported by this browser.");
        toast.error("Your browser does not support Geolocation.");
        reject(new Error("Geolocation is not supported by this browser."));
      }
    });
  }, [LOCATION_TYPE_CURRENT]); // Dependency on LOCATION_TYPE_CURRENT constant

  // --- Effects ---

 useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token"); // Changed variable name for clarity

    if (storedUser && storedToken) { // Use storedToken here
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken); // <-- ADD THIS LINE to set the token state
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Failed to parse stored user or token:", e);
        // Optionally clear localStorage if parsing fails to prevent infinite errors
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
        setIsLoggedIn(false);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/products`
        );

        if (
          response.data.status === "success" &&
          Array.isArray(response.data.data.products)
        ) {
          setProducts(response.data.data.products);
        } else {
          console.warn(
            "Context: Unexpected product data format.",
            response.data
          );
          setProducts([]);
        }
      } catch (error) {
        toast.error("Failed to load product data.", error);
      }
    };
    fetchAllProducts();
  }, []);

  // Effect 3: Fetch AVAILABLE UNIQUE LOCATIONS from the new backend API
  useEffect(() => {
    const fetchAvailableLocations = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/locations`
        );

        if (
          response.data.status === "success" &&
          Array.isArray(response.data.data.locations)
        ) {
          const fetchedCities = response.data.data.locations;

          const formattedLocations = fetchedCities.map((city) => ({
            name: city.charAt(0).toUpperCase() + city.slice(1), // Capitalize for display
            city: city.toLowerCase(), // Keep lowercase for internal use/matching
            lat: null, // No coordinates from this endpoint
            lng: null, // No coordinates from this endpoint
            type: LOCATION_TYPE_PRODUCT_BASED,
          }));

         
          const hasCurrentLocationOption = formattedLocations.some(
            (loc) => loc.type === LOCATION_TYPE_CURRENT
          );
          let finalLocations = formattedLocations;
          if (!hasCurrentLocationOption) {
            finalLocations = [
              {
                name: "Current Location",
                city: "current location", // Placeholder, actual city name will be reverse geocoded
                lat: null,
                lng: null,
                type: LOCATION_TYPE_CURRENT,
              },
              ...formattedLocations,
            ];
          }

          setAvailableLocations(finalLocations);
        } else {
          setError("Unexpected data format from locations API.");
          console.warn(
            "Context: Unexpected locations data format.",
            response.data
          );
        }
      } catch (error) {
        toast.error("Failed to load available locations.", error);
      }
    };
    fetchAvailableLocations();
  }, [LOCATION_TYPE_CURRENT, LOCATION_TYPE_PRODUCT_BASED]); // Depend on constants if they change

  // Effect 4: Setup initial user location (runs once availableLocations are loaded or attempted)
  useEffect(() => {
    const setupInitialLocation = async () => {
     
      if (initialLocationFetchRef.current && availableLocations.length === 0) {
        console.log("Context: Waiting for availableLocations to load before initial location setup...");
        return;
      }
      if (initialLocationFetchRef.current) {
        console.log("Context: Initial location setup already attempted, skipping re-run.");
        return;
      }
      initialLocationFetchRef.current = true; // Mark as attempted

      let userLoc = null;

      // 1. Try to load saved location from localStorage
      const savedLoc = localStorage.getItem(USER_LOCATION_KEY);
      if (savedLoc) {
        try {
          userLoc = JSON.parse(savedLoc);

          // If it was a 'current_location', try to re-acquire for accuracy
          if (userLoc.type === LOCATION_TYPE_CURRENT) {
            try {
              const newCoords = await getCurrentGeolocation(); // This handles its own errors
              const newCityName = await reverseGeocode(
                newCoords.lat,
                newCoords.lng
              );
              userLoc = {
                ...newCoords,
                name: `Current Location (${newCityName})`, // Display name
                city: newCityName.toLowerCase(), // Store actual city for filtering
                type: LOCATION_TYPE_CURRENT,
              };
              localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
              console.log("Context: Re-acquired current location successfully:", userLoc);
            } catch (geoError) {
              console.warn(
                "Context: Could not re-acquire current location during initial setup. Using saved or falling back:",
                geoError.message
              );
              // Invalidate if saved data is incomplete OR if geolocation failed and it was a 'current_location' type
              if (!userLoc.lat || !userLoc.lng || userLoc.type === LOCATION_TYPE_CURRENT) {
                userLoc = null; // Forces fallback or new geolocation attempt
              }
            }
          } else {
            // For product-based saved location, ensure it's still a valid available location
            const foundInAvailable = availableLocations.find(
              (loc) => loc.city === userLoc.city
            );
            if (!foundInAvailable) {
              userLoc = null; // Invalidate if not found in current available locations
              console.warn(
                "Context: Saved product-based location not found in available locations, resetting."
              );
              localStorage.removeItem(USER_LOCATION_KEY); // Clear invalid saved location
            }
          }
        } catch (e) {
          console.error(
            "Context: Failed to parse saved location from localStorage, clearing:",
            e
          );
          localStorage.removeItem(USER_LOCATION_KEY);
          userLoc = null;
        }
      }

      // 2. If no saved location or invalid, try to get current location
      if (!userLoc) {
        console.log("Context: No valid saved location, attempting to get current location initially...");
        try {
          const coords = await getCurrentGeolocation(); // This handles its own errors
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
            "Context: Geolocation denied or failed during initial setup. Using default fallback:",
            error.message
          );
          userLoc = DEFAULT_FALLBACK_LOCATION;
          localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
        }
      }
      setSelectedLocation(userLoc);
    };

    // Only run this effect once availableLocations are potentially loaded (or after a short delay)
    // and if it hasn't run already
    if (!initialLocationFetchRef.current) { // Ensure it only runs once unless dependencies truly change
      setupInitialLocation();
    }
  }, [
    availableLocations, // Rerun if availableLocations change (e.g., loaded from API)
    getCurrentGeolocation,
    reverseGeocode,
    DEFAULT_FALLBACK_LOCATION,
    USER_LOCATION_KEY,
    LOCATION_TYPE_CURRENT,
  ]); // Dependencies for useCallback functions and constants

  // --- Authentication Functions ---
  const register = useCallback(async (userData) => {
    try {
      const { data } = await apiRegister(userData);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setIsLoggedIn(true);
      toast.success("Registration successful!");
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
      setIsLoggedIn(true);
      toast.success("Login successful!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login failed from context."
      );
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



  // Function to update user's selected location, either manual or re-acquire current
  const updateUserLocation = useCallback(
    async (locationData) => {
      let newSelectedLoc = null;

      // Optimistic UI update while fetching current location
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

      if (locationData.type === LOCATION_TYPE_CURRENT) {
        console.log("Context: Selected type is 'Current Location', attempting to re-acquire...");
        try {
          const coords = await getCurrentGeolocation(); // This handles its own errors/toasts
          const cityName = await reverseGeocode(coords.lat, coords.lng);
          newSelectedLoc = {
            ...coords,
            name: `Current Location (${cityName})`,
            city: cityName.toLowerCase(), // Store city in lowercase for consistency
            type: LOCATION_TYPE_CURRENT,
          };
        } catch (error) {
          console.error(
            "Context: Geolocation error on re-acquire for 'Current Location' type in updateUserLocation:",
            error
          );
          // Fallback to default if current location acquisition fails
          newSelectedLoc = {
            ...DEFAULT_FALLBACK_LOCATION,
            name: "Current Location (Denied/Failed)",
            city: DEFAULT_FALLBACK_LOCATION.city,
            type: LOCATION_TYPE_CURRENT, // Still mark as current type, just failed
          };
          
        }
      } else {
        // This is a product-based location selection
        newSelectedLoc = {
          ...locationData, // This includes name, city, type. Lat/lng might be null.
          city: locationData.name.toLowerCase(), // Ensure city is lowercase from original name
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