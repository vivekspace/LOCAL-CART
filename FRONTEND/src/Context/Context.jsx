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
  const CART_STORAGE_KEY = "user_cart_items"; // New key for cart persistence

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

  const navigate = useNavigate(); // Hook for navigation

  // --- Product States and Functions ---
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  // --- Cart Management States and Functions ---
  const [cartItems, setCartItems] = useState(() => {
    // Initialize cart items from localStorage on first render
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.error(
        "AuthContext: Error parsing cart items from localStorage on init:",
        e
      );
      localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted data
      return [];
    }
  });

  // Effect to save cart items to localStorage whenever cartItems state changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      console.log("AuthContext: Cart items saved to localStorage.", cartItems);
    } catch (e) {
      console.error(
        "AuthContext: Failed to save cart items to localStorage:",
        e
      );
    }
  }, [cartItems, CART_STORAGE_KEY]);

  const addToCart = useCallback(
    (productId, quantity = 1) => {
      console.group("AuthContext: addToCart Process");
      console.log(
        `AuthContext: addToCart called for productId: ${productId}, quantity: ${quantity}`
      );

      const product = products.find((p) => p._id === productId);
  

      if (!product) {
        console.warn(
          `AuthContext: Product with ID ${productId} not found in current 'products' state for addToCart. Cannot add to cart.`
        );
        toast.error("Product is currently unavailable or not found.");
        console.groupEnd();
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
       
          console.groupEnd(); // End console group here for updated item
          return updatedItems;
        } else {
          const newItem = { ...product, quantity };
          toast.success(`${product.name} added to cart!`);
          console.log(
            `AuthContext: Added new product ${product.name} to cart.`,
            newItem
          );
          console.groupEnd(); // End console group here for new item
          return [...prevItems, newItem];
        }
      });
    },
    [products] // Dependency on products array is correct
  );

  const updateCartItemQuantity = useCallback((productId, newQuantity) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      );
      console.log(
        `AuthContext: Updated cart item quantity for ${productId} to ${newQuantity}.`,
        updatedItems
      );
      return updatedItems;
    });
    toast.info("Cart item quantity updated.");
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) => {
      const filteredItems = prevItems.filter((item) => item._id !== productId);
      console.log(
        `AuthContext: Removed item ${productId} from cart.`,
        filteredItems
      );
      return filteredItems;
    });
    toast.info("Item removed from cart.");
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    toast.info("Cart cleared.");
    console.log("AuthContext: Cart cleared.");
  }, []);

  const getCartTotal = useCallback(() => {
    const total = cartItems.reduce((total, item) => {
      const quantity = item.quantity || 1;
      return total + item.price * quantity;
    }, 0);
    console.log("AuthContext: Cart total calculated:", total);
    return total;
  }, [cartItems]);

  // --- Logout Function and Ref for Interceptor ---
  const logoutRef = useRef(null);

  const logout = useCallback(() => {
    console.log("AuthContext: Initiating logout process...");
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
      localStorage.removeItem("vendorToken");
      localStorage.removeItem("vendorInfo");
      localStorage.removeItem(USER_LOCATION_KEY);
      localStorage.removeItem(CART_STORAGE_KEY); // Clear cart on logout

      setAuth({
        user: null,
        token: null,
        isAuthLoading: false,
        authError: null,
      });
      setSelectedLocation(null);
      setProducts([]);
      setCartItems([]); // Now this works!
      toast.info("Logged out successfully!");
      navigate("/");
      console.log("AuthContext: Logout successful, navigating to /.");
    } catch (e) {
      console.error("AuthContext: Error during logout process:", e);
      toast.error("An error occurred during logout.");
    }
  }, [
    navigate,
    USER_LOCATION_KEY,
    CART_STORAGE_KEY,
    setProducts,
    setSelectedLocation,
    setAuth,
    setCartItems,
  ]);

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
        if (error.response && error.response.status === 401) {
          console.error(
            "AuthContext: Interceptor caught 401:",
            error.response.data.message
          );
          if (
            error.response.data.message.includes("token") ||
            error.response.data.message.includes("logged in")
          ) {
            if (
              !window.location.pathname.includes("/login") &&
              !window.location.pathname.includes("/register") &&
              !window.location.pathname.includes("/admin/login") &&
              !window.location.pathname.includes("/vendor/login")
            ) {
              logoutRef.current();
              toast.error("Your session has expired. Please log in again.");
            } else {
              console.log(
                "AuthContext: Interceptor skipping logout, already on login/register page."
              );
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []);

  // --- Utility Functions (Geolocation) ---
  const reverseGeocode = useCallback(async (lat, lng) => {
    console.log(
      `AuthContext: Attempting reverse geocode for lat: ${lat}, lng: ${lng}`
    );
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
        data.address?.county ||
        data.display_name ||
        "Unknown Location";
      console.log(
        "AuthContext: Reverse geocoding successful, city:",
        detectedCity
      );
      return detectedCity;
    } catch (error) {
      console.error(
        "AuthContext: Error in fetching location via reverse geocoding:",
        error
      );
      return "Current Location"; // Fallback text
    }
  }, []);

  const getCurrentGeolocation = useCallback(() => {
    console.log("AuthContext: Attempting to get current geolocation...");
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log(
              "AuthContext: Geolocation successful:",
              position.coords
            );
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              type: LOCATION_TYPE_CURRENT,
            });
          },
          (error) => {
            console.error(
              "AuthContext: Geolocation error caught:",
              error.code,
              error.message
            );
            let errorMessage = "Failed to get current location.";

            if (error.code === error.PERMISSION_DENIED) {
              errorMessage =
                "Location access denied. Please enable it in your browser settings.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage =
                "Location information is unavailable. Try again or check device settings.";
            } else if (error.code === error.TIMEOUT) {
              errorMessage =
                "Timed out trying to get your location. Please check your signal or try again.";
            }
            toast.error(errorMessage);
            reject(error); // Reject the promise with the error
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // 10 seconds timeout
            maximumAge: 60000, // Use cached position if less than 60 seconds old
          }
        );
      } else {
        console.warn(
          "AuthContext: Geolocation is not supported by this browser."
        );
        toast.error("Your browser does not support Geolocation.");
        reject(new Error("Geolocation is not supported by this browser."));
      }
    });
  }, [LOCATION_TYPE_CURRENT]);

  // --- Cache Utilities ---
  const getCachedLocations = useCallback(() => {
    try {
      const cached = localStorage.getItem(LOCATIONS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log("AuthContext: Using cached available locations.");
          return data;
        } else {
          console.log("AuthContext: Cached available locations expired.");
          localStorage.removeItem(LOCATIONS_CACHE_KEY);
        }
      }
    } catch (e) {
      console.error("AuthContext: Failed to get cached locations:", e);
      localStorage.removeItem(LOCATIONS_CACHE_KEY);
    }
    return null;
  }, [CACHE_DURATION, LOCATIONS_CACHE_KEY]);

  const setCachedLocations = useCallback(
    (locations) => {
      try {
        localStorage.setItem(
          LOCATIONS_CACHE_KEY,
          JSON.stringify({
            data: locations,
            timestamp: Date.now(),
          })
        );
        console.log("AuthContext: Available locations cached successfully.");
      } catch (e) {
        console.error("AuthContext: Failed to cache locations:", e);
      }
    },
    [LOCATIONS_CACHE_KEY]
  );

  const fetchAvailableLocations = useCallback(async () => {
    setLocationsLoading(true);
    console.log("AuthContext: Attempting to fetch available locations...");

    const cachedLocations = getCachedLocations();
    if (cachedLocations) {
      const initialOptions = [
        {
          name: "Current Location",
          city: "current location",
          lat: null,
          lng: null,
          type: LOCATION_TYPE_CURRENT,
        },
        ...cachedLocations,
      ];
      setAvailableLocations(initialOptions);
      setLocationsLoading(false);
      return;
    }

    try {
      const response = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/locations`
      );

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
        console.log(
          "AuthContext: Available locations fetched from API and set. Count:",
          formattedLocations.length
        );
      } else {
        console.warn(
          "AuthContext: Unexpected locations data format from API or no locations.",
          response.data
        );
      }
    } catch (error) {
      console.error(
        "AuthContext: Failed to load available locations from API:",
        error
      );
      toast.error("Failed to load available cities.");
    } finally {
      setLocationsLoading(false);
    }
  }, [
    getCachedLocations,
    setCachedLocations,
    LOCATION_TYPE_CURRENT,
    LOCATION_TYPE_PRODUCT_BASED,
    authAxios,
  ]);

  const fetchAllProducts = useCallback(
    async (location) => {
      console.log(
        "AuthContext: fetchAllProducts called with location:",
        location
      );
      if (!location) {
        console.warn(
          "AuthContext: fetchAllProducts: No valid location object provided."
        );
        setProducts([]);
        setProductsLoading(false);
        return;
      }

      setProductsLoading(true);
      setProductsError(null);
      let apiUrl = `${import.meta.env.VITE_API_URL}/api/products`;
      const params = {};

      try {
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
          console.log(
            `AuthContext: Fetching nearby products for Current Location (Lat: ${location.lat}, Lng: ${location.lng})`
          );
        } else if (
          location.city &&
          location.city.toLowerCase() !== "current location"
        ) {
          apiUrl = `${import.meta.env.VITE_API_URL}/api/products`;
          params.city = location.city;
          console.log(
            `AuthContext: Fetching products for city: ${location.city}`
          );
        } else {
          console.warn(
            "AuthContext: No specific location (coordinates or city) to filter by. Fetching all products as a fallback."
          );
          apiUrl = `${import.meta.env.VITE_API_URL}/api/products`;
        }

        const response = await authAxios.get(apiUrl, { params });

        if (
          response.data?.status === "success" &&
          Array.isArray(response.data?.data?.products)
        ) {
          setProducts(response.data.data.products);
          console.log(
            `AuthContext: Products fetched successfully for ${
              location.name || location.city
            }. Count: ${response.data.data.products.length}. Products data:`,
            response.data.data.products
          );
        } else {
          console.warn(
            "AuthContext: Unexpected product data format or no products found for this location.",
            response.data
          );
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
        console.log("AuthContext: User registered and logged in.");
        return {
          success: true,
          message: "Registration successful!",
          user: user,
          token: token,
        };
      } else {
        const errorMessage =
          message ||
          "Registration failed: Missing token or user data in response.";
        setAuth((prev) => ({ ...prev, authError: errorMessage }));
        toast.error(errorMessage);
        console.error("AuthContext: Registration failed:", errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Registration failed.";
      setAuth((prev) => ({ ...prev, authError: errorMessage }));
      toast.error(errorMessage);
      console.error("AuthContext: Registration API error:", error);
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
        console.log("AuthContext: User logged in.");
        return { success: true, user };
      } else {
        const errorMessage = message || "Login failed.";
        setAuth((prev) => ({ ...prev, authError: errorMessage }));
        toast.error(errorMessage);
        console.error("AuthContext: Login failed:", errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (err) {
      let errorMessage = "Login failed. Please try again.";
      if (err.response) {
        errorMessage =
          err.response.data.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      setAuth((prev) => ({ ...prev, authError: errorMessage }));
      toast.error(errorMessage);
      console.error("AuthContext: Login API error:", err);
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
        console.log("AuthContext: Admin logged in.");
        return { success: true, admin: user };
      } else {
        const errorMessage = message || "Admin login failed.";
        setAuth((prev) => ({ ...prev, authError: errorMessage }));
        toast.error(errorMessage);
        console.error("AuthContext: Admin login failed:", errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (err) {
      let errorMessage = "Admin login failed. Please try again.";
      if (err.response) {
        errorMessage =
          err.response.data.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      setAuth((prev) => ({ ...prev, authError: errorMessage }));
      toast.error(errorMessage);
      console.error("AuthContext: Admin login API error:", err);
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
        console.log("AuthContext: Vendor logged in.");
        return {
          success: true,
          vendor: user,
          message: message || "Vendor Login successful!",
        };
      } else {
        const errorMessage =
          message ||
          "Vendor login failed: Missing token or user data in response.";
        setAuth((prev) => ({ ...prev, authError: errorMessage }));
        toast.error(errorMessage);
        console.error("AuthContext: Vendor login failed:", errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (err) {
      let errorMessage = "Vendor login failed. Please try again.";
      if (err.response) {
        errorMessage =
          err.response.data.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      setAuth((prev) => ({ ...prev, authError: errorMessage }));
      toast.error(errorMessage);
      console.error("AuthContext: Vendor login API error:", err);
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
        console.log("AuthContext: Vendor registered and logged in.");
        return {
          success: true,
          message: message || "Vendor account created successfully!",
          user: user,
          token: token,
        };
      } else {
        const errorMessage =
          message ||
          "Vendor registration failed: Missing token or user data in response.";
        setAuth((prev) => ({ ...prev, authError: errorMessage }));
        toast.error(errorMessage);
        console.error("AuthContext: Vendor registration failed:", errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Vendor registration failed. Please try again.";
      setAuth((prev) => ({ ...prev, authError: errorMessage }));
      console.error("AuthContext: Vendor registration API error:", error);
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

  const updateUserLocation = useCallback(
    async (locationData) => {
      setLocationsLoading(true);
      let newSelectedLoc = null;

      console.log("AuthContext: updateUserLocation called with:", locationData);

      setSelectedLocation((prev) => ({
        ...prev,
        name:
          locationData.type === LOCATION_TYPE_CURRENT
            ? "Fetching current location..."
            : locationData.name,
        lat: locationData.lat,
        lng: locationData.lng,
        type: locationData.type,
        city: locationData.city || "",
      }));

      if (locationData.type === LOCATION_TYPE_CURRENT) {
        console.log(
          "AuthContext: User selected 'Current Location', attempting to re-acquire geolocation..."
        );
        try {
          const coords = await getCurrentGeolocation();
          const cityName = await reverseGeocode(coords.lat, coords.lng);
          newSelectedLoc = {
            ...coords,
            name: `Current Location (${cityName})`,
            city: cityName.toLowerCase(),
            type: LOCATION_TYPE_CURRENT,
          };
          localStorage.setItem(
            USER_LOCATION_KEY,
            JSON.stringify(newSelectedLoc)
          );
          toast.success(
            `Location updated to your current position in ${cityName}!`
          );
          console.log(
            "AuthContext: Current location successfully resolved and set:",
            newSelectedLoc
          );
        } catch (error) {
          console.error(
            "AuthContext: Geolocation acquisition error during updateUserLocation:",
            error
          );
          newSelectedLoc = {
            ...DEFAULT_FALLBACK_LOCATION,
            name: `Current Location (Unavailable - ${DEFAULT_FALLBACK_LOCATION.name})`,
            city: DEFAULT_FALLBACK_LOCATION.city,
            type: LOCATION_TYPE_CURRENT,
          };
          localStorage.setItem(
            USER_LOCATION_KEY,
            JSON.stringify(newSelectedLoc)
          );
          toast.warn(
            "Could not pinpoint your current location. Using a default location."
          );
          console.log(
            "AuthContext: Falling back to default location for Current Location option:",
            newSelectedLoc
          );
        }
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
        localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(newSelectedLoc));
        toast.success(
          `Location updated to ${locationData.name || locationData.city}!`
        );
        console.log(
          "AuthContext: Location updated to product-based city:",
          newSelectedLoc
        );
      }

      setSelectedLocation(newSelectedLoc);
      setLocationsLoading(false);
    },
    [
      DEFAULT_FALLBACK_LOCATION,
      getCurrentGeolocation,
      reverseGeocode,
      LOCATION_TYPE_CURRENT,
      LOCATION_TYPE_PRODUCT_BASED,
      USER_LOCATION_KEY,
    ]
  );

  // --- Effects ---

  useEffect(() => {
    console.log("AuthContext: Running initial auth check effect...");
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
          console.log("AuthContext: Admin info loaded from localStorage.");
        } else if (vendorInfoJson && vendorTokenVal) {
          storedUser = JSON.parse(vendorInfoJson);
          storedToken = vendorTokenVal;
          console.log("AuthContext: Vendor info loaded from localStorage.");
        } else if (userJson && tokenVal) {
          storedUser = JSON.parse(userJson);
          storedToken = tokenVal;
          console.log("AuthContext: User info loaded from localStorage.");
        } else {
          console.log(
            "AuthContext: No specific user/admin/vendor info in localStorage."
          );
        }
      } catch (e) {
        console.error(
          "AuthContext: Error parsing auth data from localStorage in initializeAuth:",
          e
        );
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
      console.log(
        "AuthContext: Initial auth check complete via initializeAuth. isAuthLoading set to false."
      );
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
        console.log(
          "AuthContext: localStorage change detected, re-initializing auth state."
        );
        initializeAuth();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Effect 2: Setup initial user location (runs after auth is loaded)
  useEffect(() => {
    const setupInitialLocation = async () => {
      if (initialLocationSetupRef.current) {
        console.log(
          "AuthContext: Initial location setup already completed. Skipping."
        );
        return;
      }
      if (auth.isAuthLoading) {
        console.log(
          "AuthContext: Auth still loading, deferring initial location setup."
        );
        return;
      }

      setLocationsLoading(true);
      let userLoc = null;
      console.log("AuthContext: Attempting initial location setup...");

      const savedLoc = localStorage.getItem(USER_LOCATION_KEY);
      if (savedLoc) {
        try {
          userLoc = JSON.parse(savedLoc);
          console.log(
            "AuthContext: Found saved location in localStorage:",
            userLoc
          );
          if (userLoc.type === LOCATION_TYPE_CURRENT) {
            console.log(
              "AuthContext: Saved location is 'Current Location', attempting to re-acquire exact coords."
            );
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
              toast.success(
                `Location updated to your current position in ${cityName}!`
              );
              console.log(
                "AuthContext: Re-acquired current location successfully:",
                userLoc
              );
            } catch (geoError) {
              console.warn(
                "AuthContext: Could not re-acquire current location during initial setup (geolocation failed).",
                geoError.message
              );
              userLoc = {
                ...DEFAULT_FALLBACK_LOCATION,
                name: `Current Location (Unavailable - ${DEFAULT_FALLBACK_LOCATION.name})`,
                type: LOCATION_TYPE_CURRENT,
              };
              localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
              toast.warn(
                "Could not pinpoint your current location. Using a default location."
              );
              console.log(
                "AuthContext: Falling back to default location during re-acquire:",
                userLoc
              );
            }
          }
        } catch (e) {
          console.error(
            "AuthContext: Failed to parse saved location from localStorage in setupInitialLocation, clearing:",
            e
          );
          localStorage.removeItem(USER_LOCATION_KEY);
          userLoc = null;
        }
      }

      if (!userLoc) {
        console.log(
          "AuthContext: No valid saved location found or parse failed. Attempting initial geolocation..."
        );
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
          console.log(
            "AuthContext: Initial current location acquired successfully:",
            userLoc
          );
        } catch (error) {
          console.warn(
            "AuthContext: Geolocation denied or failed during initial setup. Falling back to default location.",
            error.message
          );
          userLoc = {
            ...DEFAULT_FALLBACK_LOCATION,
            name: `Current Location (Unavailable - ${DEFAULT_FALLBACK_LOCATION.name})`,
            type: LOCATION_TYPE_CURRENT,
          };
          localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(userLoc));
          toast.warn(
            "Could not pinpoint your current location. Using a default location."
          );
          console.log(
            "AuthContext: Initial setup falling back to default location:",
            userLoc
          );
        }
      }

      setSelectedLocation(userLoc);
      setLocationsLoading(false);
      initialLocationSetupRef.current = true;
      console.log(
        "AuthContext: Initial location setup complete. Final selectedLocation:",
        userLoc
      );
    };

    setupInitialLocation();
  }, [
    auth.isAuthLoading,
    getCurrentGeolocation,
    reverseGeocode,
    DEFAULT_FALLBACK_LOCATION,
    USER_LOCATION_KEY,
    LOCATION_TYPE_CURRENT,
  ]);

  useEffect(() => {
    if (!locationsLoading && selectedLocation) {
      console.log(
        "AuthContext: Effect: selectedLocation is set or locationsLoading changed. Fetching available locations."
      );
      fetchAvailableLocations();
    } else if (
      !locationsLoading &&
      !selectedLocation &&
      !initialLocationSetupRef.current
    ) {
      console.log(
        "AuthContext: Effect: locationsLoading false but selectedLocation null. Initializing available locations anyway."
      );
      fetchAvailableLocations();
    }
  }, [selectedLocation, locationsLoading, fetchAvailableLocations]);

  useEffect(() => {
    if (selectedLocation) {
      console.log(
        "AuthContext: Effect: selectedLocation updated, triggering product fetch via fetchAllProducts...",
        selectedLocation
      );
      fetchAllProducts(selectedLocation);
    } else {
      console.log(
        "AuthContext: Effect: selectedLocation is null, clearing products."
      );
      setProducts([]);
    }
  }, [selectedLocation, fetchAllProducts]);

  console.log(
    "AuthContext: Current products state (after effects/renders):",
    products
  );
  console.log(
    "AuthContext: Current cartItems state (after effects/renders):",
    cartItems
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
