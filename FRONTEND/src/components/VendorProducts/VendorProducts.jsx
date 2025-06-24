import React from "react";
import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiFilter, FiChevronDown, FiChevronUp , FiTrendingUp , FiClock } from "react-icons/fi";
import axios from "axios";
import { Link } from "react-router-dom";
import { Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VendorProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [expandedProduct, setExpandedProduct] = useState(null);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("vendorToken");
        if (!token) {
          setError("No token found. Please login again.");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/vendor/products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProducts(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

  const filteredProducts = sortedProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "active" && product.stock > 0) ||
      (activeFilter === "out-of-stock" && product.stock <= 0);
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      const token = localStorage.getItem("vendorToken");
      if (!token) {
        alert("No token found. Please login again.");
        return;
      }

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/vendor/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProducts(products.filter((product) => product._id !== productId));
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    }
  };

  const toggleExpandProduct = (productId) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <div className="text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"
          />
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-700 font-medium"
          >
            Loading your products...
          </motion.p>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-gray-500 mt-1"
          >
            Preparing your product catalog
          </motion.p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-6 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-xl max-w-xl mx-auto mt-10 shadow-lg border border-red-100"
      >
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Error Loading Products
        </h2>
        <p className="mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-wrap lg:md:justify-between items-center mb-8"
      >
        <div className="flex justify-center items-center gap-4 lg:md:mb-0 mb-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Box className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-2" size={35} />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            My Products
          </h1>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            to={"/vendor-sell"}
            className="flex items-center bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-3 rounded-lg transition-all shadow-md hover:shadow-lg w-full lg:md:w-auto"
          >
            <FiPlus className="mr-2" />
            Add New Product
          </Link>
        </motion.div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row justify-between mb-6 gap-4"
      >
        <div className="relative flex-grow max-w-xl">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 focus:shadow-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeFilter === "all"
                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-inner"
                : "bg-white border border-gray-200 hover:border-gray-300"
            }`}
          >
            All Products
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveFilter("active")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeFilter === "active"
                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-inner"
                : "bg-white border border-gray-200 hover:border-gray-300"
            }`}
          >
            In Stock
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveFilter("out-of-stock")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeFilter === "out-of-stock"
                ? "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200 shadow-inner"
                : "bg-white border border-gray-200 hover:border-gray-300"
            }`}
          >
            Out of Stock
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <StatCard
          title="Total Products"
          value={products.length}
          icon={<Box className="w-6 h-6" />}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Active Products"
          value={products.filter((p) => p.stock > 0).length}
          icon={<FiTrendingUp className="w-6 h-6" />}
          color="from-green-500 to-emerald-500"
        />
        <StatCard
          title="Out of Stock"
          value={products.filter((p) => p.stock <= 0).length}
          icon={<FiClock className="w-6 h-6" />}
          color="from-amber-500 to-orange-500"
        />
      </motion.div>

      {/* Products Table */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader 
                  title="Product" 
                  sortKey="name"
                  handleSort={handleSort}
                  sortConfig={sortConfig}
                />
                <TableHeader 
                  title="Category" 
                  sortKey="category"
                  handleSort={handleSort}
                  sortConfig={sortConfig}
                />
                <TableHeader 
                  title="Price" 
                  sortKey="price"
                  handleSort={handleSort}
                  sortConfig={sortConfig}
                />
                <TableHeader 
                  title="Stock" 
                  sortKey="stock"
                  handleSort={handleSort}
                  sortConfig={sortConfig}
                />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <React.Fragment key={product._id}>
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleExpandProduct(product._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                            <img
                              className="h-full w-full object-cover"
                              src={
                                product.images?.[0]
                                  ? `${import.meta.env.VITE_API_URL}/uploads/${product.images[0]}`
                                  : `${import.meta.env.VITE_API_URL}/uploads/default-product.png`
                              }
                              alt={product.name}
                              onError={(e) => {
                                e.target.src = `${import.meta.env.VITE_API_URL}/uploads/default-product.png`;
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              SKU: {product.sku || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 capitalize">
                          {product.category || 'Uncategorized'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{product.price?.toLocaleString('en-IN') || '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.stock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.stock > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {product.stock > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link
                          to={`/vendor/products/edit/${product._id}`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <FiEdit className="mr-1" /> Edit
                        </Link>
                        <button
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(product._id);
                          }}
                        >
                          <FiTrash2 className="mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedProduct === product._id && (
                        <motion.tr 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gray-50"
                        >
                          <td colSpan="6" className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                                <p className="text-sm text-gray-700">
                                  {product.description || 'No description provided'}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Details</h4>
                                <ul className="text-sm text-gray-700 space-y-1">
                                  <li>Created: {new Date(product.createdAt).toLocaleDateString()}</li>
                                  <li>Updated: {new Date(product.updatedAt).toLocaleDateString()}</li>
                                  <li>Rating: {product.rating || 'Not rated'}</li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Images</h4>
                                <div className="flex space-x-2">
                                  {product.images?.length > 0 ? (
                                    product.images.slice(0, 3).map((image, index) => (
                                      <div key={index} className="w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                                        <img
                                          src={`${import.meta.env.VITE_API_URL}/uploads/${image}`}
                                          alt={`Product ${index + 1}`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.src = `${import.meta.env.VITE_API_URL}/uploads/default-product.png`;
                                          }}
                                        />
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-sm text-gray-500">No images</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm 
                          ? "Try adjusting your search query"
                          : activeFilter !== "all" 
                            ? "No products match your filter"
                            : "You haven't added any products yet"}
                      </p>
                      <Link
                        to="/vendor-sell"
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                        Add New Product
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

const TableHeader = ({ title, sortKey, handleSort, sortConfig }) => {
  const isSorted = sortConfig.key === sortKey;
  const isAscending = isSorted && sortConfig.direction === 'ascending';
  
  return (
    <th 
      scope="col" 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center">
        {title}
        {isSorted ? (
          isAscending ? (
            <FiChevronUp className="ml-1 w-4 h-4" />
          ) : (
            <FiChevronDown className="ml-1 w-4 h-4" />
          )
        ) : (
          <FiFilter className="ml-1 w-3 h-3 opacity-50" />
        )}
      </div>
    </th>
  );
};

const StatCard = ({ title, value, icon, color = "from-gray-500 to-gray-700" }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-r ${color} text-white`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default VendorProductsPage;