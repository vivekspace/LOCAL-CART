import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { toast } from "react-toastify";
import { login as apiLogin, register as apiRegister } from "/api"; // Adjust the path as needed

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [availableLocations, setAvailableLocations] = useState([]);

  // Authentication states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);

  // Location Constants
  const USER_LOCATION_KEY = "user_preferred_location_v2";
  const LOCATION_TYPE_CURRENT = "current_location";
  const LOCATION_TYPE_PRODUCT_BASED = "product_location";

  // Default fallback location (Mumbai)
  const DEFAULT_FALLBACK_LOCATION = {
    name: "Mumbai, Maharashtra",
    lat: 19.076, // Mumbai latitude
    lng: 72.8777, // Mumbai longitude
    type: "default_fallback",
  };

  // Location States and Refs
  const [selectedLocation, setSelectedLocation] = useState(null);
  const initialLocationFetchRef = useRef(false);

  // --- Utility Functions (Cart Management) ---
  const addToCart = (productId, quantity = 1) => {
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
  };

  const updateCartItemQuantity = (productId, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item._id !== productId)
    );
    toast.info("Item removed from cart");
  };

  const clearCart = () => {
    setCartItems([]);
    toast.info("Cart cleared");
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const quantity = item.quantity || 1;
      return total + item.price * quantity;
    }, 0);
  };

  // --- Utility Functions (Geolocation) ---
  const reverseGeocode = async (lat, lng) => {
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
  };

  const getCurrentGeolocation = async () => {
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
  };

  // --- Effects ---

  // Effect for initial user login state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  // Effect to fetch products and populate availableLocations
  useEffect(() => {
    const fetchProductsAndSetLocations = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/products`
        );

        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const fetchedProducts = data.data.products;

        setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
        console.log("AuthContext: Products fetched and set:", fetchedProducts); // <-- Add this
        fetchedProducts.forEach((p, i) => {
          console.log(`AuthContext: Product ${i} seller:`, p.seller); // <-- Add this
          console.log(
            `AuthContext: Product ${i} seller type:`,
            typeof p.seller
          ); // <-- Add this
        });

        // --- Logic to extract and set availableLocations ---
        const uniqueLocationsMap = new Map();
        if (Array.isArray(fetchedProducts)) {
          fetchedProducts.forEach((product) => {
            // Check product.location structure from image_8a2bb8.png and image_8a90dc.png
            if (
              product.location &&
              product.location.city &&
              Array.isArray(product.location.coordinates) &&
              product.location.coordinates.length === 2
            ) {
              const cityName = product.location.city;
              // MongoDB GeoJSON stores coordinates as [longitude, latitude]
              const longitude = product.location.coordinates[0]; //
              const latitude = product.location.coordinates[1]; //

              // Use city name as key to ensure uniqueness and store lat/lng
              if (!uniqueLocationsMap.has(cityName)) {
                uniqueLocationsMap.set(cityName, {
                  name: cityName,
                  lat: latitude, // Correctly assign latitude
                  lng: longitude, // Correctly assign longitude
                  type: LOCATION_TYPE_PRODUCT_BASED,
                });
              }
            }
          });
        }

        const extractedLocations = Array.from(uniqueLocationsMap.values());

        // Add the 'Current Location' option if it's not already in the list
        const hasCurrentLocationOption = extractedLocations.some(
          (loc) => loc.type === LOCATION_TYPE_CURRENT
        );
        if (!hasCurrentLocationOption) {
          extractedLocations.unshift({
            name: "Current Location",
            lat: null, // Actual coords fetched on selection
            lng: null, // Actual coords fetched on selection
            type: LOCATION_TYPE_CURRENT,
          });
        }

        setAvailableLocations(extractedLocations);
        console.log("Context: Available locations set:", extractedLocations); //
      } catch (error) {
        console.error(
          "Fetch error: Failed to fetch products or set locations",
          error
        );
        toast.error("Failed to load products or locations.");
      }
    };

    fetchProductsAndSetLocations();
  }, []);

  // Effect for initial location setup (from localStorage or geolocation)
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
              const newName = await reverseGeocode(
                newCoords.lat,
                newCoords.lng
              );
              userLoc = {
                ...newCoords,
                name: `Current Location (${newName})`,
                type: LOCATION_TYPE_CURRENT,
              };
              localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
            } catch (geoError) {
              console.warn(
                "Context: Could not re-acquire current location, using saved:",
                geoError
              );
              if (!userLoc.lat || !userLoc.lng) {
                userLoc = null; // Invalidate if saved data is incomplete
              }
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
          const name = await reverseGeocode(coords.lat, coords.lng);
          userLoc = { ...coords, name: `Current Location (${name})` };
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

    setupInitialLocation();
  }, []);

  // --- Authentication Functions ---
  const register = async (userData) => {
    try {
      const { data } = await apiRegister(userData); // Assuming apiRegister handles the actual API call

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setIsLoggedIn(true);

      // --- IMPORTANT CHANGE HERE ---
      // Return a success object that the Register.jsx component expects
      return {
        success: true,
        message: "Registration successful!",
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      console.error("register error:", error);
      // Return an error object that the Register.jsx component expects
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed.",
      };
    }
  };

  const login = async (credentials) => {
    try {
      const { data } = await apiLogin(credentials);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setIsLoggedIn(true);
      toast.success("Login successful");
    } catch (error) {
      console.error("login error:", error);
      toast.error(error.response?.data?.message || "Login failed.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
    toast.success("Logged out successfully");
  };

  const adminSignOut = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    setAdmin(null);
    toast.success("Admin logged out successfully");
  };

  // --- Location Update Function ---
  const updateUserLocation = useCallback(
    async (locationData) => {
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
          const name = await reverseGeocode(coords.lat, coords.lng);
          newSelectedLoc = {
            ...coords,
            name: `Current Location (${name})`,
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
            type: LOCATION_TYPE_CURRENT,
          };
          toast.error(
            "Failed to get current location. Using default fallback."
          );
        }
      } else {
        // For product-based locations, `locationData` should already have valid lat/lng
        newSelectedLoc = locationData;
        toast.info(`Location set to ${locationData.name}`);
      }

      setSelectedLocation(newSelectedLoc);
      localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(newSelectedLoc));
      console.log("Context: User location updated to:", newSelectedLoc);
    },
    [DEFAULT_FALLBACK_LOCATION]
  );

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
        login,
        logout,
        register,
        isOpen,
        setIsOpen,
        user,
        loading,
        setUser,
        products,
        isLoggedIn,
        setIsLoggedIn,
        adminSignOut,
        admin,
        setAdmin,
        selectedLocation,
        updateUserLocation,
        LOCATION_TYPE_CURRENT,
        LOCATION_TYPE_PRODUCT_BASED,
        USER_LOCATION_KEY,
        DEFAULT_FALLBACK_LOCATION,
        availableLocations,
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
