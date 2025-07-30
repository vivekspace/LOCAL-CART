// src/pages/ShoppingPage.jsx
import React, { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation as useReactRouterLocation } from "react-router-dom";
import { AuthContext } from "../../Context/Context"; // Ensure this path is correct
import { useLocation } from "../../LocationContext/LocationContext"; // Import useLocation hook
import { HeroSlider } from "../HeroSlider/HeroSlider";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion"; // Import framer-motion

// Debounce hook to delay function calls
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ShoppingPage = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeResultIndex, setActiveResultIndex] = useState(-1);

  // Products state and loading specific to this page
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState(null);

  // New state for view mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState('grid'); // Default to grid view

  const { addToCart, authAxios } = useContext(AuthContext);
  const { selectedLocation, locationsLoading } = useLocation();

  const navigate = useNavigate();
  const reactRouterLocation = useReactRouterLocation(); // For URL search params

  // Initialize search and selectedCategory from URL search params
  const queryParams = useMemo(() => new URLSearchParams(reactRouterLocation.search), [reactRouterLocation.search]);
  const initialSearch = queryParams.get("search") || "";
  const initialCategory = queryParams.get("category") || "All";

  // Set initial state from URL params if available
  useEffect(() => {
    setSearch(initialSearch);
    setSelectedCategory(initialCategory);
  }, [initialSearch, initialCategory]);


  const mockCategories = useMemo(() => ([
    "All", "Fruits", "Bakery", "Dairy & Eggs", "Honey",
    "Soap & Detergents", "Vegetables", "Meat & Poultry",
    "Beverages", "Mobile", "Electronics",
  ]), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCategories(mockCategories);
    }, 500);
    return () => clearTimeout(timer);
  }, [mockCategories]);

  const debouncedSearch = useDebounce(search, 300);

  const fetchProducts = useCallback(async (locationData) => {
  // Add early return if same location
  if (locationData?.city === products[0]?.location) {
    console.log('Same location, skipping refetch');
    return;
  }

  setIsLoadingProducts(true);
  setProductError(null);
  // DON'T clear products immediately - keep showing previous ones
  // setProducts([]); // Remove this line

  if (!locationData || (!locationData.city && !locationData.lat && !locationData.lng)) {
    console.log("Invalid location data, skipping fetch.");
    setIsLoadingProducts(false);
    return;
  }

  try {
    let apiUrl = `${import.meta.env.VITE_API_URL}/api/products`;
    const params = {};

    if (locationData.type === 'gps_location' && locationData.lat && locationData.lng) {
      apiUrl = `${import.meta.env.VITE_API_URL}/api/products/nearby`;
      params.lat = locationData.lat;
      params.lng = locationData.lng;
      params.distance = 10;
    } else if (locationData.city) {
      params.location = locationData.city;
    } else {
      console.warn("Cannot determine product fetch endpoint.");
      setIsLoadingProducts(false);
      setProductError("Invalid location data provided.");
      return;
    }

    const response = await authAxios.get(apiUrl, { 
      params,
      timeout: 8000 // Add timeout to prevent hanging
    });

    if (response.data?.status === "success" && Array.isArray(response.data?.data?.products)) {
      setProducts(response.data.data.products);
      toast.success(`${response.data.data.products.length} products loaded for ${locationData.name || locationData.city}`);
    } else {
      setProducts([]);
      toast.info("No products found in this area.");
    }

  } catch (error) {
    console.error("Error fetching products:", error);
    setProductError("Failed to load products for this location.");
    toast.error("Failed to load products. Please try again.");
    // Don't clear products on error - keep showing previous ones
  } finally {
    setIsLoadingProducts(false);
  }
}, [authAxios]);


useEffect(() => {
  // Start loading products as soon as we have ANY location data
  // Don't wait for locationsLoading to be false
  if (selectedLocation && selectedLocation.city !== 'default') {
    console.log('Starting product fetch for:', selectedLocation);
    fetchProducts(selectedLocation);
  } else if (!selectedLocation && !locationsLoading) {
    // Only show error if location detection is complete but no location found
    setIsLoadingProducts(false);
    setProductError("Please select a location to view products.");
  }
  // Remove locationsLoading dependency to avoid waiting
}, [selectedLocation, fetchProducts]);

useEffect(() => {
  // Start loading immediately if we have basic location info
  if (selectedLocation?.city && selectedLocation.city !== 'default') {
    fetchProducts(selectedLocation);
  }
}, [selectedLocation?.city, selectedLocation?.lat, selectedLocation?.lng]);

  // Update URL search params whenever search or selectedCategory changes
  useEffect(() => {
    const newQueryParams = new URLSearchParams();
    if (search) {
      newQueryParams.set("search", search);
    }
    if (selectedCategory && selectedCategory !== "All") {
      newQueryParams.set("category", selectedCategory);
    }
    // Only update URL if params have actually changed to avoid unnecessary history entries
    if (newQueryParams.toString() !== queryParams.toString()) {
        navigate(`?${newQueryParams.toString()}`, { replace: true });
    }
  }, [search, selectedCategory, navigate, queryParams]);


  const filteredProducts = useMemo(
    () =>
      products?.filter((product) => {
        if (!product || !product.name) return false;

        const matchesSearch =
          debouncedSearch.trim() === "" ||
          product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (product.vendor &&
            product.vendor.toLowerCase().includes(debouncedSearch.toLowerCase()));

        const matchesCategory =
          selectedCategory.toLowerCase() === "all" ||
          (product.category &&
            product.category
              .toLowerCase()
              .includes(selectedCategory.toLowerCase()));

        return matchesSearch && matchesCategory;
      }) || [],
    [products, debouncedSearch, selectedCategory]
  );

  const filteredSearch = useMemo(
    () =>
      products?.filter(
        (product) =>
          product && product.name
            ? product.name.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
            : false
      ) || [],
    [products, debouncedSearch]
  );

  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveResultIndex((prevIndex) =>
        Math.min(prevIndex + 1, filteredSearch.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveResultIndex((prevIndex) => Math.max(prevIndex - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeResultIndex !== -1 && filteredSearch[activeResultIndex]) {
        const selectedProduct = filteredSearch[activeResultIndex];
        setSearch(selectedProduct.name);
        setActiveResultIndex(-1);
        navigate(`/product-info/${selectedProduct._id}`);
      } else if (search && search.length >= 2) {
        setActiveResultIndex(-1);
      }
    } else if (e.key === "Escape") {
      setSearch("");
      setActiveResultIndex(-1);
    }
  }, [activeResultIndex, filteredSearch, search, navigate]);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setActiveResultIndex(-1);
  }, []);

  const handleAddToCart = useCallback((e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(productId, 1, products);
  }, [addToCart, products]);

  const handleResetFiltersAndLocation = useCallback(() => {
    setSearch("");
    setSelectedCategory("All");
    setActiveResultIndex(-1);
    toast.info("Filters reset! Please use the location dropdown in the header to change your delivery area.");
  }, []);

  const handleCategoryClick = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  const listVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Helmet>
        <title>Shop Fresh - LocalCart | Farm Fresh Products Delivered</title>
        <meta
          name="description"
          content="Discover a wide variety of farm-fresh products, locally sourced groceries, and artisanal goods. Shop fruits, vegetables, dairy, bakery, and more at LocalCart."
        />
        <meta
          name="keywords"
          content="online grocery, farm fresh, local produce, fresh fruits, fresh vegetables, dairy, bakery, organic food, LocalCart, online shopping, artisanal goods, home delivery"
        />
        <meta property="og:title" content="Shop Fresh - LocalCart" />
        <meta
          property="og:description"
          content="Discover a wide variety of farm-fresh products, locally sourced groceries, and artisanal goods. Shop fruits, vegetables, dairy, bakery, and more at LocalCart."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.localcart.com/shop" />
        <meta
          property="og:image"
          content="https://www.localcart.com/images/og-shop-image.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Shop Fresh - LocalCart" />
        <meta
          property="og:description"
          content="Discover a wide variety of farm-fresh products, locally sourced groceries, and artisanal goods. Shop fruits, vegetables, dairy, bakery, and more at LocalCart."
        />
        <meta
          property="og:image"
          content="https://www.localcart.com/images/twitter-shop-image.jpg"
        />
      </Helmet>

      <HeroSlider />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="relative mb-8 max-w-2xl mx-auto">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-300"></div>

            <div className="relative bg-white/60 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-100 hover:border-green-100 transition-all duration-300 hover:shadow-xl group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>

              <input
                type="text"
                placeholder="Search products, vendors, or categories..."
                className="w-full py-4 px-12 bg-transparent text-gray-800 placeholder-gray-400 focus:placeholder-green-400 text-lg transition-all duration-300 focus:outline-none"
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => search && search.length > 1 && setActiveResultIndex(-1)}
                onBlur={() => setTimeout(() => setActiveResultIndex(-1), 100)}
              />

              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {search ? (
                  <button
                    onClick={() => {
                      setSearch("");
                      setActiveResultIndex(-1);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                ) : (
                  <div className="flex items-center mr-1">
                    <span className="text-xs font-medium text-gray-400 mr-2 bg-gray-100 px-2 py-1 rounded-md">
                      <kbd className="font-sans">⌘</kbd> +{" "}
                      <kbd className="font-sans">K</kbd>
                    </span>
                    <div className="w-px h-6 bg-gray-200"></div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300 w-0 group-hover:w-full"></div>
            </div>

            {search && search.length > 1 && filteredSearch.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 px-3 py-2">
                    Search Results ({filteredSearch.length} found)
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {filteredSearch.slice(0, 8).map((product, index) => (
                      <Link
                        to={`/product-info/${product._id}`}
                        onMouseEnter={() => setActiveResultIndex(index)}
                        onFocus={() => setActiveResultIndex(index)}
                        key={product._id}
                        onClick={(e) => {
                          setSearch("");
                          setActiveResultIndex(-1);
                        }}
                        className={`flex items-center px-3 py-2 w-full rounded-lg transition-colors text-sm text-gray-700 ${
                          activeResultIndex === index
                            ? "bg-green-50 border-l-2 border-green-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="w-8 h-8 mr-3 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.images && product.images.length > 0 && (
                            <picture>
                              <img
                                src={`${
                                  import.meta.env.VITE_API_URL
                                }/uploads/${product.images[0]}`}
                                alt={product.name}
                                className="w-full h-full object-contain"
                                loading="lazy"
                                decoding="async"
                                width="200"
                                height="150"
                                onError={(e) => {
                                  e.target.src = `${
                                    import.meta.env.VITE_API_URL
                                  }/uploads/default-product.png`;
                                  e.target.onerror = null;
                                }}
                              />
                            </picture>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {product.category && `${product.category} • `}${product.price}
                            {product.vendor && ` • by ${product.vendor}`}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50/70 backdrop-blur-md p-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Press{" "}
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">
                      Enter
                    </kbd>{" "}
                    to search • Use ↑↓ to navigate
                  </span>
                  <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                    View All Results
                  </button>
                </div>
              </div>
            )}
            {search && search.length > 1 && filteredSearch.length === 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                 <div className="px-3 py-4 text-sm text-gray-500 text-center">
                    No products found for "{search}"
                  </div>
              </div>
            )}
          </div>

          <div className="mb-8 bg-white/60 backdrop-blur-md rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="inline-block w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full mr-3"></span>
              Categories
              <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                {categories.length} options
              </span>
            </h3>

            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`
                    px-4 py-2 rounded-full transition-all duration-300 flex items-center
                    transform hover:scale-105 relative overflow-hidden
                    ${
                      selectedCategory === category
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium shadow-md shadow-green-200"
                        : "bg-white text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm border border-gray-200"
                    }
                  `}
                  onClick={() => handleCategoryClick(category)}
                >
                  {selectedCategory === category && (
                    <>
                      <span className="absolute inset-0 bg-white/10 animate-pulse rounded-full"></span>
                      <svg
                        className="w-4 h-4 mr-2 animate-bounce"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </>
                  )}
                  {selectedCategory !== category && (
                    <span className="w-4 h-4 mr-2 rounded-full border-2 border-gray-200"></span>
                  )}
                  <span>{category}</span>

                  {selectedCategory === category && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-white/40"></span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
              <button
                className="flex items-center hover:text-green-600 transition-colors"
                onClick={() => handleCategoryClick("All")}
              >
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                Reset
              </button>
              <span className="text-xs">
                Selected:{" "}
                <span className="font-medium text-green-600">
                  {selectedCategory}
                </span>
              </span>
            </div>
          </div>
        </div>
      

        {/* View Mode Toggle */}
        <div className="flex justify-between flex-row-reverse mb-8 pr-2">
  {/* View All Products Button */}
  <motion.button
    onClick={() => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      // Assuming '/view-all' navigates to the ShoppingPage itself to apply filters
      navigate(`/view-all?${params.toString()}`);
    }}
    className="text-green-600 font-medium lg:text-sm text-xs flex items-center"
    // Framer Motion for smooth hover and click effects
    whileHover={{ scale: 1.05, color: '#047857' }} // Slightly larger on hover, darker green text
    whileTap={{ scale: 0.95 }} // Slight shrink on click
    transition={{ type: "spring", stiffness: 400, damping: 10 }} // Spring physics for animation
  >
    View All Products
    <svg
      className="w-4 h-4 ml-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M14 5l7 7m0 0l-7 7m7-7H3"
      />
    </svg>
  </motion.button>

  {/* Grid/List View Toggle Buttons */}
  <div className="inline-flex rounded-md shadow-sm" role="group">
    <motion.button
      type="button"
      className={`px-2 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-l-lg border ${
        viewMode === 'grid'
          ? 'bg-green-600 text-white border-green-700'
          : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
      }`}
      onClick={() => setViewMode('grid')}
      // Framer Motion for smooth hover and click effects
      whileHover={{ scale: 1.05, borderColor: viewMode === 'grid' ? '#22c55e' : '#a7f3d0' }} // Dynamic border color on hover
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
      Grid View
    </motion.button>
    <motion.button
      type="button"
      className={`px-2 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-r-md border ${
        viewMode === 'list'
          ? 'bg-green-600 text-white border-green-700'
          : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
      }`}
      onClick={() => setViewMode('list')}
      // Framer Motion for smooth hover and click effects
      whileHover={{ scale: 1.05, borderColor: viewMode === 'list' ? '#22c55e' : '#a7f3d0' }} // Dynamic border color on hover
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      List View
    </motion.button>
  </div>
</div>


        {(isLoadingProducts || locationsLoading) && !products.length ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500">
            {/* Display skeleton loaders while loading */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-5xl mt-8">
                {[...Array(8)].map((_, index) => (
                  <div
                    key={`skeleton-grid-${index}`}
                    className="bg-white/60 backdrop-blur-md rounded-xl overflow-hidden shadow-md border border-gray-100 animate-pulse"
                  >
                    <div className="pb-[75%] bg-gray-200/70"></div>
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-gray-200/70 rounded-full w-3/4"></div>
                      <div className="h-4 bg-gray-200/70 rounded-full w-1/2"></div>
                      <div className="flex justify-between pt-2">
                        <div className="h-6 bg-gray-200/70 rounded-full w-1/4"></div>
                        <div className="h-8 w-8 rounded-lg bg-gray-200/70"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full max-w-5xl mt-8">
                 {[...Array(5)].map((_, index) => (
                  <div
                    key={`skeleton-list-${index}`}
                    className="bg-white/60 backdrop-blur-md rounded-xl shadow-md border border-gray-100 p-4 flex items-center animate-pulse"
                  >
                    <div className="w-20 h-20 bg-gray-200/70 rounded-md flex-shrink-0 mr-4"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200/70 rounded-full w-3/4"></div>
                      <div className="h-3 bg-gray-200/70 rounded-full w-1/2"></div>
                      <div className="h-3 bg-gray-200/70 rounded-full w-1/4"></div>
                    </div>
                    <div className="h-10 w-10 bg-gray-200/70 rounded-full ml-4 flex-shrink-0"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : productError ? (
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="text-center py-16 px-6">
              <div className="max-w-md mx-auto">
                <div className="inline-flex items-center justify-center p-4 bg-gray-100/70 rounded-full mb-4">
                  <svg
                    className="h-16 w-16 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-gray-900">
                  Something went wrong!
                </h3>
                <p className="mt-3 text-red-500 text-lg">
                  {productError}
                </p>
                <p className="mt-1 text-gray-500">
                  Please try again or check your network connection.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleResetFiltersAndLocation}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-md text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                  >
                    Reset Filters & Location
                    <svg
                      className="ml-2 -mr-1 w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <p className="text-sm font-bold text-gray-500 mt-2 mb-4">
              Displaying products for:{" "}
              <span className="font-medium text-green-600">
                {selectedLocation?.name || selectedLocation?.city || "Unknown Location"}
              </span>
            </p>

            <AnimatePresence mode='wait'> {/* Ensures only one component renders at a time */}
              {viewMode === 'grid' ? (
                <motion.div
                  key="grid-view" // Key helps AnimatePresence distinguish views
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }, // Stagger children for grid
                    exit: { opacity: 0 }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product._id}
                      variants={cardVariants} // Apply item-specific animation
                      className="bg-white/60 backdrop-blur-md rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 group relative"
                    >
                      {product.discount && (
                        <div className="absolute top-3 left-3 z-10">
                          <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                            {product.discount}% OFF
                          </div>
                        </div>
                      )}

                      {product.isNew && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                            NEW
                          </div>
                        </div>
                      )}

                      <div className="relative pb-[75%] overflow-hidden">
                        <img
                          src={
                            product.images && product.images.length > 0
                              ? product.images[0]?.url
                              : `${
                                  import.meta.env.VITE_API_URL
                                }/uploads/default-product.png`
                          }
                          alt={product.name || "Product"}
                          className="absolute h-full w-full object-contain group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = `${
                              import.meta.env.VITE_API_URL
                            }/uploads/default-product.png`;
                            e.target.onerror = null;
                          }}
                          loading="lazy"
                          decoding="async"
                          width="200"
                          height="150"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                          <Link
                            to={`/product-info/${product._id}`}
                            className="text-white font-medium text-sm bg-black/50 hover:bg-black/70 px-4 py-2 rounded-full transition-all duration-200 backdrop-blur-sm flex items-center shadow-lg"
                          >
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              ></path>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              ></path>
                            </svg>
                            Quick View
                          </Link>

                          <div className="flex space-x-1">
                            <button className="text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200 backdrop-blur-sm shadow-lg">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <Link
                            to={`/product-info/${product._id}`}
                            className="block flex-1"
                          >
                            <h3 className="text-lg font-semibold text-gray-800 line-clamp-1 hover:text-green-600 transition-colors group-hover:text-green-600">
                              {product.name || "Unnamed Product"}
                            </h3>
                          </Link>
                          {product.category && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium ml-2">
                              {product.category}
                            </span>
                          )}
                        </div>

                        {product.vendor && (
                          <div className="flex items-center text-gray-500 text-sm mb-3">
                            <svg
                              className="w-4 h-4 mr-1 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              ></path>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              ></path>
                            </svg>
                            <span className="hover:text-green-600 transition-colors cursor-pointer">
                              {product.vendor}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center mb-3">
                          <div className="flex mr-2">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (product.rating || 4)
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
                          <span className="text-xs text-gray-500">
                            ({product.reviewCount || "0"} reviews)
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                          <div>
                            <div className="flex items-center">
                              <p className="text-green-600 font-bold text-lg">
                                ${product.price || "0.00"}
                              </p>
                              {product.originalPrice && (
                                <p className="text-gray-400 text-sm line-through ml-2">
                                  ${product.originalPrice}
                                </p>
                              )}
                            </div>
                            {product.originalPrice && (
                              <p className="text-xs text-green-600 font-medium">
                                Save $
                                {(product.originalPrice - product.price).toFixed(2)}
                              </p>
                            )}
                          </div>

                          <button
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center transform hover:scale-105 group"
                            onClick={(e) => handleAddToCart(e, product._id)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 group-hover:animate-bounce"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                            </svg>
                          </button>
                        </div>
                    </div>
                </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="list-view" // Key helps AnimatePresence distinguish views
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }, // Stagger children for list
                    exit: { opacity: 0 }
                  }}
                  className="flex flex-col gap-4"
                >
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product._id}
                      variants={listVariants} // Apply item-specific animation
                      className="bg-white/60 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 flex items-center p-4 relative overflow-hidden group"
                    >
                        {product.discount && (
                            <div className="absolute top-0 right-0 z-10 -mr-2 -mt-2">
                                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md">
                                    {product.discount}% OFF
                                </span>
                            </div>
                        )}
                      <Link to={`/product-info/${product._id}`} className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-md overflow-hidden mr-4 bg-gray-100">
                        <img
                          src={
                            product.images && product.images.length > 0
                              ? product.images[0]?.url
                              : `${
                                  import.meta.env.VITE_API_URL
                                }/uploads/default-product.png`
                          }
                          alt={product.name || "Product"}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = `${
                              import.meta.env.VITE_API_URL
                            }/uploads/default-product.png`;
                            e.target.onerror = null;
                          }}
                          loading="lazy"
                          decoding="async"
                          width="128"
                          height="128"
                        />
                      </Link>

                      <div className="flex-1 min-w-0 pr-4">
                        <Link to={`/product-info/${product._id}`}>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 line-clamp-2 hover:text-green-600 transition-colors">
                            {product.name || "Unnamed Product"}
                          </h3>
                        </Link>
                        {product.vendor && (
                          <p className="text-gray-500 text-sm mt-1">
                            by <span className="font-medium text-green-600">{product.vendor}</span>
                          </p>
                        )}
                        {product.category && (
                          <p className="text-gray-500 text-xs mt-1">
                            Category: <span className="font-medium">{product.category}</span>
                          </p>
                        )}
                        <div className="flex items-center mt-2">
                          <div className="flex mr-2">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (product.rating || 4)
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
                          <span className="text-xs text-gray-500">
                            ({product.reviewCount || "0"} reviews)
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between ml-auto">
                        <div>
                          <p className="text-green-600 font-bold text-xl text-right">
                            ${product.price || "0.00"}
                          </p>
                          {product.originalPrice && (
                            <p className="text-gray-400 text-sm line-through text-right">
                              ${product.originalPrice}
                            </p>
                          )}
                        </div>
                        <button
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center transform hover:scale-105 mt-4"
                          onClick={(e) => handleAddToCart(e, product._id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 group-hover:animate-bounce"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="text-center py-16 px-6">
              <div className="max-w-md mx-auto">
                <div className="inline-flex items-center justify-center p-4 bg-gray-100/70 rounded-full mb-4">
                  <svg
                    className="h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-gray-900">
                  No products found
                </h3>
                <p className="mt-3 text-gray-500 text-lg">
                  We couldn't find any products matching your current location
                  or selected criteria.
                </p>
                <p className="mt-1 text-gray-500">
                  Try adjusting your location, search, or filter to find what
                  you're looking for.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleResetFiltersAndLocation}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-md text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                  >
                    Reset Filters & Location
                    <svg
                      className="ml-2 -mr-1 w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default ShoppingPage;