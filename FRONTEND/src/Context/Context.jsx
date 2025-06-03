import React, { createContext, useState, useContext } from "react";
import { toast } from "react-toastify";
import { login as apiLogin, register as apiRegister } from "/api";

import { useEffect } from "react";
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products");

        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const products = data.data.products;

        setProducts(Array.isArray(products) ? products : []);
      } catch (error) {
        console.error("Fetch error: Failed to fetch products", error);
      }
    };

    fetchProducts();
  }, []);

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
  const [isDark, setIsDark] = useState(false);

const toggleDarkMode = () => {
  const html = document.documentElement;
  const nowDark = !html.classList.contains("dark");

  if (nowDark) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }

  setIsDark(nowDark); // ✅ Update state
  localStorage.setItem("theme", nowDark ? "dark" : "light");
};

// Optional: load theme from storage on first mount
useEffect(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    setIsDark(true); // ✅ Sync initial state
  }
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
        toggleDarkMode,
        isDark,
        setIsDark
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
