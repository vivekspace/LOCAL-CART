// src/pages/ViewAllProducts.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../Context/Context";
import { useLocation as useLocationContext } from "../../LocationContext/LocationContext";
import { Helmet } from "react-helmet-async";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const ViewAllProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const { authAxios, addToCart } = useContext(AuthContext);
  const { selectedLocation } = useLocationContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      search: params.get('search') || '',
      category: params.get('category') || 'All',
    };
  }, [location.search]);

  // Fetch products
  useEffect(() => {
    const fetchAllProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let apiUrl = `${import.meta.env.VITE_API_URL}/api/products`;
        const params = {};

        if (selectedLocation?.type === 'gps_location' && selectedLocation.lat && selectedLocation.lng) {
          apiUrl = `${import.meta.env.VITE_API_URL}/api/products/nearby`;
          params.lat = selectedLocation.lat;
          params.lng = selectedLocation.lng;
          params.distance = 10;
        } else if (selectedLocation?.city) {
          params.location = selectedLocation.city;
        }

        if (queryParams.search) params.search = queryParams.search;
        if (queryParams.category !== 'All') params.category = queryParams.category;

        const response = await authAxios.get(apiUrl, { params });

        if (response.data?.status === "success") {
          setProducts(response.data.data?.products || []);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products");
        toast.error("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedLocation) fetchAllProducts();
  }, [selectedLocation, queryParams, authAxios]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !queryParams.search ||
        product.name.toLowerCase().includes(queryParams.search.toLowerCase()) ||
        (product.vendor && product.vendor.toLowerCase().includes(queryParams.search.toLowerCase()));

      const matchesCategory = queryParams.category === 'All' ||
        (product.category && product.category.toLowerCase() === queryParams.category.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [products, queryParams]);

  const handleAddToCart = (e, productId) => {
    e.preventDefault();
    addToCart(productId, 1, products);
    toast.success("Added to cart!");
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 20,
        duration: 0.6
      },
    },
    hover: {
      y: -8,
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
      transition: { 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const imageVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 8px 25px rgba(34, 197, 94, 0.4)",
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

  // Product Card Components
  const GridProductCard = ({ product }) => (
    <motion.div
      variants={itemVariants}
      whileHover="hover"
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer"
      layout
    >
      <Link to={`/product-info/${product._id}`} className="block">
        <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          <motion.div
            variants={imageVariants}
            whileHover="hover"
            className="w-full h-full"
          >
            <motion.img
              src={
                product.images?.[0] 
                  ? `${import.meta.env.VITE_API_URL}/uploads/${product.images[0]}`
                  : `${import.meta.env.VITE_API_URL}/uploads/default-product.png`
              }
              alt={product.name}
              className="w-full h-full object-contain p-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </motion.div>
          <AnimatePresence>
            {product.discount && (
              <motion.div 
                initial={{ opacity: 0, scale: 0, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="absolute top-4 left-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
              >
                {product.discount}% OFF
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div 
          className="p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <motion.h3 
            className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm leading-relaxed"
            whileHover={{ color: "#059669" }}
            transition={{ duration: 0.2 }}
          >
            {product.name}
          </motion.h3>
          
          {product.vendor && (
            <motion.p 
              className="text-xs text-gray-500 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              by <span className="font-medium text-green-600">{product.vendor}</span>
            </motion.p>
          )}

          <motion.div 
            className="flex items-center justify-between mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold text-lg">
                ${product.price}
              </span>
              {product.originalPrice && (
                <motion.span 
                  className="text-sm text-gray-400 line-through"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  ${product.originalPrice}
                </motion.span>
              )}
            </div>
          </motion.div>

          <motion.button
            onClick={(e) => handleAddToCart(e, product._id)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl font-medium py-2.5 text-sm flex items-center justify-center transition-all duration-300"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
              whileHover={{ rotate: 12 }}
              transition={{ duration: 0.2 }}
            >
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </motion.svg>
            Add to Cart
          </motion.button>
        </motion.div>
      </Link>
    </motion.div>
  );

  const ListProductItem = ({ product }) => (
    <motion.div
      variants={itemVariants}
      whileHover="hover"
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group"
      layout
    >
      <Link to={`/product-info/${product._id}`} className="flex gap-6 ">
        <div className="w-28 h-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0">
          <motion.div
            variants={imageVariants}
            whileHover="hover"
            className="w-full h-full"
          >
            <motion.img
              src={
                product.images?.[0]
                  ? `${import.meta.env.VITE_API_URL}/uploads/${product.images[0]}`
                  : `${import.meta.env.VITE_API_URL}/uploads/default-product.png`
              }
              alt={product.name}
              className="w-full h-full object-contain p-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
          </motion.div>
        </div>

        <div className="flex-1 flex flex-col justify-between p-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <motion.h3 
              className="font-semibold text-gray-900 line-clamp-2 text-lg mb-1"
              whileHover={{ color: "#059669" }}
              transition={{ duration: 0.2 }}
            >
              {product.name}
            </motion.h3>
            <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}>
              {product.description}
          </motion.p>
            {product.vendor && (
              <motion.p 
                className="text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                by <span className="font-medium text-green-600">{product.vendor}</span>
              </motion.p>
            )}
          </motion.div>

          <motion.div 
            className="flex justify-between items-center pt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-bold text-xl">
                ${product.price}
              </span>
              {product.originalPrice && (
                <motion.span 
                  className="text-sm text-gray-400 line-through"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  ${product.originalPrice}
                </motion.span>
              )}
            </div>

            <motion.button
              onClick={(e) => handleAddToCart(e, product._id)}
              className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-full px-6 py-2.5 text-sm flex items-center font-medium"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                whileHover={{ rotate: 12 }}
                transition={{ duration: 0.2 }}
              >
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </motion.svg>
              Add to Cart
            </motion.button>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const viewModeVariants = {
    hidden: { opacity: 0, x: 30 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Helmet>
        <title>All Products - LocalCart</title>
        <meta name="description" content="Browse all products on LocalCart" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div 
          variants={headerVariants}
          initial="hidden"
          animate="show"
          className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
        >
          <div>
            <motion.h1 
              className="text-3xl font-bold text-gray-900 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Our Products
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {queryParams.search && (
                <p className="text-gray-600 text-lg">Results for "{queryParams.search}"</p>
              )}
              {queryParams.category !== 'All' && (
                <p className="text-green-600 font-medium">Category: {queryParams.category}</p>
              )}
            </motion.div>
          </div>

          <motion.div 
            className="flex items-center gap-3"
            variants={viewModeVariants}
            initial="hidden"
            animate="show"
          >
            <div className="bg-white rounded-xl shadow-sm p-1.5 border border-gray-200">
              <motion.button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.svg 
                  className="w-4 h-4 inline mr-2" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  whileHover={{ rotate: 5 }}
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </motion.svg>
                Grid
              </motion.button>
              <motion.button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  viewMode === 'list' 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.svg 
                  className="w-4 h-4 inline mr-2" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  whileHover={{ rotate: 5 }}
                >
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </motion.svg>
                List
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
            >
              {[...Array(10)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-lg mb-3 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded-lg mb-4 w-2/3 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-20"
            >
              <motion.div
                className="inline-flex items-center justify-center p-6 bg-red-50 rounded-full mb-6"
                animate={{ 
                  rotate: [0, -5, 5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </motion.div>
              <motion.div 
                className="text-red-600 mb-6 text-xl font-semibold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {error}
              </motion.div>
              <motion.button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-full hover:shadow-lg font-medium"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Try Again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products */}
        <AnimatePresence mode="wait">
          {!isLoading && !error && (
            <motion.div
              key={viewMode}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 20 }}
            >
              {filteredProducts.length > 0 ? (
                viewMode === 'grid' ? (
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                    layout
                  >
                    <AnimatePresence>
                      {filteredProducts.map(product => (
                        <GridProductCard key={product._id} product={product} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="space-y-6"
                    layout
                  >
                    <AnimatePresence>
                      {filteredProducts.map(product => (
                        <ListProductItem key={product._id} product={product} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <motion.div
                    className="inline-flex items-center justify-center p-6 bg-gray-50 rounded-full mb-6"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </motion.div>
                  <motion.div 
                    className="text-gray-600 mb-4 text-xl font-semibold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    No products found
                  </motion.div>
                  <motion.p 
                    className="text-gray-500 mb-8 max-w-md mx-auto text-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {queryParams.search || queryParams.category !== 'All' 
                      ? "Try adjusting your search criteria" 
                      : "We couldn't find any products in your area"}
                  </motion.p>
                  <motion.button
                    onClick={() => navigate('/')}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-full hover:shadow-lg font-medium"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Back to Home
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="rounded-xl"
      />
    </div>
  );
};

export default ViewAllProducts;