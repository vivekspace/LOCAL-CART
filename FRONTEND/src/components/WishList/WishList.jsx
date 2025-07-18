import { motion } from "framer-motion";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.1)",
    },
  };

  const CustomConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 bg-[#0000001a] flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center"
        >
          <Heart size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{message}</h3>
          <div className="flex justify-center gap-4">
            <motion.button
              onClick={onCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={onConfirm}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Confirm
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomConfirmModal
        isOpen={isConfirmModalOpen}
        message={confirmModalMessage}
        onConfirm={confirmAction}
        onCancel={() => setIsConfirmModalOpen(false)}
      />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white p-6 shadow-sm"
      >
        <div className="container mx-auto">
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <Link to="/" className="hover:text-green-600">Home</Link>
            <ChevronRight size={16} className="mx-2" />
            <Link to="/wishlist" className="text-green-600 font-medium">Wishlist</Link>
          </div>
          
          <div className="flex items-center justify-between">
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Continue Shopping</span>
            </motion.button>
            <h1 className="text-3xl font-bold text-gray-800">My Wishlist</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto p-4 md:p-6 pb-12">
        {!isLoggedIn ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto"
          >
            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your Wishlist Awaits
            </h2>
            <p className="text-gray-600 mb-8">
              Sign in to view your saved items and access your wishlist across all your devices.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/login"
                className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Create Account
              </Link>
            </div>
          </motion.div>
        ) : wishlistItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto"
          >
            <div className="bg-pink-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-pink-500 fill-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-gray-600 mb-8">
              Start saving your favorite items to keep track of what you love.
            </p>
            <motion.button
              onClick={() => navigate("/shopping")}
              whileHover={{ scale: 1.03 }}
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
                className="text-xl font-bold text-gray-800"
              >
                My Wishlist ({wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"})
              </motion.h2>
              <motion.button
                onClick={handleClearAll}
                whileHover={{ scale: 1.03 }}
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
              {wishlistItems.map((item) => (
                <motion.div
                  key={item.product?._id || item._id}
                  variants={itemVariants}
                  whileHover="hover"
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:border-green-100 transition-all"
                >
                  <Link 
                    to={`/product-info/${item.product?._id || item._id}`}
                    className="block group"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={item.productImageUrl && (item.product?.images?.[0] ? 
                          `${import.meta.env.VITE_API_URL}/uploads/${item.product.images[0]}` : 
                          `https://placehold.co/400x300/E0F2F1/00796B?text=${item.productName || item.name}`)}
                        alt={item.productName || item.name || "Wishlist Item"}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                      <motion.button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveItem(item.product?._id || item._id, item.productName || item.name);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-red-50"
                      >
                        <Heart size={20} className="text-red-500 fill-red-500" />
                      </motion.button>
                      {item.product?.stock === 0 && (
                        <div className="absolute top-0 left-0 bg-red-500 text-white px-3 py-1 text-xs font-semibold rounded-br-xl">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">
                      {item.productName || item.name}
                    </h3>
                    <div className="flex items-center mt-1">
                      <p className="text-green-600 font-bold">
                        ${(item.productPrice || item.product?.discountPrice || item.product?.price || 0).toFixed(2)}
                      </p>
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
                        whileHover={{ scale: item.product?.stock > 0 ? 1.05 : 1 }}
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
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {wishlistItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
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
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-sm hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <ShoppingCart size={18} />
                    )}
                    <span>Add All to Cart</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;