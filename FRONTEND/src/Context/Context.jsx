// AuthContext.js
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { toast } from "react-toastify";
import axios from "axios";

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  // Auth State (for JWT from your backend)
  const [auth, setAuth] = useState(() => {
    let storedUser = null;
    let storedJwtToken = null;
    let isAuthLoading = true;

    try {
      storedUser = JSON.parse(localStorage.getItem("currentUser"));
      storedJwtToken = localStorage.getItem("jwtToken");

      if (storedJwtToken) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${storedJwtToken}`;
      } else {
        delete axios.defaults.headers.common["Authorization"];
      }

      isAuthLoading = false;
    } catch (e) {
      console.error("AuthContext: Error parsing auth data from localStorage:", e);
      localStorage.removeItem("currentUser");
      localStorage.removeItem("jwtToken");
      isAuthLoading = false;
    }

    return {
      user: storedUser,
      jwtToken: storedJwtToken,
      isAuthLoading: isAuthLoading,
      authError: null,
    };
  });

  // Wishlist State (now managed by your backend)
  const [wishlistItems, setWishlistItems] = useState([]);


  // Derived Auth State
  const currentRole = useMemo(() => auth.user?.role || null, [auth.user]);
  const isLoggedIn = useMemo(() => !!auth.jwtToken && !!auth.user, [
    auth.jwtToken,
    auth.user,
  ]);
  const isAdmin = useMemo(() => auth.user?.role === "admin", [auth.user]);
  const isSeller = useMemo(() => auth.user?.role === "seller", [auth.user]);

  // Cart State
  const CART_STORAGE_KEY = "user_cart_items";
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.error("AuthContext: Cart parse error:", e);
      return [];
    }
  });

  // UI State (e.g., for mobile menu in Header, though often managed locally)
  const [isOpen, setIsOpen] = useState(false);

  // Cart Methods
  const saveCartToStorage = useCallback((items) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("AuthContext: Failed to save cart:", e);
    }
  }, []);

  const upsertCartItem = useCallback(
    (productDetails, quantity) => {
      if (!productDetails || !productDetails._id) {
        toast.error("Invalid product details for cart operation.");
        return;
      }

      setCartItems((prev) => {
        const existingItemIndex = prev.findIndex((item) => item._id === productDetails._id);
        let newItems;

        if (existingItemIndex !== -1) {
          newItems = [...prev];
          newItems[existingItemIndex] = { ...newItems[existingItemIndex], quantity: quantity };
          toast.success(`${productDetails.name} quantity updated in cart!`);
        } else {
          newItems = [...prev, { ...productDetails, quantity: quantity }];
          toast.success(`${productDetails.name} added to cart!`);
        }

        saveCartToStorage(newItems);
        return newItems;
      });
    },
    [saveCartToStorage]
  );

  const addToCart = useCallback(
    (productId, quantity = 1, products) => {
      const product = products?.find((p) => p._id === productId);
      if (!product) {
        toast.error("Product not found for adding to cart.");
        return;
      }

      setCartItems((prev) => {
        const existing = prev.findIndex((item) => item._id === productId);
        let newItems;

        if (existing !== -1) {
          newItems = [...prev];
          newItems[existing].quantity += quantity;
          toast.success(`${product.name} quantity incremented!`);
        } else {
          newItems = [...prev, { ...product, quantity }];
          toast.success(`${product.name} added to cart!`);
        }

        saveCartToStorage(newItems);
        return newItems;
      });
    },
    [saveCartToStorage]
  );

  const updateCartItemQuantity = useCallback(
    (productId, newQuantity) => {
      setCartItems((prev) => {
        const newItems = prev.map((item) =>
          item._id === productId ? { ...item, quantity: newQuantity } : item
        );
        saveCartToStorage(newItems);
        return newItems;
      });
    },
    [saveCartToStorage]
  );

  const removeFromCart = useCallback(
    (productId) => {
      setCartItems((prev) => {
        const newItems = prev.filter((item) => item._id !== productId);
        saveCartToStorage(newItems);
        return newItems;
      });
      toast.info("Item removed from cart");
    },
    [saveCartToStorage]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    saveCartToStorage([]);
    toast.info("Cart cleared");
  }, [saveCartToStorage]);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce(
      (total, item) => total + (item.discountPrice || item.price) * (item.quantity || 1),
      0
    );
  }, [cartItems]);

  // Auth Methods
  const updateAuthLocalStorageAndState = useCallback((jwtToken, user) => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("currentUser");

    if (jwtToken && user) {
      localStorage.setItem("jwtToken", jwtToken);
      localStorage.setItem("currentUser", JSON.stringify(user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
      setAuth({ user, jwtToken, isAuthLoading: false, authError: null });
    } else {
      delete axios.defaults.headers.common["Authorization"];
      setAuth({ user: null, jwtToken: null, isAuthLoading: false, authError: null });
    }
  }, []);

  const logout = useCallback(async () => {
    setAuth((prev) => ({ ...prev, isAuthLoading: true }));
    try {
      updateAuthLocalStorageAndState(null, null);
      clearCart();
      setWishlistItems([]); // Clear wishlist on logout (frontend state)
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    } finally {
      setAuth((prev) => ({ ...prev, isAuthLoading: false }));
    }
  }, [updateAuthLocalStorageAndState, clearCart]);

  // Axios Instance with Interceptors
  const authAxios = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      withCredentials: true,
    });

    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("jwtToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout(); // Auto-logout on 401
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [logout]);

  // Auth Operations
  const register = useCallback(
    async (userData) => {
      setAuth((prev) => ({ ...prev, isAuthLoading: true }));
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/register`,
          userData
        );
        const { token, user, message } = res.data;

        if (token && user) {
          updateAuthLocalStorageAndState(token, user);
          toast.success(message || "Registration successful");
          return { success: true, message: message || "Registration successful" };
        }
        throw new Error(message || "Registration failed");
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        setAuth((prev) => ({ ...prev, authError: message }));
        toast.error(message);
        return { success: false, message };
      } finally {
        setAuth((prev) => ({ ...prev, isAuthLoading: false }));
      }
    },
    [updateAuthLocalStorageAndState]
  );

  const login = useCallback(
    async (credentials) => {
      setAuth((prev) => ({ ...prev, isAuthLoading: true }));
      try {
        const res = await authAxios.post("/api/auth/login", credentials);
        const { token, user, message } = res.data;

        if (token && user) {
          updateAuthLocalStorageAndState(token, user);
          toast.success(message || "Login successful");
          return { success: true, message: message || "Login successful" };
        }
        throw new Error(message || "Login failed");
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        setAuth((prev) => ({ ...prev, authError: message }));
        toast.error(message);
        return { success: false, message };
      } finally {
        setAuth((prev) => ({ ...prev, isAuthLoading: false }));
      }
    },
    [authAxios, updateAuthLocalStorageAndState]
  );

  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      setWishlistItems([]); 
      return;
    }
    try {
      const response = await authAxios.get('/api/wishlist'); 
      if (response.data.status === 'success') {
        setWishlistItems(response.data.data.wishlist || []);
      } else {
        toast.error(response.data.message || "Failed to fetch wishlist.");
        setWishlistItems([]);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Failed to load wishlist items.");
      setWishlistItems([]);
    }
  }, [isLoggedIn, authAxios]);

  const addToWishlist = useCallback(async (product) => {
    if (!isLoggedIn) {
      toast.error("Please log in to add items to your wishlist.");
      return false;
    }
    if (!product || !product._id) {
      toast.error("Invalid product details for wishlist operation.");
      return false;
    }

    try {
      const response = await authAxios.post('/api/wishlist/add', { productId: product._id });
      if (response.data.status === 'success') {
        fetchWishlist();
        toast.success(response.data.message || `${product.name} added to wishlist!`);
        return true;
      } else {
        toast.error(response.data.message || `Failed to add ${product.name} to wishlist.`);
        return false;
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      const errorMessage = error.response?.data?.message || error.message || `An unexpected error occurred while adding ${product.name} to wishlist.`;
      toast.error(errorMessage);
      return false;
    }
  }, [isLoggedIn, authAxios, fetchWishlist]);

  const removeFromWishlist = useCallback(async (productId, productName = "Item") => {
    if (!isLoggedIn) {
      toast.error("Please log in to manage your wishlist.");
      return false;
    }

    try {
      const response = await authAxios.delete(`/api/wishlist/remove/${productId}`);
      if (response.data.status === 'success') {
        fetchWishlist();
        toast.info(response.data.message || `${productName} removed from wishlist.`);
        return true;
      } else {
        toast.error(response.data.message || `Failed to remove ${productName} from wishlist.`);
        return false;
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      const errorMessage = error.response?.data?.message || error.message || `An unexpected error occurred while removing ${productName} from wishlist.`;
      toast.error(errorMessage);
      return false;
    }
  }, [isLoggedIn, authAxios, fetchWishlist]);

  const clearWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error("Please log in to clear your wishlist.");
      return false;
    }
    if (wishlistItems.length === 0) {
      toast.info("Your wishlist is already empty.");
      return true; // Already cleared
    }

    try {
      const response = await authAxios.delete('/api/wishlist/clear');
      if (response.data.status === 'success') {
        setWishlistItems([]); // Clear local state immediately
        toast.success(response.data.message || "Wishlist cleared successfully.");
        return true;
      } else {
        toast.error(response.data.message || "Failed to clear wishlist.");
        return false;
      }
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred while clearing wishlist.";
      toast.error(errorMessage);
      return false;
    }
  }, [isLoggedIn, authAxios, wishlistItems.length]);


  const isProductInWishlist = useCallback((productId) => {
    
    return wishlistItems.some(item => item.product?._id?.toString() === productId?.toString() || item.productId?.toString() === productId?.toString());
  }, [wishlistItems]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchWishlist();
    } else {
      setWishlistItems([]); 
    }
  }, [isLoggedIn, fetchWishlist]);


  // Context Value
  const contextValue = useMemo(
    () => ({
      // Auth State
      user: auth.user,
      jwtToken: auth.jwtToken,
      isAuthLoading: auth.isAuthLoading,
      authError: auth.authError,
      currentRole,
      isLoggedIn,
      isAdmin,
      isSeller,

      // Auth Methods
      register,
      login,
      logout,
      authAxios,

      // Cart State
      cartItems,

      // Cart Methods
      addToCart,
      upsertCartItem,
      updateCartItemQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,

      // Wishlist State & Methods
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isProductInWishlist,
      clearWishlist, 

      // UI State
      isOpen,
      setIsOpen,
    }),
    [
      auth,
      currentRole,
      isLoggedIn,
      isAdmin,
      isSeller,
      register,
      login,
      logout,
      authAxios,
      cartItems,
      addToCart,
      upsertCartItem,
      updateCartItemQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isProductInWishlist,
      clearWishlist,
      isOpen,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
