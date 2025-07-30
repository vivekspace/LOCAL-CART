import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, ArrowLeft, Loader2, LogIn, ChevronRight } from "lucide-react";
import { useContext, useCallback, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../Context/Context";
import { toast } from "react-toastify";

const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist, clearWishlist, isLoggedIn, upsertCartItem } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
console.log("Wishlist Items:", 
  wishlistItems
    .filter(item => item !== null && item !== undefined) // <-- Add this filter
    .map(item => item.product)
);
  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100,
        duration: 0.5,
      },
    },
    hover: {
      scale: 1.03,
      boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.1)",
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    },
    tap: {
      scale: 0.98
    }
  };

  const handleRemoveItem = useCallback((productId, productName) => {
    setConfirmModalMessage(`Remove "${productName}" from wishlist?`);
    setConfirmAction(() => async () => {
      setIsLoading(true);
      try {
        await removeFromWishlist(productId, productName);
        toast.success(`"${productName}" removed from wishlist`);
      } catch (error) {
        toast.error("Failed to remove item");
      } finally {
        setIsLoading(false);
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  }, [removeFromWishlist]);

  const handleAddAllToCart = useCallback(async () => {
    const availableItems = wishlistItems.filter(item => 
      (item.product?.stock || item.stock) > 0
    );
    
    if (availableItems.length === 0) {
      toast.warning("No available items in your wishlist");
      return;
    }
    
    setIsLoading(true);
    try {
      for (const item of availableItems) {
        await upsertCartItem(item.product || item, 1);
      }
      toast.success(`${availableItems.length} items added to cart`);
    } catch (error) {
      toast.error("Failed to add some items to cart");
    } finally {
      setIsLoading(false);
    }
  }, [wishlistItems, upsertCartItem]);

  const handleClearAll = useCallback(() => {
    if (wishlistItems.length === 0) {
      toast.info("Your wishlist is already empty.");
      return;
    }
    setConfirmModalMessage("Clear your entire wishlist?");
    setConfirmAction(() => async () => {
      setIsLoading(true);
      try {
        await clearWishlist();
        toast.success("Wishlist cleared");
      } catch (error) {
        toast.error("Failed to clear wishlist");
      } finally {
        setIsLoading(false);
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  }, [wishlistItems, clearWishlist]);



  const CustomConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm bg-opacity-50 bg-[#0000001a] flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 0.6 }}
              >
                <Heart size={48} className="text-red-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{message}</h3>
              <div className="flex justify-center gap-4">
                <motion.button
                  onClick={onCancel}
                  whileHover={{ scale: 1.05, backgroundColor: "#f3f4f6" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: "#dc2626",
                    boxShadow: "0px 5px 15px rgba(220, 38, 38, 0.3)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 bg-red-500 text-white rounded-lg transition-colors"
                >
                  Confirm
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

    const handleAddToCartFromWishlist = useCallback(async (product) => {
    if (!product || !product._id) {
      toast.error("Product information is missing");
      return;
    }
    if (product.stock === 0) {
      toast.warning("This item is out of stock");
      return;
    }
    setIsLoading(true);
    try {
      await upsertCartItem(product, 1);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error("Failed to add item to cart");
    } finally {
      setIsLoading(false);
    }
  }, [upsertCartItem]);



  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50"
    >
      <CustomConfirmModal
        isOpen={isConfirmModalOpen}
        message={confirmModalMessage}
        onConfirm={confirmAction}
        onCancel={() => setIsConfirmModalOpen(false)}
      />

      {/* Header with enhanced animation */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-white p-6 shadow-sm"
      >
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center text-sm text-gray-600 mb-4"
          >
            <Link to="/" className="hover:text-green-600">Home</Link>
            <ChevronRight size={16} className="mx-2" />
            <Link to="/wishlist" className="text-green-600 font-medium">Wishlist</Link>
          </motion.div>
          
          <div className="flex items-center justify-between">
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.05, x: -3 }}
              whileTap={{ scale: 0.95 }}
              className="flex text-sm items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Continue Shopping</span>
            </motion.button>
            <motion.h1 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 150 }}
              className="lg:md:text-3xl text-xl font-bold text-gray-800 lg:md:ml-0 ml-8"
            >
              My Wishlist
            </motion.h1>
            <div className="w-8"></div>
          </div>
        </div>
      </motion.header>

      {/* Main Content with enhanced animations */}
      <div className="container mx-auto p-4 md:p-6 pb-12">
        {!isLoggedIn ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20 bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto"
          >
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}
              className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <LogIn size={40} className="text-green-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your Wishlist Awaits
            </h2>
            <p className="text-gray-600 mb-8">
              Sign in to view your saved items and access your wishlist across all your devices.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.div whileHover={{ y: -2 }}>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <LogIn size={18} />
                  Sign In
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }}>
                <Link
                  to="/register"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Create Account
                </Link>
              </motion.div>
            </div>
          </motion.div>
        ) : wishlistItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-20 bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                transition: { repeat: Infinity, duration: 2 }
              }}
              className="bg-pink-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Heart 
                size={40} 
                className="text-pink-500 fill-pink-500"
              />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-gray-600 mb-8">
              Start saving your favorite items to keep track of what you love.
            </p>
            <motion.button
              onClick={() => navigate("/shopping")}
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0px 5px 15px rgba(22, 163, 74, 0.3)"
              }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors font-medium mx-auto"
            >
              Explore Products
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-gray-800"
              >
                My Wishlist ({wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"})
              </motion.h2>
              <motion.button
                onClick={handleClearAll}
                whileHover={{ 
                  scale: 1.03,
                  color: "#dc2626"
                }}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
                <span>Clear All</span>
              </motion.button>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {wishlistItems.map((item) => (
                  <motion.div
                    key={item.product?._id || item._id}
                    variants={itemVariants}
                    whileHover="hover"
                    whileTap="tap"
                    layout
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:border-green-100 transition-all"
                  >
                    <Link 
                      to={`/product-info/${item.product?._id || item._id}`}
                      className="block group"
                    >
                      <div className="relative aspect-square">
                        <motion.img
                          initial={{ opacity: 0.9 }}
                          whileHover={{ opacity: 1, scale: 1.02 }}
                          src={item.product.images[0]?.url || item.product?.mainImage || item.product?.images?.[0] || item.images?.[0] || "/placeholder.png"}
                          alt={item.productName || item.name || "Wishlist Item"}
                          className="w-full h-full object-cover transition-all duration-300"
                        />
                        <motion.button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveItem(item.product?._id || item._id, item.productName || item.name);
                          }}
                          whileHover={{ 
                            scale: 1.1,
                            rotate: 10
                          }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-red-50"
                        >
                          <Heart size={20} className="text-red-500 fill-red-500" />
                        </motion.button>
                        {item.product?.stock === 0 && (
                          <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="absolute top-0 left-0 bg-red-500 text-white px-3 py-1 text-xs font-semibold rounded-br-xl"
                          >
                            Out of Stock
                          </motion.div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 line-clamp-1">
                        {item.productName || item.name}
                      </h3>
                      <div className="flex items-center mt-1">
                        <motion.p 
                          whileHover={{ scale: 1.05 }}
                          className="text-green-600 font-bold"
                        >
                          ${(item.productPrice || item.product?.discountPrice || item.product?.price || 0).toFixed(2)}
                        </motion.p>
                        {item.product?.originalPrice && (
                          <p className="text-gray-400 text-sm line-through ml-2">
                            ${item.product.originalPrice.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between mt-4">
                        <motion.button
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCartFromWishlist(item.product || item);
                          }}
                          disabled={item.product?.stock === 0 || isLoading}
                          whileHover={{ 
                            scale: item.product?.stock > 0 ? 1.05 : 1,
                            boxShadow: item.product?.stock > 0 ? "0px 5px 15px rgba(22, 163, 74, 0.3)" : "none"
                          }}
                          whileTap={{ scale: item.product?.stock > 0 ? 0.95 : 1 }}
                          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                            item.product?.stock > 0
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          } transition-colors`}
                        >
                          {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <ShoppingCart size={16} />
                          )}
                          <span>{item.product?.stock > 0 ? "Add to Cart" : "Out of Stock"}</span>
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveItem(item.product?._id || item._id, item.productName || item.name);
                          }}
                          whileHover={{ 
                            scale: 1.1,
                            color: "#dc2626"
                          }}
                          whileTap={{ scale: 0.9 }}
                          className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {wishlistItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="mt-10 bg-white border border-green-100 p-6 rounded-xl shadow-sm"
              >
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Ready to checkout?</h3>
                    <p className="mt-1 text-gray-600">
                      Move all available items to your shopping cart
                    </p>
                  </div>
                  <motion.button
                    onClick={handleAddAllToCart}
                    disabled={isLoading}
                    whileHover={{ 
                      scale: 1.03,
                      boxShadow: "0px 5px 20px rgba(22, 163, 74, 0.4)"
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-sm hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <motion.div
                        animate={{
                          x: [0, 2, 0],
                          transition: { repeat: Infinity, duration: 1.5 }
                        }}
                      >
                        <ShoppingCart size={18} />
                      </motion.div>
                    )}
                    <span>Add All to Cart</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default WishlistPage;