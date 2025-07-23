  import { useContext, useEffect, useState, useMemo, useCallback } from "react";
  import { Link, useParams, useNavigate } from "react-router-dom";
  import { AuthContext } from "../../Context/Context";
  import { toast, ToastContainer } from "react-toastify";
  import "react-toastify/dist/ReactToastify.css";
  import MapComponent from "../MapComponent/MapComponent";
  import { Helmet } from "react-helmet-async";
  import { Heart, ShoppingCart, Loader2, Star, MapPin, Home, ChevronRight, Info, Truck, Check, Leaf, Shield, Clock, Package, ArrowRight } from 'lucide-react';
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

  // --- ProductImageGallery Component ---
  const ProductImageGallery = ({ product, selectedImage, setSelectedImage }) => {
    const productImages = useMemo(() => {
      if (product?.images?.length > 0) {
        return product.images.map(
          (img) => `${import.meta.env.VITE_API_URL}/uploads/${img}`
        );
      }
      return [`${import.meta.env.VITE_API_URL}${DEFAULT_PRODUCT_IMAGE_PATH}`];
    }, [product]);

    useEffect(() => {
      if (productImages && productImages.length > 0 && selectedImage === null) {
        setSelectedImage(0);
      }
    }, [productImages, selectedImage, setSelectedImage]);

    const handleImageError = (e) => {
      e.target.src = `${import.meta.env.VITE_API_URL}${DEFAULT_PRODUCT_IMAGE_PATH}`;
    };

    return (
      <div className="w-full md:w-1/2 p-3 sm:p-4 md:p-6">
        {/* Main Image Container */}
        <div className="relative w-full mb-4">
          {/* Responsive aspect ratio container with centered content */}
          <div className="relative w-full aspect-square max-h-[70vh] sm:max-h-[60vh] md:max-h-[500px] lg:max-h-[600px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm flex items-center justify-center">
            {/* White background for transparent images */}
            <div className="absolute inset-0 bg-white flex items-center justify-center p-4">
              <picture className="w-full h-full flex items-center justify-center">
                <motion.img
                  src={productImages[selectedImage] || productImages[0]}
                  alt={product.name || "Product Image"}
                  className="max-w-[90%] max-h-[90%] object-contain"
                  loading="eager"
                  onError={handleImageError}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  key={selectedImage}
                />
              </picture>
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col space-y-1 sm:space-y-2">
              {product.isNew && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="bg-green-500 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full shadow-md"
                >
                  NEW
                </motion.div>
              )}
              {product.discountPrice && product.price > product.discountPrice && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="bg-red-500 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full shadow-md"
                >
                  {Math.round(
                    ((product.price - product.discountPrice) / product.price) * 100
                  )}% OFF
                </motion.div>
              )}
            </div>

            {/* Image Navigation Arrows (for mobile) */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : productImages.length - 1)}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all md:hidden"
                  type="button"
                  aria-label="Previous image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedImage(selectedImage < productImages.length - 1 ? selectedImage + 1 : 0)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all md:hidden"
                  type="button"
                  aria-label="Next image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image counter for mobile */}
            {productImages.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full md:hidden">
                {selectedImage + 1}/{productImages.length}
              </div>
            )}
          </div>
        </div>

        {/* Thumbnails - Hidden on small screens, visible on medium+ */}
        {productImages.length > 1 && (
          <div className="hidden sm:grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 gap-2 sm:gap-3">
            {productImages.map((img, index) => (
              <motion.button
                key={index}
                onClick={() => setSelectedImage(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative aspect-square rounded-lg sm:rounded-xl overflow-hidden transition-all ${
                  selectedImage === index
                    ? "ring-2 ring-green-500 ring-offset-1 sm:ring-offset-2"
                    : "hover:ring-1 hover:ring-gray-300"
                }`}
                type="button"
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={img}
                  alt={`${product.name || "Product"} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover bg-gray-50"
                  loading="lazy"
                  onError={handleImageError}
                />
              </motion.button>
            ))}
          </div>
        )}

        {/* Mobile Thumbnail Dots */}
        {productImages.length > 1 && (
          <div className="flex justify-center space-x-2 mt-3 sm:hidden">
            {productImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  selectedImage === index
                    ? "bg-green-500 w-6"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                type="button"
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- ProductPrice Component ---
  const ProductPrice = ({ product, quantity = 1 }) => {
    const safeQuantity = Math.max(1, quantity);
    const finalPrice = product?.discountPrice || product?.price || 0;
    const originalPrice = product?.price || 0;

    const discountPercentage = useMemo(() => {
      if (product?.discountPrice && originalPrice > finalPrice && originalPrice > 0) {
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
    const [activeTab, setActiveTab] = useState('description');

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
        const productApiUrl = `${import.meta.env.VITE_API_URL}/api/products/${productId}?populate=reviews`;
        const productResponse = await authAxios.get(productApiUrl);
        const fetchedProduct = productResponse.data?.data?.product;

        if (fetchedProduct) {
          setFoundProduct(fetchedProduct);
          setSelectedImage(0);

          if (fetchedProduct.category) {
            const relatedProductsApiUrl = `${import.meta.env.VITE_API_URL}/api/products?category=${
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
        toast.error("Failed to load product details.", { position: "top-center" });
        console.error("Product fetch error:", error);
      } finally {
        setLoading(false);
      }
    }, [productId, authAxios]);

    useEffect(() => {
      setQuantity(1);
      setSelectedImage(0);
      setActiveTab('description');
    }, [productId]);

    useEffect(() => {
      fetchProductAndRelated();
    }, [fetchProductAndRelated]);

    const handleQuantityChange = useCallback((change) => {
      if (!foundProduct) return;

      const newQuantity = Math.max(1, quantity + change);
      if (foundProduct.stock !== undefined && newQuantity > foundProduct.stock) {
        toast.warn(`Cannot add more than ${foundProduct.stock} items.`, { position: "top-center" });
        return;
      }

      setQuantity(newQuantity);
      const currentCartQuantity = getProductQuantityInCart();
      if (currentCartQuantity > 0) {
        updateCartItemQuantity(foundProduct._id.toString(), newQuantity);
      }
    }, [quantity, foundProduct, updateCartItemQuantity, getProductQuantityInCart]);

    const handleWishlistToggle = useCallback(async () => {
      if (!foundProduct) return;
      isInWishlist
        ? await removeFromWishlist(foundProduct._id, foundProduct.name)
        : await addToWishlist(foundProduct);
      
      // Heart animation effect
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
        toast.error(`Only ${foundProduct.stock} available in stock.`, { autoClose: 3000 });
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
        toast.error(`Only ${foundProduct.stock} available in stock.`, { autoClose: 3000 });
        return;
      }

      upsertCartItem(foundProduct, quantity);
      navigate("/cart");
    }, [foundProduct, quantity, upsertCartItem, navigate]);

    // Review Submission State & Handlers
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [newReviewComment, setNewReviewComment] = useState('');

    const handleReviewRatingChange = useCallback((rating) => {
      setNewReviewRating(rating);
    }, []);

    const handleReviewCommentChange = useCallback((e) => {
      setNewReviewComment(e.target.value);
    }, []);

    const handleReviewSubmit = useCallback(async () => {
      if (!isLoggedIn) {
        toast.error("Please login to submit a review!", { position: "top-center" });
        navigate('/login');
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

        if (response.data.status === 'success') {
          toast.success("Review submitted successfully!", { position: "top-center" });
          setNewReviewRating(0);
          setNewReviewComment('');
          fetchProductAndRelated();
        } else {
          toast.error(response.data.message || "Failed to submit review.", { position: "top-center" });
        }
      } catch (error) {
        console.error("Review submission error:", error);
        toast.error(error.response?.data?.message || "An error occurred during review submission.", { position: "top-center" });
      }
    }, [isLoggedIn, newReviewRating, newReviewComment, foundProduct, authAxios, navigate, fetchProductAndRelated]);

    const stockStatus = useMemo(() => {
      if (!foundProduct || foundProduct.stock === undefined) return "Loading stock...";
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
              <div className="h-8 bg-gray-100 rounded-full w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
              <div className="h-6 bg-gray-100 rounded-full w-1/4"></div>
              <div className="h-4 bg-gray-100 rounded-full w-full"></div>
              <div className="h-4 bg-gray-100 rounded-full w-full"></div>
              <div className="h-4 bg-gray-100 rounded-full w-2/3"></div>
              <div className="h-12 bg-gray-100 rounded-xl w-1/3 mt-8"></div>
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
            content={`${foundProduct.name} - ${foundProduct.description?.substring(0, 150) || 'High-quality organic product'}`}
          />
          <meta property="og:title" content={`${foundProduct.name} - EcoHarvest`} />
          <meta property="og:description" content={foundProduct.description?.substring(0, 150) || ''} />
          <meta property="og:image" content={`${import.meta.env.VITE_API_URL}/uploads/${foundProduct.images?.[0] || "default-product.png"}`} />
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
                  <span className="ml-2 text-sm font-medium text-gray-500">
                    {foundProduct.name}
                  </span>
                </div>
              </li>
            </ol>
          </motion.nav>

          {/* Main Product Card */}
        <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white rounded-2xl shadow-lg md:flex transition-all hover:shadow-xl min-w-[300px] min-h-[300px]"
  >
            <ProductImageGallery
              product={foundProduct}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
            />

            {/* Product Details */}
            <div className="md:w-1/2 p-4 md:p-6 flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full mb-2"
                    >
                      {foundProduct.category}
                    </motion.span>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {foundProduct.name}
                    </h1>
                  </div>
                  <motion.button
                    onClick={handleWishlistToggle}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.8 }}
                    className="p-2 rounded-full transition-all"
                    aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
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
                    <StarRating rating={foundProduct.ratingsAverage} />
                  </div>
                  <span className="text-gray-500 text-sm ml-2">
                    ({foundProduct.ratingsQuantity || 0} reviews)
                  </span>
                </div>

                {/* Seller Info */}
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <MapPin size={16} className="mr-1" />
                  Sold by:{" "}
                  {foundProduct.seller?.name ? (
                    <Link
                      to={`/vendor/${foundProduct.seller._id}`}
                      className="text-green-600 hover:underline ml-1"
                    >
                      {foundProduct.seller.name}
                    </Link>
                  ) : (
                    <span className="ml-1">Unknown Seller</span>
                  )}
                  {foundProduct.location?.city && (
                    <span className="ml-1">({foundProduct.location.city})</span>
                  )}
                </div>

                {/* Price */}
                <ProductPrice product={foundProduct} quantity={quantity} />

                {/* Stock Status */}
                <div className={`flex items-center text-sm mb-4 font-medium ${
                  foundProduct.stock === 0
                    ? "text-red-600"
                    : foundProduct.stock <= 5
                    ? "text-amber-600"
                    : "text-green-600"
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    foundProduct.stock === 0
                      ? "bg-red-600"
                      : foundProduct.stock <= 5
                      ? "bg-amber-600"
                      : "bg-green-600"
                  }`}></div>
                  {stockStatus}
                </div>

                {/* Description */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {foundProduct.description ||
                    "Premium organic product carefully sourced for quality and freshness."}
                </p>

                {/* Product Highlights */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Leaf className="w-4 h-4 mr-2 text-green-500" />
                    Organic
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="w-4 h-4 mr-2 text-green-500" />
                    Quality Guarantee
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-green-500" />
                    Fresh Daily
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="w-4 h-4 mr-2 text-green-500" />
                    Eco Packaging
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
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart size={18} className="mr-2" />
                      Add to Cart
                    </motion.button>

                    <motion.button
                      onClick={handleBuyNow}
                      disabled={foundProduct.stock === 0}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 font-medium py-3 px-6 rounded-lg shadow-sm transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Buy Now <ArrowRight className="ml-2" size={18} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Truck size={16} className="mr-2 text-gray-400" />
                  Delivery expected within 2-4 business days
                </div>
              </div>
            </div>
          </motion.div>

          {/* Product Details Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <motion.button
                  onClick={() => setActiveTab('description')}
                  whileHover={{ y: -2 }}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-all ${
                    activeTab === 'description' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Description
                </motion.button>
                <motion.button
                  onClick={() => setActiveTab('reviews')}
                  whileHover={{ y: -2 }}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-all ${
                    activeTab === 'reviews' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Reviews ({foundProduct.ratingsQuantity || 0})
                </motion.button>
                <motion.button
                  onClick={() => setActiveTab('shipping')}
                  whileHover={{ y: -2 }}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-all ${
                    activeTab === 'shipping' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Shipping & Returns
                </motion.button>
              </nav>
            </div>
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'description' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Product Details
                      </h3>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>100% organic and locally sourced ingredients</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Harvested at peak freshness for maximum flavor and nutrition</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Packaged with care using sustainable materials to preserve quality</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Certified by local agricultural authorities for quality and safety</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Sustainably grown and produced with minimal environmental impact</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Reviews</h3>

                      {/* Review Submission Form */}
                      {isLoggedIn ? (
                        <div className="bg-gradient-to-br from-gray-50 to-green-50 p-6 rounded-xl shadow-inner mb-8">
                          <h4 className="text-xl font-semibold text-gray-800 mb-4">Write a Review</h4>
                          <div className="mb-4">
                            <label htmlFor="review-rating" className="block text-gray-700 text-sm font-bold mb-2">Your Rating</label>
                            <StarRating 
                              rating={newReviewRating} 
                              setRating={handleReviewRatingChange} 
                              interactive={true} 
                            />
                          </div>
                          <div className="mb-4">
                            <label htmlFor="review-comment" className="block text-gray-700 text-sm font-bold mb-2">Your Comment (Optional)</label>
                            <textarea
                              id="review-comment"
                              rows="4"
                              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Share your thoughts about the product..."
                              value={newReviewComment}
                              onChange={handleReviewCommentChange}
                            ></textarea>
                          </div>
                          <motion.button
                            onClick={handleReviewSubmit}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all"
                          >
                            Submit Review
                          </motion.button>
                        </div>
                      ) : (
                        <p className="text-gray-600 mb-8">
                          Please <Link to="/login" className="text-green-600 hover:underline font-medium">login</Link> to write a review.
                        </p>
                      )}

                      {/* List of Existing Reviews */}
                      <div className="space-y-6">
                        {foundProduct.reviews && foundProduct.reviews.length > 0 ? (
                          foundProduct.reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((review) => (
                            <motion.div 
                              key={review._id} 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-b border-gray-200 pb-6 last:border-b-0"
                            >
                              <div className="flex items-center mb-2">
                                <h4 className="font-semibold text-gray-800 mr-2">{review.user?.name || 'Anonymous User'}</h4>
                                <span className="text-yellow-500 flex items-center">
                                  <Star size={16} fill="currentColor" stroke="none" />
                                  <span className="ml-1">{review.rating.toFixed(1)}</span>
                                </span>
                              </div>
                              <p className="text-gray-600 mb-2">{review.comment}</p>
                              <p className="text-gray-400 text-sm">Reviewed on {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review this product!</p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'shipping' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Shipping & Returns
                      </h3>
                      <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                            <Truck className="mr-2" size={18} />
                            Shipping Information
                          </h4>
                          <ul className="space-y-2 text-blue-700">
                            <li className="flex items-start">
                              <Check className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>Free shipping on orders over 299₹</span>
                            </li>
                            <li className="flex items-start">
                              <Check className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>Standard delivery: 2-4 business days</span>
                            </li>
                            <li className="flex items-start">
                              <Check className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>30min delivery available in select areas</span>
                            </li>
                          </ul>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-amber-800 mb-2 flex items-center">
                            <Package className="mr-2" size={18} />
                            Return Policy
                          </h4>
                          <ul className="space-y-2 text-amber-700">
                            <li className="flex items-start">
                              <Check className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>No return policy for fresh products</span>
                            </li>
                            <li className="flex items-start">
                              <Check className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>Items must be in original condition</span>
                            </li>
                            <li className="flex items-start">
                              <Check className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>Return shipping costs covered by us</span>
                            </li>
                            <li className="flex items-start">
                              <Check className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>Full refund processed within 3-5 business days</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Map Component */}
          {foundProduct?.location?.coordinates?.length === 2 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Product Location
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {foundProduct.location.city && (
                      <span>{foundProduct.location.city}</span>
                    )}
                    {foundProduct.location.state && (
                      <span>, {foundProduct.location.state}</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 text-sm">
                    This product is sourced from{" "}
                    {foundProduct.seller?.name || "an unknown seller"}{" "}
                    located in the area shown below.
                    {foundProduct.location?.address && (
                      <span className="block mt-1 text-gray-500">
                        Address: {foundProduct.location.address}
                      </span>
                    )}
                  </p>
                </div>

                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <MapComponent
                    lat={foundProduct.location.coordinates[1]}
                    lng={foundProduct.location.coordinates[0]}
                    zoom={12}
                    height="400px"
                  />
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                  <div className="flex items-center text-sm text-green-700">
                    <Info className="w-5 h-5 mr-2 text-green-600" />
                    <span>
                      Local delivery available within 10km radius. Contact seller
                      for delivery options and rates.
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  You May Also Like
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedProducts.map((product) => (
                    <motion.div 
                      key={product._id} 
                      whileHover={{ y: -5 }}
                      className="group relative"
                    >
                      <div className="aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:opacity-90 transition-opacity">
                        <img
                          src={
                            product.images?.[0]
                              ? `${import.meta.env.VITE_API_URL}/uploads/${product.images[0]}`
                              : `${import.meta.env.VITE_API_URL}${DEFAULT_PRODUCT_IMAGE_PATH}`
                          }
                          alt={product.name}
                          className="h-full w-full object-cover object-center"
                          onError={handleImageError}
                        />
                      </div>
                      <div className="mt-4 flex justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            <Link
                              to={`/product/${product._id}`}
                              className="hover:text-green-600 transition-colors"
                            >
                              {product.name}
                            </Link>
                          </h4>
                          <p className="mt-1 text-xs text-gray-500">
                            {product.category}
                          </p>
                        </div>
                        <div className="text-right">
                          {product.discountPrice ? (
                            <div>
                              <p className="text-sm font-medium text-green-600">
                                ${product.discountPrice.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-400 line-through">
                                ${product.price.toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-green-600">
                              ${product.price.toFixed(2)}
                            </p>
                          )}
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