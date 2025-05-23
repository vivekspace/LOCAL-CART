import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Context/Context";
import { useNavigate } from "react-router-dom";

const ShoppingPage = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const { products, addToCart } = useContext(AuthContext);
  const navigate = useNavigate();

  console.log(products);

  const mockCategories = [
    "All",
    "Fruits",
    "Bakery",
    "Dairy & Eggs",
    "Honey",
    "Soap & Detergents",
    "Vegetables",
    "Meat & Poultry",
    "Beverages",
    "Mobile",
    "Electronics",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setCategories(mockCategories);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Safe filtering with null checks
  const filteredProducts =
    products?.filter((product) => {
      if (!product || !product.name) return false;

      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.vendor &&
          product.vendor.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory.toLowerCase() === "all" ||
        (product.category &&
          product.category
            .toLowerCase()
            .includes(selectedCategory.toLowerCase()));

      return matchesSearch && matchesCategory;
    }) || [];

  const filteredSearch =
    products?.filter((product) =>
      product && product.name
        ? product.name.toLowerCase().includes(search.trim().toLowerCase())
        : false
    ) || [];

  const handleKeyDown = (e) => {
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
        // Add the product to cart and navigate to product page
        addToCart(selectedProduct._id);
        navigate(`/product-info/${selectedProduct._id}`);
      } else if (search && search.length >= 2) {
        setActiveResultIndex(-1);
      }
    } else if (e.key === "Escape") {
      setSearch("");
      setActiveResultIndex(-1);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setActiveResultIndex(-1); // Reset active index when typing
  };

  const handleAddToCart = (e, productId) => {
    e.preventDefault(); // Prevent navigation when clicking add to cart
    e.stopPropagation();
    addToCart(productId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
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
                onMouseEnter={() => setActiveResultIndex(-1)}
                onMouseLeave={() => setActiveResultIndex(-1)}
                onBlur={() => setActiveResultIndex(-1)}
                onFocus={() => setActiveResultIndex(-1)}
              />

              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {search ? (
                  <button
                    onClick={() => {
                      setTimeout(() => {
                        setSearch("");
                        setActiveResultIndex(-1);
                      }, 100);
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

            {search && search.length > 1 && (
              <div className="absolute left-0 right-0 mt-2 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 px-3 py-2">
                    Search Results ({filteredSearch.length} found)
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {filteredSearch.length > 0 ? (
                      filteredSearch.slice(0, 8).map((product, index) => (
                        <Link
                          to={`/product-info/${product._id}`}
                          onMouseEnter={() => setActiveResultIndex(index)}
                          onMouseLeave={() => setActiveResultIndex(-1)}
                          onFocus={() => setActiveResultIndex(index)}
                          onBlur={() => setActiveResultIndex(-1)}
                          key={product._id}
                          onClick={(e) => {
                            e.preventDefault();
                            setSearch("");
                            setActiveResultIndex(-1);
                            navigate(`/product-info/${product._id}`);
                          }}
                          className={`flex items-center px-3 py-2 w-full rounded-lg transition-colors text-sm text-gray-700 ${
                            activeResultIndex === index
                              ? "bg-green-50 border-l-2 border-green-500"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="w-8 h-8 mr-3 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={`http://localhost:5000/uploads/${product.images[0]}`}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src =
                                    "http://localhost:5000/uploads/default-product.png";
                                  e.target.onerror = null;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  ></path>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {product.category && `${product.category} • `}$
                              {product.price}
                              {product.vendor && ` • by ${product.vendor}`}
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No products found for "{search}"
                      </div>
                    )}
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
                  onClick={() => setSelectedCategory(category)}
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
                onClick={() => setSelectedCategory("All")}
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

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
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
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, idx) => (
              <div
                key={product._id || idx}
                className="bg-white/60 backdrop-blur-md rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 group relative"
              >
                {/* Badges */}
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

                {/* Product Image */}
                <div className="relative pb-[75%] overflow-hidden">
                  <img
                    src={
                      product.images && product.images.length > 0
                        ? `http://localhost:5000/uploads/${product.images[0]}`
                        : "http://localhost:5000/uploads/default-product.png"
                    }
                    alt={product.name || "Product"}
                    className="absolute h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src =
                        "http://localhost:5000/uploads/default-product.png";
                      e.target.onerror = null;
                    }}
                  />

                  {/* Hover Overlay */}
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

                {/* Product Info */}
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

                  {/* Rating */}
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

                  {/* Price and Add to Cart */}
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
              </div>
            ))}
          </div>
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
                  We couldn't find any products matching your search criteria.
                </p>
                <p className="mt-1 text-gray-500">
                  Try adjusting your search or filter to find what you're
                  looking for.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("All");
                      setActiveResultIndex(-1);
                    }}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-md text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                  >
                    Reset Filters
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

        {/* Featured Vendors Section */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="inline-block w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full mr-3"></span>
                Featured Local Vendors
              </h3>
              <a
                href="#"
                className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center transition-colors"
              >
                View All
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
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                "Farm Fresh",
                "Bakery Delight",
                "Honey Haven",
                "Dairy King",
                "Organic Greens",
              ].map((vendor, index) => (
                <div
                  key={index}
                  className="bg-white/60 backdrop-blur-md p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-200 flex flex-col items-center group"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-600/10 p-1 mb-3 overflow-hidden relative shadow-inner">
                    <img
                      src={`/api/placeholder/128/128`}
                      alt={vendor}
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 rounded-full ring-2 ring-white/30"></div>
                  </div>
                  <h4 className="text-base font-medium text-gray-800 text-center">
                    {vendor}
                  </h4>
                  <div className="flex mt-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < 4 ? "text-yellow-400" : "text-gray-300"
                        } transition-all duration-300 ${
                          i === 3 && "group-hover:text-yellow-400"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">(42 products)</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export const HeroSlider = () => {
  const slides = [
    {
      title: "Farm Fresh Delivered to You",
      highlight: "Delivered",
      description:
        "Discover the freshest local produce and artisanal goods from trusted farmers in your community.",
      bgFrom: "from-green-600",
      bgTo: "to-emerald-700",
      buttons: [
        { text: "Shop Now", variant: "primary" },
        { text: "Meet Our Farmers", variant: "secondary" },
      ],
      floatingItems: [
        { name: "apple", label: "Fresh Apples" },
        { name: "bread", label: "Artisan Bread" },
        { name: "milk", label: "Organic Milk" },
        { name: "honey", label: "Local Honey" },
        { name: "eggs", label: "Farm Eggs" },
      ],
    },
    {
      title: "Seasonal Specials",
      highlight: "Specials",
      description:
        "Enjoy limited-time offers on seasonal fruits and vegetables at their peak freshness.",
      bgFrom: "from-amber-500",
      bgTo: "to-orange-600",
      buttons: [
        { text: "View Offers", variant: "primary" },
        { text: "Learn More", variant: "secondary" },
      ],
      floatingItems: [
        { name: "strawberry", label: "Summer Berries" },
        { name: "pumpkin", label: "Autumn Pumpkins" },
        { name: "citrus", label: "Winter Citrus" },
        { name: "asparagus", label: "Spring Asparagus" },
      ],
    },
    {
      title: "Organic & Sustainable",
      highlight: "Sustainable",
      description:
        "Products grown with care for the environment and your health.",
      bgFrom: "from-teal-500",
      bgTo: "to-cyan-600",
      buttons: [
        { text: "Browse Organic", variant: "primary" },
        { text: "Our Practices", variant: "secondary" },
      ],
      floatingItems: [
        { name: "milk", label: "Organic Milk" },
        { name: "honey", label: "Raw Honey" },
        { name: "eggs", label: "Free-range Eggs" },
        { name: "vegetables", label: "Fresh Veggies" },
      ],
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance slides
  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative h-screen max-h-[600px] overflow-hidden mb-8 flex justify-center">
      <div
        className="flex transition-transform duration-700 ease-in-out w-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`w-full flex-shrink-0 relative bg-gradient-to-r ${slide.bgFrom} ${slide.bgTo} h-full`}
          >
            {/* Decorative elements (consistent across all slides) */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-white"></div>
              <div className="absolute bottom-10 right-20 w-32 h-32 rounded-full bg-white"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white"></div>
            </div>

            {/* Content (consistent structure) */}
            <div className="container mx-auto h-full flex flex-col justify-center items-center text-center relative z-10 py-12 px-6 md:px-12 lg:px-24">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
                {slide.title.split(slide.highlight)[0]}
                <span className="text-yellow-300"> {slide.highlight}</span>
                {slide.title.split(slide.highlight)[1]}
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-xl lg:max-w-2xl mx-auto mb-6 md:mb-8">
                {slide.description}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {slide.buttons.map((button, i) => (
                  <button
                    key={i}
                    className={`${
                      button.variant === "primary"
                        ? "bg-white text-green-700 hover:bg-gray-100"
                        : "bg-transparent border-2 border-white text-white hover:bg-white/10"
                    } font-semibold py-2 px-6 md:py-3 md:px-8 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center`}
                  >
                    {button.text}
                    <svg
                      className="ml-2 w-4 h-4 md:w-5 md:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      ></path>
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Floating products (consistent styling) */}
            <div className="absolute bottom-6 left-0 w-full flex justify-center items-end">
              <div className="flex space-x-3 md:space-x-6 lg:space-x-8">
                {slide.floatingItems.map((item, i) => (
                  <div key={i} className="flex flex-col items-center group">
                    <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-white rounded-full shadow-lg flex items-center justify-center transform hover:-translate-y-2 transition-transform duration-300 mb-1">
                      <img
                        src={`/api/placeholder/48/48`}
                        alt={item.name}
                        className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation controls (consistent across all slides) */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full shadow-lg z-10 transition-all"
        aria-label="Previous slide"
      >
        <FiChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full shadow-lg z-10 transition-all"
        aria-label="Next slide"
      >
        <FiChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Pagination (consistent across all slides) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all ${
              currentSlide === index ? "bg-white w-6" : "bg-white/50 w-3"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ShoppingPage;
