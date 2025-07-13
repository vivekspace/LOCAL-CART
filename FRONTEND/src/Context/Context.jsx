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

// Export AuthContext at the top level
export const AuthContext = createContext(null);

// Export useAuth hook at the top level
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// AuthProvider component definition
const AuthProvider = ({ children }) => {
  console.log("AuthContext: AuthProvider rendering...");

  const [auth, setAuth] = useState(() => {
    let storedUser = null;
    let storedJwtToken = null; // Renamed to storedJwtToken for consistency
    let isAuthLoading = true;

    try {
      storedUser = JSON.parse(localStorage.getItem("currentUser"));
      storedJwtToken = localStorage.getItem("jwtToken"); // Correctly reads from "jwtToken"

      if (storedJwtToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedJwtToken}`;
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }

      isAuthLoading = false;
    } catch (e) {
      console.error("AuthContext: Error parsing auth data from localStorage on init:", e);
      localStorage.removeItem("currentUser");
      localStorage.removeItem("jwtToken");
      isAuthLoading = false;
    }

    return {
      user: storedUser,
      jwtToken: storedJwtToken, // Stored as 'jwtToken' inside the 'auth' object
      isAuthLoading: isAuthLoading,
      authError: null,
    };
  });

  useEffect(() => {
    console.log("AuthContext: Auth state updated:", auth);
  }, [auth]);

  // These use 'auth.user' and 'auth.jwtToken' which are consistent with the new state structure
  const currentRole = useMemo(() => auth.user?.role || null, [auth.user]);
  const isLoggedIn = useMemo(() => !!auth.jwtToken && !!auth.user, [auth.jwtToken, auth.user]);
  const isAdmin = useMemo(() => auth.user?.role === "admin", [auth.user]);
  const isSeller = useMemo(() => auth.user?.role === "seller", [auth.user]);

  const [isOpen, setIsOpen] = useState(false);

  // Location constants
  const USER_LOCATION_KEY = "user_preferred_location_v3";
  const LOCATIONS_CACHE_KEY = "available_locations_cache";
  const IP_LOCATION_KEY = "ip_detected_location";
  const CACHE_DURATION = 5 * 60 * 1000;
  const GEOLOCATION_TIMEOUT = 10000;

  const LOCATION_TYPE_IP = "ip_detected";
  const LOCATION_TYPE_GPS = "gps_location";
  const LOCATION_TYPE_MANUAL = "manual_selection";
  const LOCATION_TYPE_DEFAULT = "default_fallback";

  // Simplified location state management
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [ipLocation, setIpLocation] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [userPreferredLocation, setUserPreferredLocation] = useState(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  // Cart management (keeping existing cart logic)
  const CART_STORAGE_KEY = "user_cart_items";
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.error("AuthContext: Error parsing cart items from localStorage on init:", e);
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error("AuthContext: Failed to save cart items to localStorage:", e);
    }
  }, [cartItems]);

  // Cart functions (keeping existing implementation)
  const addToCart = useCallback((productId, quantity = 1) => {
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
  }, [products]);

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

  // Improved IP-based location detection
  const detectIpLocation = useCallback(async () => {
    try {
      // Check cache first
      const cachedIpLocation = localStorage.getItem(IP_LOCATION_KEY);
      if (cachedIpLocation) {
        const { data, timestamp } = JSON.parse(cachedIpLocation);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log("AuthContext: Using cached IP location");
          return data;
        }
      }

      // Multiple IP geolocation services for reliability
      const ipServices = [
        'https://ipapi.co/json/',
        'https://api.ipgeolocation.io/ipgeo?apiKey=free',
        'https://ipwhois.app/json/'
      ];

      for (const service of ipServices) {
        try {
          const response = await fetch(service, {
            timeout: 3000,
            headers: { 'Accept': 'application/json' }
          });

          if (!response.ok) continue;

          const data = await response.json();
          let locationData = null;

          // Handle different API response formats
          if (data.city && data.country_name) {
            locationData = {
              city: data.city.toLowerCase(),
              region: data.region || data.state || '',
              country: data.country_name,
              name: `${data.city}, ${data.region || data.country_name}`,
              lat: data.latitude || data.lat,
              lng: data.longitude || data.lng || data.lon,
              type: LOCATION_TYPE_IP
            };
          }

          if (locationData) {
            // Cache the result
            localStorage.setItem(IP_LOCATION_KEY, JSON.stringify({
              data: locationData,
              timestamp: Date.now()
            }));
            console.log("AuthContext: IP location detected:", locationData.name);
            return locationData;
          }
        } catch (error) {
          console.warn("AuthContext: IP service failed:", service, error);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error("AuthContext: IP location detection failed:", error);
      return null;
    }
  }, [CACHE_DURATION, IP_LOCATION_KEY, LOCATION_TYPE_IP]);

  // Improved GPS location detection
  const detectGpsLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by this browser.");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Reverse geocode to get city name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
            );

            if (!response.ok) throw new Error('Reverse geocoding failed');

            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown Location';
            const region = data.address?.state || data.address?.region || '';
            const country = data.address?.country || '';

            const locationData = {
              city: city.toLowerCase(),
              region,
              country,
              name: `${city}${region ? ', ' + region : ''}`,
              lat: latitude,
              lng: longitude,
              type: LOCATION_TYPE_GPS
            };

            resolve(locationData);
          } catch (error) {
            resolve({
              city: 'current_location',
              name: 'Current Location',
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              type: LOCATION_TYPE_GPS
            });
          }
        },
        (error) => {
          let errorMessage = "Failed to get current location.";
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location access denied. Please enable location in your browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Location information is unavailable.";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Location request timed out.";
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: false, // Faster, less battery drain
          timeout: GEOLOCATION_TIMEOUT,
          maximumAge: 5 * 60 * 1000, // 5 minutes cache
        }
      );
    });
  }, [GEOLOCATION_TIMEOUT, LOCATION_TYPE_GPS]);

  // Fetch available locations (vendor locations)
  const fetchAvailableLocations = useCallback(async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem(LOCATIONS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Array.isArray(data) && Date.now() - timestamp < CACHE_DURATION) {
          console.log("AuthContext: Using cached available locations");
          return data;
        }
      }

      console.log("AuthContext: Fetching available locations from API");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/locations`);

      if (response.data?.status === "success" && Array.isArray(response.data?.data?.locations)) {
        const formattedLocations = response.data.data.locations
          .filter(loc => loc && typeof loc.name === 'string' && loc.name.trim() !== '')
          .map(loc => ({
            name: loc.name.charAt(0).toUpperCase() + loc.name.slice(1),
            city: loc.city ? loc.city.toLowerCase() : loc.name.toLowerCase(),
            lat: loc.lat,
            lng: loc.lng,
            type: LOCATION_TYPE_MANUAL
          }));

        // Cache the result
        localStorage.setItem(LOCATIONS_CACHE_KEY, JSON.stringify({
          data: formattedLocations,
          timestamp: Date.now()
        }));

        console.log("AuthContext: Available locations fetched:", formattedLocations.length);
        return formattedLocations;
      }

      return [];
    } catch (error) {
      console.error("AuthContext: Failed to fetch available locations:", error);
      return [];
    }
  }, [CACHE_DURATION, LOCATIONS_CACHE_KEY, LOCATION_TYPE_MANUAL]);

  // Main location initialization
  const initializeLocation = useCallback(async () => {
    setLocationsLoading(true);

    try {
      // 1. Always fetch available vendor locations first
      const vendorLocations = await fetchAvailableLocations();
      setAvailableLocations(vendorLocations);

      // 2. Check if user has a saved preference
      const savedLocation = localStorage.getItem(USER_LOCATION_KEY);
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation);
          if (parsed && parsed.city && parsed.name) {
            console.log("AuthContext: Using saved user location:", parsed.name);
            setUserPreferredLocation(parsed);
            setSelectedLocation(parsed);
            setLocationsLoading(false);
            return;
          }
        } catch (e) {
          console.error("AuthContext: Error parsing saved location:", e);
          localStorage.removeItem(USER_LOCATION_KEY);
        }
      }

      // 3. Try IP-based detection (silent, fast)
      const ipLoc = await detectIpLocation();
      if (ipLoc) {
        setIpLocation(ipLoc);

        // Check if IP location matches any vendor location
        const matchingVendorLocation = vendorLocations.find(
          loc => loc.city === ipLoc.city ||
                    loc.name.toLowerCase().includes(ipLoc.city) ||
                    ipLoc.name.toLowerCase().includes(loc.city)
        );

        if (matchingVendorLocation) {
          console.log("AuthContext: IP location matches vendor location:", matchingVendorLocation.name);
          setSelectedLocation(matchingVendorLocation);
        } else {
          console.log("AuthContext: IP location detected but no vendor match, using IP location");
          setSelectedLocation(ipLoc);
        }
      } else {
        // 4. Fallback to first available location or default
        const fallbackLocation = vendorLocations.length > 0
          ? vendorLocations[0]
          : {
              name: "Mumbai, Maharashtra",
              city: "mumbai",
              lat: 19.076,
              lng: 72.8777,
              type: LOCATION_TYPE_DEFAULT
            };

        console.log("AuthContext: Using fallback location:", fallbackLocation.name);
        setSelectedLocation(fallbackLocation);
      }

    } catch (error) {
      console.error("AuthContext: Location initialization failed:", error);
      // Final fallback
      setSelectedLocation({
        name: "Mumbai, Maharashtra",
        city: "mumbai",
        lat: 19.076,
        lng: 72.8777,
        type: LOCATION_TYPE_DEFAULT
      });
    } finally {
      setLocationsLoading(false);
    }
  }, [fetchAvailableLocations, detectIpLocation, USER_LOCATION_KEY, LOCATION_TYPE_DEFAULT]);

  // User location selection handler
  const updateUserLocation = useCallback(async (locationObj) => {
    if (!locationObj) return;

    try {
      let finalLocation = { ...locationObj };

      // Handle "Use Current Location" selection
      if (locationObj.city === 'current_location' || locationObj.type === LOCATION_TYPE_GPS) {
        console.log("AuthContext: User requested GPS location");

        // Show loading state
        setSelectedLocation({
          name: "Getting your location...",
          city: "detecting",
          type: LOCATION_TYPE_GPS
        });

        try {
          const gpsLoc = await detectGpsLocation();
          setGpsLocation(gpsLoc);
          finalLocation = gpsLoc;
          toast.success("Location updated to your current position!");
        } catch (error) {
          console.error("AuthContext: GPS location failed:", error);
          toast.error(error.message);

          // Fallback to IP location if available
          if (ipLocation) {
            finalLocation = ipLocation;
            toast.info("Using approximate location instead.");
          } else {
            // Keep current selection
            return;
          }
        }
      } else {
        // Manual location selection
        toast.success(`Location set to ${locationObj.name}!`);
      }

      // Save user preference
      localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(finalLocation));
      setUserPreferredLocation(finalLocation);
      setSelectedLocation(finalLocation);

      console.log("AuthContext: Location updated to:", finalLocation.name);
    } catch (error) {
      console.error("AuthContext: Failed to update location:", error);
      toast.error("Failed to update location. Please try again.");
    }
  }, [detectGpsLocation, ipLocation, USER_LOCATION_KEY, LOCATION_TYPE_GPS]);

  // Improved product fetching
  const fetchAllProducts = useCallback(async (location) => {
    if (!location || !location.city) {
      console.log("AuthContext: Invalid location for product fetch");
      setProducts([]);
      setProductsLoading(false);
      return;
    }

    setProductsLoading(true);
    setProductsError(null);

    try {
      let apiUrl = `${import.meta.env.VITE_API_URL}/api/products`;
      const params = {};

      // Use coordinates for GPS locations
      if (location.type === LOCATION_TYPE_GPS && location.lat && location.lng) {
        apiUrl = `${import.meta.env.VITE_API_URL}/api/products/nearby`;
        params.lat = location.lat;
        params.lng = location.lng;
        params.distance = 10; // 10km radius
        console.log("AuthContext: Fetching nearby products");
      } else {
        // Use city-based search
        params.city = location.city;
        console.log("AuthContext: Fetching products for city:", location.city);
      }

      const response = await axios.get(apiUrl, { params });

      if (response.data?.status === "success" && Array.isArray(response.data?.data?.products)) {
        setProducts(response.data.data.products);
        console.log("AuthContext: Products fetched:", response.data.data.products.length);

        if (response.data.data.products.length === 0) {
          toast.info("No products found in this area. Try selecting a different location.");
        }
      } else {
        setProducts([]);
        toast.info("No products found in this area.");
      }
    } catch (error) {
      console.error("AuthContext: Error fetching products:", error);
      setProductsError(error.message);
      toast.error("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [LOCATION_TYPE_GPS]);

  // Auth functions (keeping existing implementation)
  // Renamed 'token' parameter to 'jwtToken' for consistency
  const updateAuthLocalStorageAndState = useCallback((jwtToken, user, role) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorInfo");

    if (jwtToken && user) {
      localStorage.setItem("jwtToken", jwtToken); // Saves to "jwtToken"
      localStorage.setItem("currentUser", JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      setAuth({ user, jwtToken, isAuthLoading: false, authError: null }); // Updates state with 'jwtToken'
    } else {
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("currentUser");
      delete axios.defaults.headers.common['Authorization'];
      setAuth({ user: null, jwtToken: null, isAuthLoading: false, authError: null });
    }
  }, []);

  const logoutRef = useRef(null);

  const logout = useCallback(() => {
    try {
      updateAuthLocalStorageAndState(null, null, null);
      localStorage.removeItem(USER_LOCATION_KEY);
      localStorage.removeItem(CART_STORAGE_KEY);

      setSelectedLocation(null);
      setProducts([]);
      setCartItems([]);
      setUserPreferredLocation(null);
      setGpsLocation(null);

      toast.info("Logged out successfully!");
      // Do NOT navigate here — do it where this function is called
    } catch (e) {
      console.error("AuthContext: Error during logout:", e);
      toast.error("An error occurred during logout.");
    }
  }, [USER_LOCATION_KEY, CART_STORAGE_KEY, updateAuthLocalStorageAndState]);


  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // Auth axios instance (keeping existing implementation)
  const authAxios = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      withCredentials: true,
    });

    instance.interceptors.request.use(
      (config) => {
        const activeJwtToken = localStorage.getItem("jwtToken"); // Uses 'jwtToken'
        if (activeJwtToken) {
          config.headers.Authorization = `Bearer ${activeJwtToken}`;
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

  // Auth methods (keeping existing implementation)
  const register = useCallback(async (userData) => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true, authError: null }));
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, userData);
      const { token, user, message } = response.data;
      if (token && user) {
        updateAuthLocalStorageAndState(token, user, user.role); // Passes 'token' to the update function
        toast.success("Registration successful!");
        return { success: true, message: "Registration successful!", user: user, jwtToken: token }; // Returns 'jwtToken'
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
        updateAuthLocalStorageAndState(token, user, user.role); // Passes 'token' to the update function
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
        updateAuthLocalStorageAndState(token, user, user.role); // Passes 'token' to the update function
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
        updateAuthLocalStorageAndState(token, user, user.role); // Passes 'token' to the update function
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
        updateAuthLocalStorageAndState(token, user, user.role); // Passes 'token' to the update function
        return { success: true, message: message || "Vendor account created successfully!", user: user, jwtToken: token }; // Returns 'jwtToken'
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

  const adminSignOut = useCallback(() => {
    logout();
    toast.info("Admin logged out.");
  }, [logout]);

  const vendorSignOut = useCallback(() => {
    logout();
    toast.info("Vendor logged out.");
  }, [logout]);

  // Initialize auth from storage
  // This useEffect with an empty dependency array is crucial for initial load
  useEffect(() => {
    const initializeAuthFromStorage = () => {
      let storedUser = null;
      let storedJwtToken = null;
      try {
        const rawCurrentUser = localStorage.getItem("currentUser");
        const rawJwtToken = localStorage.getItem("jwtToken");

        if (rawCurrentUser) {
          storedUser = JSON.parse(rawCurrentUser);
        }
        storedJwtToken = rawJwtToken;

        if (storedJwtToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedJwtToken}`;
        } else {
          delete axios.defaults.headers.common['Authorization'];
        }
      } catch (e) {
        console.error("AuthContext: Error parsing auth data from localStorage:", e);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("jwtToken");
        storedUser = null; storedJwtToken = null;
      }

      setAuth({
        user: storedUser,
        jwtToken: storedJwtToken,
        isAuthLoading: false, // Mark as not loading after initial check
        authError: null,
      });
    };

    initializeAuthFromStorage();
  }, []); // Run only once on mount

  // Initialize location on mount
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  // Fetch products when location changes
  useEffect(() => {
    if (selectedLocation && !locationsLoading) {
      fetchAllProducts(selectedLocation);
    }
  }, [selectedLocation, locationsLoading, fetchAllProducts]);

  // Context value object
  const contextValue = useMemo(() => ({
    // Auth state - Directly expose properties for easier consumption
    user: auth.user,
    jwtToken: auth.jwtToken,
    isAuthLoading: auth.isAuthLoading,
    authError: auth.authError,
    currentRole,
    isLoggedIn,
    isAdmin,
    isSeller,

    // Auth methods
    register,
    login,
    adminLogin,
    vendorLogin,
    vendorRegister,
    logout,
    adminSignOut,
    vendorSignOut,
    authAxios,

    // Location state
    selectedLocation,
    availableLocations,
    locationsLoading,
    ipLocation,
    gpsLocation,
    userPreferredLocation,

    // Location methods
    updateUserLocation,
    initializeLocation,
    detectGpsLocation,
    detectIpLocation,

    // Products state
    products,
    productsLoading,
    productsError,

    // Products methods
    fetchAllProducts,

    // Cart state
    cartItems,

    // Cart methods
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,

    // UI state
    isOpen,
    setIsOpen,

    // Constants
    LOCATION_TYPE_IP,
    LOCATION_TYPE_GPS,
    LOCATION_TYPE_MANUAL,
    LOCATION_TYPE_DEFAULT,
  }), [
    // Auth state
    auth.user,
    auth.jwtToken,
    auth.isAuthLoading,
    auth.authError,
    currentRole,
    isLoggedIn,
    isAdmin,
    isSeller,

    // Auth methods
    register,
    login,
    adminLogin,
    vendorLogin,
    vendorRegister,
    logout,
    adminSignOut,
    vendorSignOut,
    authAxios, // authAxios is a useMemo, so it should be stable

    // Location state
    selectedLocation,
    availableLocations,
    locationsLoading,
    ipLocation,
    gpsLocation,
    userPreferredLocation,

    // Location methods
    updateUserLocation,
    initializeLocation,
    detectGpsLocation,
    detectIpLocation,

    // Products state
    products,
    productsLoading,
    productsError,

    // Products methods
    fetchAllProducts,

    // Cart state
    cartItems,

    // Cart methods
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,

    // UI state
    isOpen,
    setIsOpen,

    // Constants
    LOCATION_TYPE_IP,
    LOCATION_TYPE_GPS,
    LOCATION_TYPE_MANUAL,
    LOCATION_TYPE_DEFAULT,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;