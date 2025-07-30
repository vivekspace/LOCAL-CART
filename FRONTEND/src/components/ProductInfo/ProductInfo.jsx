import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../Context/Context";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MapComponent from "../MapComponent/MapComponent";
import { Helmet } from "react-helmet-async";
import {
  Heart,
  ShoppingCart,
  Loader2,
  Star,
  MapPin,
  Home,
  ChevronRight,
  Info,
  Truck,
  Check,
  Leaf,
  Shield,
  Clock,
  Package,
  ArrowRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Constants
const DEFAULT_PRODUCT_IMAGE_PATH = "/uploads/default-product.png";

// Image error handler
const handleImageError = (e) => {
  e.target.src = `${import.meta.env.VITE_API_URL}${DEFAULT_PRODUCT_IMAGE_PATH}`;
  e.target.onerror = null;
  e.target.className = "w-full h-full object-contain bg-gray-50 p-4";
};

// Star Rating Component
const StarRating = ({ rating, setRating, interactive = false }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : "div"}
          onClick={interactive ? () => setRating(star) : null}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={interactive ? 28 : 18}
            className={`transition-colors ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            } ${interactive ? "hover:scale-110" : ""}`}
          />
        </button>
      ))}
    </div>
  );
};

// --- OPTIMIZED ProductImageGallery Component ---
const ProductImageGallery = ({ product, selectedImage, setSelectedImage }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState({});

  // ✅ OPTIMIZED: Better image processing with error handling
  const productImages = useMemo(() => {
    if (product?.images?.length > 0) {
      return product.images
        .filter(imageObj => imageObj && imageObj.url)
        .map(imageObj => ({
          url: imageObj.url,
          alt: imageObj.altText || `${product.name} image`,
          id: imageObj.public_id || Math.random().toString(36).substr(2, 9)
        }));
    }
    
    if (product?.mainImage) {
      return [{
        url: product.mainImage,
        alt: `${product.name} main image`,
        id: 'main'
      }];
    }
    
    return [{
      url: `${import.meta.env.VITE_API_URL}${DEFAULT_PRODUCT_IMAGE_PATH}`,
      alt: 'Default product image',
      id: 'default'
    }];
  }, [product]);

  // ✅ OPTIMIZED: Cloudinary image optimization
  const getOptimizedImageUrl = useCallback((originalUrl, width = 400, height = 400, quality = 'auto') => {
    if (!originalUrl) return `${import.meta.env.VITE_API_URL}${DEFAULT_PRODUCT_IMAGE_PATH}`;
    
    // If it's a Cloudinary URL, add transformations
    if (originalUrl.includes('cloudinary.com')) {
      const parts = originalUrl.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/w_${width},h_${height},c_fill,f_${quality},q_auto,dpr_auto/${parts[1]}`;
      }
    }
    return originalUrl;
  }, []);

  // ✅ OPTIMIZED: Handle image errors with state tracking
  const handleImageErrorWithState = useCallback((e, imageId) => {
    if (!imageLoadErrors[imageId]) {
      setImageLoadErrors(prev => ({ ...prev, [imageId]: true }));
      e.target.src = `${import.meta.env.VITE_API_URL}${DEFAULT_PRODUCT_IMAGE_PATH}`;
      e.target.onerror = null;
    }
  }, [imageLoadErrors]);

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImage(0);
    setImageLoadErrors({});
  }, [product?.images, setSelectedImage]);

  const handleSwipe = useCallback(
    (swipeDirection) => {
      if (swipeDirection === "left") {
        setSelectedImage((prev) =>
          prev < productImages.length - 1 ? prev + 1 : 0
        );
      } else {
        setSelectedImage((prev) =>
          prev > 0 ? prev - 1 : productImages.length - 1
        );
      }
    },
    [productImages.length, setSelectedImage]
  );

  const handleDragEnd = useCallback(
    (event, info) => {
      if (info.offset.x > 30) {
        handleSwipe("right");
      } else if (info.offset.x < -30) {
        handleSwipe("left");
      }
    },
    [handleSwipe]
  );

  // Touch swipe handling
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleSwipe("left");
    } else if (isRightSwipe) {
      handleSwipe("right");
    }
  }, [touchStart, touchEnd, handleSwipe, minSwipeDistance]);

  const currentImage = productImages[selectedImage] || productImages[0];

  return (
    <div className="w-full md:w-1/2 p-3 sm:p-4 md:p-6">
      {/* ✅ OPTIMIZED: Main Image Container with better responsive design */}
      <div className="relative w-full mb-4 group">
        <div
          className="relative w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-zoom-in"
          style={{
            aspectRatio: '1/1',
            maxHeight: 'min(70vh, 600px)',
            minHeight: '300px'
          }}
          onClick={() => setIsFullscreen(true)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* ✅ IMPROVED: Better image container with proper centering */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-4"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            dragElastic={0.1}
            whileTap={{ cursor: "grabbing" }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* ✅ OPTIMIZED: Better image rendering with proper sizing */}
              <picture className="w-full h-full flex items-center justify-center">
                <source
                  media="(min-width: 768px)"
                  srcSet={getOptimizedImageUrl(currentImage?.url, 600, 600, 'auto')}
                />
                <source
                  media="(min-width: 480px)"
                  srcSet={getOptimizedImageUrl(currentImage?.url, 400, 400, 'auto')}
                />
                <motion.img
                  src={getOptimizedImageUrl(currentImage?.url, 300, 300, 'auto')}
                  alt={currentImage?.alt || `${product?.name || 'Product'} image`}
                  className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                  style={{
                    maxWidth: '90%',
                    maxHeight: '90%',
                  }}
                  loading="eager"
                  onError={(e) => handleImageErrorWithState(e, currentImage?.id)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  key={`${selectedImage}-${currentImage?.id}`}
                  draggable="false"
                />
              </picture>
            </div>
          </motion.div>

          {/* Badges */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col space-y-1 sm:space-y-2 z-10">
            {product?.isNew && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-green-500 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full shadow-md"
              >
                NEW
              </motion.div>
            )}
            {product?.discountPrice && product?.price > product?.discountPrice && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-red-500 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full shadow-md"
              >
                {Math.round(
                  ((product.price - product.discountPrice) / product.price) * 100
                )}
                % OFF
              </motion.div>
            )}
          </div>

          {/* Navigation Arrows */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwipe("right");
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all opacity-0 md:group-hover:opacity-100 hidden md:block z-10"
                type="button"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwipe("left");
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all opacity-0 md:group-hover:opacity-100 hidden md:block z-10"
                type="button"
                aria-label="Next image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Mobile indicators */}
          {productImages.length > 1 && (
            <>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full md:hidden">
                {selectedImage + 1}/{productImages.length}
              </div>
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full md:hidden flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                <span>Swipe</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ✅ OPTIMIZED: Thumbnail grid with better responsive layout */}
      {productImages.length > 1 && (
        <div className="hidden sm:block">
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-4 gap-2 sm:gap-3">
            {productImages.map((image, index) => (
              <motion.button
                key={`${image.id}-${index}`}
                onClick={() => setSelectedImage(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative bg-white rounded-lg sm:rounded-xl overflow-hidden transition-all border-2 ${
                  selectedImage === index
                    ? "border-green-500 ring-2 ring-green-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{ aspectRatio: '1/1' }}
                type="button"
                aria-label={`View image ${index + 1}`}
              >
                <div className="absolute inset-0 flex items-center justify-center p-1">
                  <img
                    src={getOptimizedImageUrl(image.url, 150, 150, 'auto')}
                    alt={image.alt}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    loading="lazy"
                    onError={(e) => handleImageErrorWithState(e, `thumb-${image.id}`)}
                  />
                </div>
                {/* Selected overlay */}
                {selectedImage === index && (
                  <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ✅ OPTIMIZED: Mobile dots with better styling */}
      {productImages.length > 1 && (
        <div className="flex justify-center space-x-2 mt-3 sm:hidden">
          {productImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`h-2 rounded-full transition-all ${
                selectedImage === index
                  ? "bg-green-500 w-6"
                  : "bg-gray-300 hover:bg-gray-400 w-2"
              }`}
              type="button"
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* ✅ OPTIMIZED: Fullscreen Gallery with better image handling */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/20 transition-colors z-50"
              onClick={() => setIsFullscreen(false)}
              aria-label="Close fullscreen"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              className="w-full h-full flex items-center justify-center relative"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              dragElastic={0.1}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* ✅ OPTIMIZED: Better fullscreen image container */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="relative max-w-full max-h-full bg-white rounded-2xl p-4 flex items-center justify-center">
                  <picture className="flex items-center justify-center">
                    <motion.img
                      src={getOptimizedImageUrl(currentImage?.url, 1200, 1200, 'auto')}
                      alt={currentImage?.alt || `${product?.name || 'Product'} fullscreen image`}
                      className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                      style={{
                        maxWidth: 'calc(100vw - 4rem)',
                        maxHeight: 'calc(100vh - 8rem)',
                      }}
                      loading="eager"
                      onError={(e) => handleImageErrorWithState(e, `fullscreen-${currentImage?.id}`)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      key={`fullscreen-${selectedImage}-${currentImage?.id}`}
                      draggable="false"
                    />
                  </picture>
                </div>
              </div>

              {/* Navigation arrows for fullscreen */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwipe("right");
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full shadow-md transition-all z-10"
                    type="button"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwipe("left");
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full shadow-md transition-all z-10"
                    type="button"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Image counter for fullscreen */}
              {productImages.length > 1 && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-full z-10">
                  {selectedImage + 1}/{productImages.length}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- ProductPrice Component ---
const ProductPrice = ({ product, quantity = 1 }) => {
  const safeQuantity = Math.max(1, quantity);
  const finalPrice = product?.discountPrice || product?.price || 0;
  const originalPrice = product?.price || 0;

  const discountPercentage = useMemo(() => {
    if (
      product?.discountPrice &&
      originalPrice > finalPrice &&
      originalPrice > 0
    ) {
      return Math.round((1 - finalPrice / originalPrice) * 100);
    }
    return 0;
  }, [product, originalPrice, finalPrice]);

  return (
    <div className="mb-4">
      {discountPercentage > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <motion.p
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold text-green-600"
          >
            ${(finalPrice * safeQuantity).toFixed(2)}
          </motion.p>
          <p className="text-lg text-gray-400 line-through">
            ${(originalPrice * safeQuantity).toFixed(2)}
          </p>
          <motion.span
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full"
          >
            Save {discountPercentage}%
          </motion.span>
        </div>
      ) : (
        <p className="text-3xl font-bold text-green-600">
          ${(originalPrice * safeQuantity).toFixed(2)}
        </p>
      )}
    </div>
  );
};

// --- QuantitySelector Component ---
const QuantitySelector = ({ quantity, onIncrease, onDecrease, maxStock }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <span className="text-gray-700 font-medium">Quantity:</span>
      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <motion.button
          onClick={onDecrease}
          disabled={quantity <= 1}
          whileTap={{ scale: 0.95 }}
          className="bg-gray-50 text-gray-600 hover:bg-gray-100 px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          −
        </motion.button>
        <span className="w-12 text-center py-2 border-x border-gray-200 font-medium">
          {quantity}
        </span>
        <motion.button
          onClick={onIncrease}
          disabled={quantity >= maxStock}
          whileTap={{ scale: 0.95 }}
          className="bg-gray-50 text-gray-600 hover:bg-gray-100 px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </motion.button>
      </div>
    </div>
  );
};

// --- ProductCardPage Component ---
const ProductCardPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [foundProduct, setFoundProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("description");

  const {
    upsertCartItem,
    updateCartItemQuantity,
    cartItems,
    authAxios,
    addToWishlist,
    removeFromWishlist,
    isProductInWishlist,
    isLoggedIn,
  } = useContext(AuthContext);

  const isInWishlist = useMemo(() => {
    return foundProduct ? isProductInWishlist(foundProduct._id) : false;
  }, [foundProduct, isProductInWishlist]);

  const getProductQuantityInCart = useCallback(() => {
    if (!Array.isArray(cartItems) || !foundProduct?._id) return 0;
    const cartItem = cartItems.find(
      (item) => item._id?.toString() === foundProduct._id.toString()
    );
    return cartItem?.quantity || 0;
  }, [cartItems, foundProduct]);

  const fetchProductAndRelated = useCallback(async () => {
    setLoading(true);
    setFoundProduct(null);
    setRelatedProducts([]);

    if (!productId) {
      setLoading(false);
      return;
    }

    try {
      const productApiUrl = `${
        import.meta.env.VITE_API_URL
      }/api/products/${productId}?populate=reviews`;
      const productResponse = await authAxios.get(productApiUrl);
      const fetchedProduct = productResponse.data?.data?.product;

      if (fetchedProduct) {
        setFoundProduct(fetchedProduct);
        setSelectedImage(0);

        if (fetchedProduct.category) {
          const relatedProductsApiUrl = `${
            import.meta.env.VITE_API_URL
          }/api/products?category=${
            fetchedProduct.category
          }&limit=4&exclude=${productId}`;
          const relatedRes = await authAxios.get(relatedProductsApiUrl);
          if (relatedRes.data?.status === "success") {
            setRelatedProducts(
              relatedRes.data.data.products.filter((p) => p._id !== productId)
            );
          }
        }
      }
    } catch (error) {
      toast.error("Failed to load product details.", {
        position: "top-center",
      });
      console.error("Product fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [productId, authAxios]);

  useEffect(() => {
    setQuantity(1);
    setSelectedImage(0);
    setActiveTab("description");
  }, [productId]);

  useEffect(() => {
    fetchProductAndRelated();
  }, [fetchProductAndRelated]);

  const handleQuantityChange = useCallback(
    (change) => {
      if (!foundProduct) return;

      const newQuantity = Math.max(1, quantity + change);
      if (
        foundProduct.stock !== undefined &&
        newQuantity > foundProduct.stock
      ) {
        toast.warn(`Cannot add more than ${foundProduct.stock} items.`, {
          position: "top-center",
        });
        return;
      }

      setQuantity(newQuantity);
      const currentCartQuantity = getProductQuantityInCart();
      if (currentCartQuantity > 0) {
        updateCartItemQuantity(foundProduct._id.toString(), newQuantity);
      }
    },
    [quantity, foundProduct, updateCartItemQuantity, getProductQuantityInCart]
  );

  const handleWishlistToggle = useCallback(async () => {
    if (!foundProduct) return;
    isInWishlist
      ? await removeFromWishlist(foundProduct._id, foundProduct.name)
      : await addToWishlist(foundProduct);

    if (!isInWishlist) {
      toast.success("Added to wishlist!", { position: "top-center" });
    }
  }, [foundProduct, isInWishlist, addToWishlist, removeFromWishlist]);

  const handleAddToCart = useCallback(() => {
    if (!foundProduct) {
      toast.error("Product information is missing.", { autoClose: 3000 });
      return;
    }

    if (foundProduct.stock !== undefined && quantity > foundProduct.stock) {
      toast.error(`Only ${foundProduct.stock} available in stock.`, {
        autoClose: 3000,
      });
      return;
    }

    upsertCartItem(foundProduct, quantity);
    toast.success(
      <div className="flex items-center">
        <Check className="mr-2 text-green-500" size={18} />
        Added {quantity} item(s) to cart!
      </div>,
      { position: "top-center" }
    );
  }, [foundProduct, quantity, upsertCartItem]);

  const handleBuyNow = useCallback(() => {
    if (!foundProduct) {
      toast.error("Product information is missing.", { autoClose: 3000 });
      return;
    }

    if (foundProduct.stock !== undefined && quantity > foundProduct.stock) {
      toast.error(`Only ${foundProduct.stock} available in stock.`, {
        autoClose: 3000,
      });
      return;
    }

    upsertCartItem(foundProduct, quantity);
    navigate("/cart");
  }, [foundProduct, quantity, upsertCartItem, navigate]);

  // Review Submission State & Handlers
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState("");

  const handleReviewRatingChange = useCallback((rating) => {
    setNewReviewRating(rating);
  }, []);

  const handleReviewCommentChange = useCallback((e) => {
    setNewReviewComment(e.target.value);
  }, []);

  const handleReviewSubmit = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error("Please login to submit a review!", {
        position: "top-center",
      });
      navigate("/login");
      return;
    }
    if (newReviewRating === 0) {
      toast.error("Please provide a star rating!", { position: "top-center" });
      return;
    }

    try {
      const response = await authAxios.post(
        `${import.meta.env.VITE_API_URL}/api/reviews`,
        {
          rating: newReviewRating,
          comment: newReviewComment,
          product: foundProduct._id,
        }
      );

      if (response.data.status === "success") {
        toast.success("Review submitted successfully!", {
          position: "top-center",
        });
        setNewReviewRating(0);
        setNewReviewComment("");
        fetchProductAndRelated();
      } else {
        toast.error(response.data.message || "Failed to submit review.", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred during review submission.",
        { position: "top-center" }
      );
    }
  }, [
    isLoggedIn,
    newReviewRating,
    newReviewComment,
    foundProduct,
    authAxios,
    navigate,
    fetchProductAndRelated,
  ]);

  const stockStatus = useMemo(() => {
    if (!foundProduct || foundProduct.stock === undefined)
      return "Loading stock...";
    if (foundProduct.stock === 0) return "Out of Stock";
    if (foundProduct.stock <= 5) return `Only ${foundProduct.stock} left!`;
    return "In Stock";
  }, [foundProduct]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden md:flex">
          <div className="md:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 h-96 animate-pulse"></div>
          <div className="md:w-1/2 p-6 space-y-4">
            <div className="h-8 bg-gray-100 rounded-full w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded-full w-1/2 animate-pulse"></div>
            <div className="h-6 bg-gray-100 rounded-full w-1/4 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded-full w-full animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded-full w-full animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded-full w-2/3 animate-pulse"></div>
            <div className="h-12 bg-gray-100 rounded-xl w-1/3 mt-8 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!foundProduct) {
    return (
      <div className="container mx-auto py-8 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md w-full"
        >
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <Info className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Product not found
          </h3>
          <p className="text-gray-500 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{foundProduct.name} | EcoHarvest</title>
        <meta
          name="description"
          content={`${foundProduct.name} - ${
            foundProduct.description?.substring(0, 150) ||
            "High-quality organic product"
          }`}
        />
        <meta
          property="og:title"
          content={`${foundProduct.name} - EcoHarvest`}
        />
        <meta
          property="og:description"
          content={foundProduct.description?.substring(0, 150) || ""}
        />
        <meta
          property="og:image"
          content={
            foundProduct.images?.[0]?.url ||
            `${import.meta.env.VITE_API_URL}${DEFAULT_PRODUCT_IMAGE_PATH}`
          }
        />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex mb-6"
          aria-label="Breadcrumb"
        >
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link
                to="/"
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-5 h-5 text-gray-400" />
                <Link
                  to="/shopping"
                  className="ml-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  Products
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <ChevronRight className="w-5 h-5 text-gray-400" />
                <span className="ml-2 text-sm font-medium text-gray-500 truncate">
                  {foundProduct.name}
                </span>
              </div>
            </li>
          </ol>
        </motion.nav>

        {/* ✅ OPTIMIZED: Main Product Card with better responsive layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl"
        >
          <div className="flex flex-col md:flex-row min-h-[400px]">
            <ProductImageGallery
              product={foundProduct}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
            />

            {/* ✅ OPTIMIZED: Product Details with better mobile layout */}
            <div className="md:w-1/2 p-4 md:p-6 flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full mb-2"
                    >
                      {foundProduct.category}
                    </motion.span>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
                      {foundProduct.name}
                    </h1>
                  </div>
                  <motion.button
                    onClick={handleWishlistToggle}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.8 }}
                    className="p-2 rounded-full transition-all flex-shrink-0 ml-2"
                    aria-label={
                      isInWishlist ? "Remove from wishlist" : "Add to wishlist"
                    }
                  >
                    <Heart
                      size={24}
                      className={`transition-all ${
                        isInWishlist
                          ? "text-red-500 fill-red-500"
                          : "text-gray-400 hover:text-red-500"
                      }`}
                    />
                  </motion.button>
                </div>

                {/* Product Rating Display */}
                <div className="flex items-center mb-4">
                  <div className="flex">
                    <StarRating rating={foundProduct.ratingsAverage || 0} />
                  </div>
                  <span className="text-gray-500 text-sm ml-2">
                    ({foundProduct.ratingsQuantity || 0} reviews)
                  </span>
                </div>

                {/* Seller Info */}
                <div className="flex items-center text-gray-500 text-sm mb-4 flex-wrap">
                  <MapPin size={16} className="mr-1 flex-shrink-0" />
                  <span className="mr-1">Sold by:</span>
                  {foundProduct.seller?.name ? (
                    <Link
                      to={`/vendor/${foundProduct.seller._id}`}
                      className="text-green-600 hover:underline"
                    >
                      {foundProduct.seller.name}
                    </Link>
                  ) : (
                    <span>Unknown Seller</span>
                  )}
                  {foundProduct.location?.city && (
                    <span className="ml-1">({foundProduct.location.city})</span>
                  )}
                </div>

                {/* Price */}
                <ProductPrice product={foundProduct} quantity={quantity} />

                {/* Stock Status */}
                <div
                  className={`flex items-center text-sm mb-4 font-medium ${
                    foundProduct.stock === 0
                      ? "text-red-600"
                      : foundProduct.stock <= 5
                      ? "text-amber-600"
                      : "text-green-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                      foundProduct.stock === 0
                        ? "bg-red-600"
                        : foundProduct.stock <= 5
                        ? "bg-amber-600"
                        : "bg-green-600"
                    }`}
                  ></div>
                  {stockStatus}
                </div>

                {/* Description */}
                <p className="text-gray-700 mb-6 leading-relaxed text-sm sm:text-base">
                  {foundProduct.description ||
                    "Premium organic product carefully sourced for quality and freshness."}
                </p>

                {/* ✅ OPTIMIZED: Product Highlights with better mobile layout */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Leaf className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500 flex-shrink-0" />
                    <span>Organic</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500 flex-shrink-0" />
                    <span>Quality Guarantee</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500 flex-shrink-0" />
                    <span>Fresh Daily</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500 flex-shrink-0" />
                    <span>Eco Packaging</span>
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className="mb-6">
                  <QuantitySelector
                    quantity={quantity}
                    onIncrease={() => handleQuantityChange(1)}
                    onDecrease={() => handleQuantityChange(-1)}
                    maxStock={foundProduct.stock}
                  />

                  <div className="space-y-3">
                    <motion.button
                      onClick={handleAddToCart}
                      disabled={foundProduct.stock === 0}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      <ShoppingCart size={18} className="mr-2" />
                      Add to Cart
                    </motion.button>

                    <motion.button
                      onClick={handleBuyNow}
                      disabled={foundProduct.stock === 0}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 font-medium py-3 px-6 rounded-lg shadow-sm transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      Buy Now <ArrowRight className="ml-2" size={18} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Truck size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                  <span>Delivery expected within 2-4 business days</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ✅ OPTIMIZED: Product Details Tabs with better mobile experience */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex -mb-px min-w-max">
              {[
                { key: "description", label: "Description" },
                { key: "reviews", label: `Reviews (${foundProduct.ratingsQuantity || 0})` },
                { key: "shipping", label: "Shipping & Returns" }
              ].map((tab) => (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  whileHover={{ y: -2 }}
                  className={`py-4 px-4 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </nav>
          </div>
          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
{activeTab === "description" && (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-4">
      Product Details
    </h3>
    <ul className="space-y-3 text-gray-700 text-sm sm:text-base">
      {[
        "100% organic and locally sourced ingredients",
        "Harvested at peak freshness for maximum flavor and nutrition",
        "Packaged with care using sustainable materials to preserve quality",
        "Certified by local agricultural authorities for quality and safety",
        "Sustainably grown and produced with minimal environmental impact"
      ].map((item, index) => (
        <li key={index} className="flex items-start">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
)}

                {activeTab === "reviews" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Customer Reviews
                    </h3>

                    {/* Review Submission Form */}
                    {isLoggedIn ? (
                      <div className="bg-gradient-to-br from-gray-50 to-green-50 p-4 sm:p-6 rounded-xl shadow-inner mb-8">
                        <h4 className="text-xl font-semibold text-gray-800 mb-4">
                          Write a Review
                        </h4>
                        <div className="mb-4">
                          <label
                            htmlFor="review-rating"
                            className="block text-gray-700 text-sm font-bold mb-2"
                          >
                            Your Rating
                          </label>
                          <StarRating
                            rating={newReviewRating}
                            setRating={handleReviewRatingChange}
                            interactive={true}
                          />
                        </div>
                        <div className="mb-4">
                          <label
                            htmlFor="review-comment"
                            className="block text-gray-700 text-sm font-bold mb-2"
                          >
                            Your Comment (Optional)
                          </label>
                          <textarea
                            id="review-comment"
                            rows="4"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                            placeholder="Share your thoughts about the product..."
                            value={newReviewComment}
                            onChange={handleReviewCommentChange}
                          ></textarea>
                        </div>
                        <motion.button
                          onClick={handleReviewSubmit}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all text-sm sm:text-base"
                        >
                          Submit Review
                        </motion.button>
                      </div>
                    ) : (
                      <p className="text-gray-600 mb-8 text-sm sm:text-base">
                        Please{" "}
                        <Link
                          to="/login"
                          className="text-green-600 hover:underline font-medium"
                        >
                          login
                        </Link>{" "}
                        to write a review.
                      </p>
                    )}

                    {/* List of Existing Reviews */}
                    <div className="space-y-6">
                      {foundProduct.reviews &&
                      foundProduct.reviews.length > 0 ? (
                        foundProduct.reviews
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt) - new Date(a.createdAt)
                          )
                          .map((review) => (
                            <motion.div
                              key={review._id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-b border-gray-200 pb-6 last:border-b-0"
                            >
                              <div className="flex items-center mb-2">
                                <h4 className="font-semibold text-gray-800 mr-2 text-sm sm:text-base">
                                  {review.user?.name || "Anonymous User"}
                                </h4>
                                <span className="text-yellow-500 flex items-center">
                                  <Star
                                    size={16}
                                    fill="currentColor"
                                    stroke="none"
                                  />
                                  <span className="ml-1 text-sm">
                                    {review.rating.toFixed(1)}
                                  </span>
                                </span>
                              </div>
                              <p className="text-gray-600 mb-2 text-sm sm:text-base">
                                {review.comment}
                              </p>
                              <p className="text-gray-400 text-xs sm:text-sm">
                                Reviewed on{" "}
                                {new Date(review.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                            </motion.div>
                          ))
                      ) : (
                        <p className="text-gray-600 text-center py-8 text-sm sm:text-base">
                          No reviews yet. Be the first to review this product!
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "shipping" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Shipping & Returns
                    </h3>
                    <div className="space-y-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center text-sm sm:text-base">
                          <Truck className="mr-2 flex-shrink-0" size={18} />
                          Shipping Information
                        </h4>
                        <ul className="space-y-2 text-blue-700 text-sm">
                          {[
                            "Free shipping on orders over 299₹",
                            "Standard delivery: 2-4 business days",
                            "30min delivery available in select areas"
                          ].map((item, index) => (
                            <li key={index} className="flex items-start">
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-amber-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-amber-800 mb-2 flex items-center text-sm sm:text-base">
                          <Package className="mr-2 flex-shrink-0" size={18} />
                          Return Policy
                        </h4>
                        <ul className="space-y-2 text-amber-700 text-sm">
                          {[
                            "No return policy for fresh products",
                            "Items must be in original condition", 
                            "Return shipping costs covered by us",
                            "Full refund processed within 3-5 business days"
                          ].map((item, index) => (
                            <li key={index} className="flex items-start">
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ✅ OPTIMIZED: Map Component with better error handling */}
        {foundProduct?.location?.coordinates?.length === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Product Location
                </h3>
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {foundProduct.location.city && (
                      <span>{foundProduct.location.city}</span>
                    )}
                    {foundProduct.location.state && (
                      <span>, {foundProduct.location.state}</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 text-xs sm:text-sm">
                  This product is sourced from{" "}
                  {foundProduct.seller?.name || "an unknown seller"} located in
                  the area shown below.
                  {foundProduct.location?.address && (
                    <span className="block mt-1 text-gray-500">
                      Address: {foundProduct.location.address}
                    </span>
                  )}
                </p>
              </div>

              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <MapComponent
                  lat={foundProduct?.location?.coordinates?.[1] || 37.7749}
                  lng={foundProduct?.location?.coordinates?.[0] || -122.4194}
                  zoom={12}
                  height="400px"
                  popupText={
                    foundProduct.location.city || "Location not specified"
                  }
                  theme="dark"
                  markers={[
                    {
                      lat: foundProduct?.location?.coordinates?.[1] || 37.7749,
                      lng:
                        foundProduct?.location?.coordinates?.[0] || -122.4194,
                      color: "#ef4444",
                      popup:
                        '<div class="font-semibold">Product Location</div>',
                    }
                  ]}
                  onMapClick={(coords) => console.log("Map clicked:", coords)}
                  onMarkerClick={(marker) =>
                    console.log("Marker clicked:", marker)
                  }
                />
              </div>

              <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                <div className="flex items-start text-xs sm:text-sm text-green-700">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Local delivery available within 10km radius. Contact seller
                    for delivery options and rates.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ✅ OPTIMIZED: Related Products with better responsive grid */}
        {/* ✅ OPTIMIZED: Related Products with perfect image fitting and enhanced design */}
{relatedProducts.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="mt-12 bg-white rounded-2xl shadow-lg overflow-hidden"
  >
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-gray-900">
          You May Also Like
        </h3>
        <Link 
          to={`/shopping?category=${foundProduct.category}`}
          className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center transition-colors"
        >
          View all <ChevronRight className="ml-1" size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <motion.div
            key={product._id}
            whileHover={{ y: -5 }}
            className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
          >
            {/* Product Image Container */}
            <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
              <Link 
                to={`/product-info/${product._id}`}
                className="block w-full h-full"
              >
                <img
                  src={
                    product.images?.[0]?.url
                      ? `${product.images[0].url.split('/upload/')[0]}/upload/w_600,h_600,c_fill/${product.images[0].url.split('/upload/')[1]}`
                      : `${import.meta.env.VITE_API_URL}${DEFAULT_PRODUCT_IMAGE_PATH}`
                  }
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={handleImageError}
                  loading="lazy"
                />
              </Link>

              {/* Product Badges */}
              <div className="absolute top-2 left-2 flex flex-col space-y-1">
                {product.isNew && (
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    NEW
                  </span>
                )}
                {product.discountPrice && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  isProductInWishlist(product._id) 
                    ? removeFromWishlist(product._id, product.name)
                    : addToWishlist(product);
                }}
                className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
                aria-label={isProductInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  size={20}
                  className={isProductInWishlist(product._id) 
                    ? "text-red-500 fill-red-500" 
                    : "text-gray-400 hover:text-red-500"}
                />
              </button>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <div className="mb-2">
                <Link 
                  to={`/product-info/${product._id}`}
                  className="font-medium text-gray-900 hover:text-green-600 line-clamp-2 transition-colors"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-gray-500 mt-1">{product.category}</p>
              </div>

              <div className="flex items-center mb-2">
                <StarRating rating={product.ratingsAverage || 0} />
                <span className="text-xs text-gray-500 ml-1">
                  ({product.ratingsQuantity || 0})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {product.discountPrice ? (
                    <>
                      <span className="text-lg font-bold text-green-600">
                        ${product.discountPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400 line-through ml-1">
                        ${product.price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-green-600">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    upsertCartItem(product, 1);
                    toast.success(
                      <div className="flex items-center">
                        <Check className="mr-2 text-green-500" size={16} />
                        Added to cart!
                      </div>,
                      { position: "top-center" }
                    );
                  }}
                  className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  aria-label="Add to cart"
                >
                  <ShoppingCart size={18} />
                </motion.button>
              </div>
            </div>

            {/* Stock Status */}
            <div className="px-4 pb-3">
              <div className={`text-xs font-medium ${
                product.stock === 0
                  ? "text-red-600"
                  : product.stock <= 5
                  ? "text-amber-600"
                  : "text-green-600"
              }`}>
                {product.stock === 0
                  ? "Out of Stock"
                  : product.stock <= 5
                  ? `Only ${product.stock} left!`
                  : "In Stock"}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
)}
        </div>

        {/* Toast Container */}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          toastClassName="shadow-lg"
          progressClassName="bg-gradient-to-r from-green-400 to-green-500"
        />
      </div>
    );
  };

  export default ProductCardPage;
