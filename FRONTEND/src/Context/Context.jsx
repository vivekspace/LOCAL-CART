import React, { createContext, useState, useContext, useRef , useCallback} from "react";
import { toast } from "react-toastify";
import { login as apiLogin, register as apiRegister } from "/api";

import { useEffect } from "react";
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [availableLocations, setAvailableLocations] = useState([]); // <-- Keep this here

  /**
   * Add product to cart with specified quantity
   * If product already exists in cart, updates the quantity
   * @param {number} productId - ID of the product to add
   * @param {number} quantity - Quantity to add (defaults to 1)
   */
  const addToCart = (productId, quantity = 1) => {
    const product = products.find((p) => p._id === productId);

    if (!product) {
      toast.error("Product not found");
      return;
    }

    setCartItems((prevItems) => {
      // Check if product already exists in cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item._id === productId
      );

      if (existingItemIndex !== -1) {
        // Update quantity if product already exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity = quantity;
        toast.success(`Cart updated: ${product.name} (${quantity})`);
        return updatedItems;
      } else {
        // Add new product with quantity
        toast.success(`${product.name} added to cart`);
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  /**
   * Update quantity of a specific cart item
   * @param {number} productId - ID of the product to update
   * @param {number} newQuantity - New quantity value
   */
  const updateCartItemQuantity = (productId, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  /**
   * Remove item from cart
   * @param {number} productId - ID of the product to remove
   */
  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item._id !== productId)
    );
    toast.info("Item removed from cart");
  };

  /**
   * Clear all items from cart
   */
  const clearCart = () => {
    setCartItems([]);
    toast.info("Cart cleared");
  };

  /**
   * Get total price of all items in cart
   * @returns {number} - Total price
   */
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const quantity = item.quantity || 1; // Default to 1 if quantity not set
      return total + item.price * quantity;
    }, 0);
  };

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const [admin, setAdmin] = useState(null);

  const adminSignOut = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");

    setAdmin(null);
    toast.success("Admin logged out successfully");
  };

  // Location Constants
  const USER_LOCATION_KEY = "user_preferred_location_v2";
  const LOCATION_TYPE_CURRENT = "current_location";
  const LOCATION_TYPE_PRODUCT_BASED = "product_location"; // Renamed for clarity

  // Default fallback location
  const DEFAULT_FALLBACK_LOCATION = {
    name: "Mumbai, Maharashtra",
    lat: 19.076, // Mumbai latitude
    lng: 72.8777, // Mumbai longitude
    type: "default_fallback", // A new type to indicate it's a hardcoded default
  };

  // Location States and Refs
  const [selectedLocation, setSelectedLocation] = useState(null);
  const initialLocationFetchRef = useRef(false); // To run initial location setup only once

  // Location Helper Functions
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
      return "Current Location"; // Fallback name
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
            maximumAge: 60000, // Use cached position if less than 1 min old
          }
        );
      } else {
        reject(new Error("Geolocation is not supported by this browser."));
      }
    });
  };

  // --- Products Fetch and Available Locations Logic ---
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
        const fetchedProducts = data.data.products; // Renamed to avoid conflict

        setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);

        // --- Logic to extract and set availableLocations ---
        const uniqueLocations = new Set();
        if (Array.isArray(fetchedProducts)) {
          fetchedProducts.forEach((product) => {
            if (
              product.location &&
              product.location.name &&
              product.location.lat &&
              product.location.lng
            ) {
              const locationKey = JSON.stringify({
                name: product.location.name,
                lat: product.location.lat,
                lng: product.location.lng,
                type: LOCATION_TYPE_PRODUCT_BASED,
              });
              uniqueLocations.add(locationKey);
            }
          });
        }

        const extractedLocations = Array.from(uniqueLocations).map(
          (locString) => JSON.parse(locString)
        );

        // Add the 'Current Location' option if it's not already in the list
        // This ensures the user can always select their current location
        const hasCurrentLocationOption = extractedLocations.some(
          (loc) => loc.type === LOCATION_TYPE_CURRENT
        );
        if (!hasCurrentLocationOption) {
          extractedLocations.unshift({
            name: "Current Location",
            lat: null, // Placeholder, actual coords fetched on selection
            lng: null, // Placeholder
            type: LOCATION_TYPE_CURRENT,
          });
        }

        setAvailableLocations(extractedLocations); // Set the extracted locations
        console.log("Context: Available locations set:", extractedLocations);
        // --- End of availableLocations logic ---
      } catch (error) {
        console.error(
          "Fetch error: Failed to fetch products or set locations",
          error
        );
        toast.error("Failed to load products or locations.");
      }
    };

    fetchProductsAndSetLocations();
  }, []); // Empty dependency array means this runs once on AuthProvider mount

  // --- Core Initial Location Setup Logic (Runs once on mount) ---
  useEffect(() => {
    const setupInitialLocation = async () => {
      if (initialLocationFetchRef.current) return; // Ensure it runs only once
      initialLocationFetchRef.current = true;

      let userLoc = null;

      // 1. Try to load saved location from localStorage
      const savedLoc = localStorage.getItem(USER_LOCATION_KEY);
      if (savedLoc) {
        try {
          userLoc = JSON.parse(savedLoc);
          // If it was a 'current_location', try to re-acquire for accuracy, but use saved as fallback
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
              localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc)); // Update with fresh data
            } catch (geoError) {
              console.warn(
                "Context: Could not re-acquire current location, using saved:",
                geoError
              );
              if (!userLoc.lat || !userLoc.lng) {
                userLoc = null; // Invalidate if it's truly empty
              }
            }
          }
        } catch (e) {
          console.error(
            "Context: Failed to parse saved location, clearing:",
            e
          );
          localStorage.removeItem(USER_LOCATION_KEY); // Clear invalid entry
        }
      }

      // 2. If no saved location, try to get current location
      if (!userLoc) {
        try {
          const coords = await getCurrentGeolocation();
          const name = await reverseGeocode(coords.lat, coords.lng);
          userLoc = { ...coords, name: `Current Location (${name})` };
          localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc)); // Save for future
        } catch (error) {
          console.warn(
            "Context: Geolocation denied or failed, using fallback:",
            error
          );
          userLoc = DEFAULT_FALLBACK_LOCATION; // Fallback if geolocation fails
          localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc)); // Save fallback
        }
      }
      setSelectedLocation(userLoc); // Set the initial selected location in context state
      console.log("Context: Initial selected location set to:", userLoc);
    };

    setupInitialLocation();
  }, []); // Empty dependency array means this runs once on AuthProvider mount

  const register = async (userData) => {
    try {
      const { data } = await apiRegister(userData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setIsLoggedIn(true);
      toast.success("Registration successful");
    } catch (error) {
      console.log("register:", error);
      toast.error(error.response.data.message);
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
      toast.error(error.response.data.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
    toast.success("Logged out successfully");
  };

  // --- Function to update selected location ---
  const updateUserLocation = useCallback(async (locationData) => {
    let newSelectedLoc = null;

    // Show an immediate "Fetching..." state while geolocation is active
    // This makes selectedLocation change immediately, triggering ShoppingPage's useEffect.
    setSelectedLocation((prev) => ({
      ...prev, // Keep existing properties if any, like type
      name: "Fetching current location...",
      lat: null, // Temporarily set to null while fetching
      lng: null, // Temporarily set to null while fetching
      type: LOCATION_TYPE_CURRENT, // Ensure type is correct for current location
    }));
    toast.info("Fetching your current location..."); // Provide user feedback

    if (locationData.type === LOCATION_TYPE_CURRENT) {
      try {
        const coords = await getCurrentGeolocation(); // This awaits the promise
        const name = await reverseGeocode(coords.lat, coords.lng); // This awaits the promise
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
        // Fallback to a default if re-acquiring current location fails
        newSelectedLoc = {
          ...DEFAULT_FALLBACK_LOCATION,
          name: "Current Location (Denied/Failed)", // Update name for UI clarity
          type: LOCATION_TYPE_CURRENT, // Ensure type is still 'current' for the fallback
        };
        toast.error("Failed to get current location. Using default fallback.");
      }
    } else {
      // For product-based locations or other manual selections, directly use the provided data
      newSelectedLoc = locationData;
      toast.info(`Location set to ${locationData.name}`);
    }

    // Set the final selected location after all async operations
    setSelectedLocation(newSelectedLoc);
    localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(newSelectedLoc));
    console.log("Context: User location updated to:", newSelectedLoc);
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
        selectedLocation, // The globally available selected location
        updateUserLocation, // Function to update the selected location from any component
        LOCATION_TYPE_CURRENT, // Expose constants for consumers
        LOCATION_TYPE_PRODUCT_BASED,
        USER_LOCATION_KEY,
        DEFAULT_FALLBACK_LOCATION,
        availableLocations, // <-- This is now correctly populated and exposed
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
