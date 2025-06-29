import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../../Context/Context";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MapComponent from "../MapComponent/MapComponent";
import axios from "axios"; 
import {Helmet} from "react-helmet-async"; // Import Helmet for SEO

const ProductImageGallery = ({ product, selectedImage, setSelectedImage }) => {
  const productImages = useMemo(() => {
    if (product?.images?.length > 0) {
      return product.images.map(
        (img) => `${import.meta.env.VITE_API_URL}/uploads/${img}`
      );
    }
    return [`${import.meta.env.VITE_API_URL}/uploads/default-product.png`];
  }, [product]);

  const mainImageWidth = 600; 
  const mainImageHeight = 450; 
  const thumbnailWidth = 80;
  const thumbnailHeight = 60;

  return (
    <div className="md:w-1/2 p-6">
      <div className="relative h-96 w-full mb-4 rounded-xl overflow-hidden">
        <picture>
          
          <img
            src={productImages[selectedImage]}
            alt={product.name}
            className="w-full h-full object-contain transition-opacity duration-300"
            loading="eager"
            decoding="async" 
            width={mainImageWidth}
            height={mainImageHeight}
            onError={(e) => {
              e.target.src = `${
                import.meta.env.VITE_API_URL
              }/uploads/default-product.png`;
              e.target.onerror = null; 
              e.target.className =
                "w-full h-full object-contain bg-gray-100 p-4"; 
            }}
          />
        </picture>

        {product.isNew && ( // Assuming 'isNew' is a boolean field
          <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            NEW ARRIVAL
          </div>
        )}
        {product.discountPrice &&
          product.price > product.discountPrice && ( // Use discountPrice from backend
            <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {Math.round(
                ((product.price - product.discountPrice) / product.price) * 100
              )}
              % OFF
            </div>
          )}
      </div>

      {/* Thumbnail Gallery */}
      <div className="grid grid-cols-4 gap-2">
        {productImages.map((img, index) => (
          <div key={index} className="relative">
            <button
              onClick={() => setSelectedImage(index)}
              className={`h-20 w-full rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index
                  ? "border-green-500"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <img
                src={img}
                alt={`${product.name} thumbnail ${index + 1}`}
                className="w-full h-full object-contain"
                loading="lazy"
                decoding="async"
                width={thumbnailWidth}
                height={thumbnailHeight}
                onError={(e) => {
                  e.target.src = `${
                    import.meta.env.VITE_API_URL
                  }/uploads/default-product.png`;
                  e.target.onerror = null;
                  e.target.className =
                    "w-full h-full object-contain bg-gray-100 p-2"; // Apply object-contain for fallback too
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Extracted ProductPrice component ---
const ProductPrice = ({ product, quantity = 1 }) => {
  const safeQuantity = Math.max(1, quantity);

  // Use 'discountPrice' if available, otherwise just 'price'
  const finalPrice = product.discountPrice || product.price;

  return (
    <div className="mb-6">
      {product.discountPrice ? ( // If discountPrice exists, show both
        <div className="flex items-center">
          <p className="text-3xl font-bold text-green-600 mr-3">
            ${(finalPrice * safeQuantity).toFixed(2)}
          </p>
          <p className="text-xl text-gray-400 line-through">
            {(product.price * safeQuantity).toFixed(2)}{" "}
            {/* Original price comes from 'price' */}
          </p>
          <span className="ml-3 bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
            Save {Math.round((1 - finalPrice / product.price) * 100)}%
          </span>
        </div>
      ) : (
        <p className="text-3xl font-bold text-green-600">
          ${(product.price * safeQuantity).toFixed(2)}
        </p>
      )}
    </div>
  );
};

// --- Extracted QuantitySelector component ---
const QuantitySelector = ({ quantity, onIncrease, onDecrease, maxStock }) => {
  const isIncreaseDisabled = quantity >= maxStock;
  const isDecreaseDisabled = quantity <= 1;

  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-gray-700 font-medium">Quantity:</span>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={onDecrease}
          className="bg-gray-50 text-gray-600 hover:bg-gray-100 px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          disabled={isDecreaseDisabled}
        >
          −
        </button>
        <span className="w-12 text-center py-2 border-x border-gray-200">
          {quantity}
        </span>
        <button
          onClick={onIncrease}
          className="bg-gray-50 text-gray-600 hover:bg-gray-100 px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          disabled={isIncreaseDisabled}
        >
          +
        </button>
      </div>
    </div>
  );
};

// --- ProductCardPage Component ---
const ProductCardPage = () => {
  const { productId } = useParams();
  const [foundProduct, setFoundProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const {
    addToCart,
    updateCartItemQuantity,
    products: cartProducts, // Renamed 'products' to 'cartProducts' to avoid confusion
  } = useContext(AuthContext); 
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [wishlist, setWishlist] = useState("transparent");

  console.log("The found product is", foundProduct?.location.coordinates[0]);
  console.log("The found product is", foundProduct?.location.coordinates[1]);

  // Get the current quantity from cart if product exists in cart
  const getInitialQuantity = useCallback(() => {
    const cartItem = cartProducts.find(
      (item) => item._id === productId?.toString()
    );
    return cartItem?.quantity || 1; // Default to 1 if not found
  }, [cartProducts, productId]);

  const [quantity, setQuantity] = useState(getInitialQuantity());

  useEffect(() => {
    // This effect ensures quantity updates if foundProduct changes or initial cartProducts load
    setQuantity(getInitialQuantity());
  }, [foundProduct, getInitialQuantity]);


  // --- Crucial Change: Fetch product details directly from the backend API ---
  useEffect(() => {
    const fetchProduct = async () => {
      console.log("Product Id is :", productId);
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/products/${productId}`
        );
        const fetchedProduct = response.data.data.product; 
        setFoundProduct(fetchedProduct);
        setSelectedImage(0); // Reset selected image when a new product is loaded
        setQuantity(getInitialQuantity()); // Set initial quantity based on cart for this specific product

        const relatedRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/products?category=${
            fetchedProduct.category
          }&limit=4&exclude=${productId}`
        );
        setRelatedProducts(
          relatedRes.data.data.products.filter((p) => p._id !== productId)
        ); // Filter out the current product
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setFoundProduct(null); // Explicitly set to null on error
        toast.error("Failed to load product details.", {
          position: "top-center",
        });
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, getInitialQuantity]); // Depend on productId to refetch when route changes

  const handleIncrease = useCallback(() => {
    if (!foundProduct) return;
    const newQuantity = (quantity || 1) + 1;
    // Prevent increasing beyond stock
    if (foundProduct.stock !== undefined && newQuantity > foundProduct.stock) {
      toast.warn(
        `Cannot add more than ${foundProduct.stock} items to cart (stock limit).`,
        {
          position: "top-center",
          autoClose: 2000,
        }
      );
      return;
    }
    setQuantity(newQuantity);
    updateCartItemQuantity(foundProduct._id, newQuantity);
  }, [quantity, foundProduct, updateCartItemQuantity]);

  const handleDecrease = useCallback(() => {
    if (!foundProduct) return;
    const newQuantity = Math.max(1, (quantity || 1) - 1);
    setQuantity(newQuantity);
    updateCartItemQuantity(foundProduct._id, newQuantity);
  }, [quantity, foundProduct, updateCartItemQuantity]);

  const handleWishlist = useCallback(() => {
    if (!foundProduct) return;
    if (wishlist === "transparent") {
      setWishlist("red");
      toast.success(`${foundProduct.name} added to wishlist!`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      setWishlist("transparent");
    }
  }, [wishlist, foundProduct]);

  const handleAddToCart = useCallback(() => {
    if (!foundProduct) return;

    const qty = quantity || 1;
    // Check if adding this quantity exceeds available stock
    if (foundProduct.stock !== undefined && qty > foundProduct.stock) {
      toast.error(
        `Cannot add ${qty} items. Only ${foundProduct.stock} available in stock.`,
        {
          position: "top-center",
          autoClose: 3000,
        }
      );
      return;
    }

    addToCart(foundProduct._id, qty);

  }, [foundProduct, quantity, addToCart]);

  const handleBuyNow = useCallback(() => {
    if (!foundProduct) return;
    // Similar stock check for buy now
    if (foundProduct.stock !== undefined && quantity > foundProduct.stock) {
      toast.error(
        `Cannot proceed. Only ${foundProduct.stock} available in stock.`,
        {
          position: "top-center",
          autoClose: 3000,
        }
      );
      return;
    }
    addToCart(foundProduct._id, quantity);
    // Redirect to payment page after adding to cart
  }, [foundProduct, quantity, addToCart]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 min-h-screen">
        <div className="animate-pulse bg-white rounded-2xl shadow-xl overflow-hidden md:flex">
          <div className="md:w-1/2 bg-gray-200 h-96"></div>
          <div className="md:w-1/2 p-8 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-12 bg-gray-200 rounded w-1/3 mt-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!foundProduct) {
    return (
      <div className="container mx-auto py-8 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Product not found
          </h3>
          <p className="mt-2 text-gray-500">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Determine stock status
  const stockStatus =
    foundProduct.stock > 0
      ? foundProduct.stock <= 5
        ? `Only ${foundProduct.stock} left in stock!`
        : "In Stock"
      : "Out of Stock";

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{foundProduct.name} - Buy {foundProduct.category} | EcoHarvest</title>
        <meta
          name="description"
          content={`Discover ${foundProduct.name}, a fresh, organic ${foundProduct.category} from ${foundProduct.seller.name}. Price: $${foundProduct.price.toFixed(2)}. ${foundProduct.description ? foundProduct.description.substring(0, 150) + '...' : 'High-quality, locally sourced, and sustainably grown.'}`}
        />
        {/* Open Graph / Social Media Meta Tags */}
        <meta property="og:title" content={`${foundProduct.name} - EcoHarvest`} />
        <meta property="og:description" content={`Fresh organic ${foundProduct.category} from ${foundProduct.seller.name}. Price: $${foundProduct.price.toFixed(2)}.`} />
        <meta property="og:image" content={`${import.meta.env.VITE_API_URL}/uploads/${foundProduct.images[0] || 'default-product.png'}`} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={foundProduct.price.toFixed(2)} />
        <meta property="product:price:currency" content="USD" />
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${foundProduct.name} - EcoHarvest`} />
        <meta name="twitter:description" content={`Fresh organic ${foundProduct.category} from ${foundProduct.seller.name}. Price: $${foundProduct.price.toFixed(2)}.`} />
        <meta name="twitter:image" content={`${import.meta.env.VITE_API_URL}/uploads/${foundProduct.images[0] || 'default-product.png'}`} />
      </Helmet>
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                to="/"
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-green-600"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <Link
                  to="/shopping"
                  className="ml-1 text-sm font-medium text-gray-700 hover:text-green-600 md:ml-2"
                >
                  Products
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  {foundProduct.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Main Product Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden md:flex transition-all duration-300 hover:shadow-2xl">
          <ProductImageGallery
            product={foundProduct}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />

          {/* Product Details */}
          <div className="md:w-1/2 p-8 flex flex-col">
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-2">
                    {foundProduct.category}
                  </span>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {foundProduct.name}
                  </h2>
                </div>
                <button
                  className="text-black hover:text-red-500 transition-colors"
                  onClick={handleWishlist}
                >
                  <svg
                    className="w-6 h-6"
                    fill={`${wishlist}`}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex items-center mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${
                        star <= foundProduct.ratingsAverage
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-500 text-sm ml-2">
                  ({foundProduct.ratingsQuantity} customer reviews){" "}
                  {/* Use actual ratingsQuantity */}
                </span>
              </div>

              <p className="text-gray-500 mb-4 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Sold by:{" "}
                <Link
                  to={`/vendor/${foundProduct.seller._id}`}
                  className="text-green-600 hover:underline ml-1"
                >
                  {foundProduct.seller.name}{" "}
                  {/* Access seller.name from populated field */}
                </Link>
                {foundProduct.location.city && ( // Display city if available
                  <span className="ml-2 text-gray-500">
                    ({foundProduct.location.city})
                  </span>
                )}
              </p>

              <ProductPrice product={foundProduct} quantity={quantity} />

              {/* Stock Status */}
              <p
                className={`text-sm mb-4 font-semibold ${
                  foundProduct.stock > 0
                    ? foundProduct.stock <= 5
                      ? "text-orange-500"
                      : "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stockStatus}
              </p>

              <p className="text-gray-700 mb-6 leading-relaxed">
                {foundProduct.description ||
                  "This premium product is carefully sourced from local farms and producers. Each item is hand-selected for quality and freshness to ensure you get the best possible experience."}
              </p>

              <div className="mb-8">
                <QuantitySelector
                  quantity={quantity}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  maxStock={foundProduct.stock} // Pass max stock to quantity selector
                />

                <div className="space-y-3">
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg shadow hover:shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    disabled={foundProduct.stock === 0} // Disable if out of stock
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Add to Cart
                  </button>

                  <Link to="/payment">
                    {" "}
                    {/* Consider redirecting to payment page after buy now logic */}
                    <button
                      className="w-full bg-white border border-green-600 text-green-600 font-semibold py-3 px-6 rounded-lg shadow-sm hover:bg-green-50 transition-colors duration-300 flex items-center justify-center mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleBuyNow}
                      type="button"
                      disabled={foundProduct.stock === 0} // Disable if out of stock
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      Buy Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center text-sm text-gray-500">
                <svg
                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Delivery expected within 2-4 business days
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button className="py-4 px-6 text-center border-b-2 font-medium text-sm border-green-500 text-green-600">
                Description
              </button>
              <button className="py-4 px-6 text-center border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Reviews ({foundProduct.ratingsQuantity}){" "}
                {/* Updated review count */}
              </button>
              <button className="py-4 px-6 text-center border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Shipping & Returns
              </button>
            </nav>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Product Details
            </h3>
            {/* These list items are hardcoded; ideally, they would come from `foundProduct.description` or a separate `features` array if available */}
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>100% organic and locally sourced</li>
              <li>Harvested at peak freshness</li>
              <li>Packaged with care to preserve quality</li>
              <li>Certified by local agricultural authorities</li>
              <li>Sustainably grown and produced</li>
            </ul>
          </div>
        </div>

        {/* Enhanced Map Section */}
        {!loading && foundProduct?.location?.coordinates?.length === 2 && (
          <div className="mt-12 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-gray-900">
                  Product Location
                </h3>
                <div className="flex items-center text-sm text-gray-500">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
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
                  This product is sourced from {foundProduct.seller.name}{" "}
                  located in the area shown below.
                  {foundProduct.location.address && (
                    <span className="block mt-1 text-gray-500">
                      Address: {foundProduct.location.address}
                    </span>
                  )}
                </p>
              </div>

              {/* Map Container with proper styling */}
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <MapComponent
                  lat={foundProduct.location.coordinates[1]}
                  lng={foundProduct.location.coordinates[0]}
                  zoom={12} // Add zoom prop if your MapComponent supports it
                  height="400px" // Add height prop if your MapComponent supports it
                />
              </div>

              {/* Optional: Distance or delivery info */}
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center text-sm text-green-700">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Local delivery available within 10km radius. Contact seller
                    for delivery options and rates.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              You may also like
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <div
                  key={product._id} /* Use product._id for key */
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <Link to={`/product-info/${product._id}`} className="block">
                    {" "}
                    {/* Use product._id for Link */}
                    <div className="relative pb-[75%] overflow-hidden">
                      <img
                        src={`${import.meta.env.VITE_API_URL}/uploads/${
                          product.images[0]
                        }`} /* Use product.images[0] */
                        alt={product.name}
                        // IMPORTANT: Changed object-cover to object-contain for related products
                        className="absolute h-full w-full object-contain hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        width="200" // Example width for related products
                        height="150" // Example height for related products
                        onError={(e) => {
                          e.target.src = `${
                            import.meta.env.VITE_API_URL
                          }/uploads/default-product.png`;
                          e.target.onerror = null;
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-1">
                        {product.name}
                      </h4>
                      <p className="text-gray-500 text-sm mb-2">
                        By: {product.seller.name}{" "}
                        {/* Access seller name from populated field */}
                      </p>
                      <p className="text-gray-900 font-bold">
                        ${product.discountPrice || product.price}{" "}
                        {/* Display discount price if available */}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default ProductCardPage;
