import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Eye, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../Context/Context';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminProducts() {
    const { jwtToken, authAxios, isAuthLoading } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [expandedProductId, setExpandedProductId] = useState(null);
    const navigate = useNavigate();

    // Authentication check
    useEffect(() => {
        if (!isAuthLoading && !jwtToken) {
            setError("Admin authentication required. Redirecting to login...");
            navigate('/admin/login');
        }
        if (!isAuthLoading) {
            setLoading(false);
        }
    }, [isAuthLoading, jwtToken, navigate]);

    // Fetch products
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await authAxios.get('/api/admin/products');
            setProducts(response.data.products);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err.response?.data?.message || 'Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [authAxios]);

    useEffect(() => {
        if (!isAuthLoading && jwtToken) {
            fetchProducts();
        }
    }, [isAuthLoading, jwtToken, fetchProducts]);

    // Handlers
    const handleEditProduct = useCallback((productId) => {
        navigate(`/admin/products/edit/${productId}`);
    }, [navigate]);

    const handleDeleteProduct = useCallback(async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        
        const originalProducts = products;
        setProducts(prev => prev.filter(p => p._id !== productId));
        
        try {
            await authAxios.delete(`/api/admin/products/${productId}`);
            toast.success("Product deleted successfully!");
        } catch (err) {
            console.error('Error deleting product:', err);
            setError(err.response?.data?.message || 'Failed to delete product. Please try again.');
            setProducts(originalProducts);
        }
    }, [products, authAxios]);

    const handleViewProduct = useCallback((productId) => {
        navigate(`/admin/products/view/${productId}`);
    }, [navigate]);

    const handleAddProduct = useCallback(() => {
        navigate('/admin/products/new');
    }, [navigate]);

    const toggleExpandProduct = (productId) => {
        setExpandedProductId(expandedProductId === productId ? null : productId);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter and sort products
    const filteredAndSortedProducts = React.useMemo(() => {
        let filteredProducts = [...products];
        
        // Apply search filter
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply category filter
        if (categoryFilter !== 'all') {
            filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
        }
        
        // Apply sorting
        if (sortConfig.key) {
            filteredProducts.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return filteredProducts;
    }, [products, searchTerm, categoryFilter, sortConfig]);

    // Get unique categories for filter
    const categories = React.useMemo(() => {
        const uniqueCategories = [...new Set(products.map(product => product.category))];
        return ['all', ...uniqueCategories];
    }, [products]);

    // Loading state
    if (loading || isAuthLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700">Loading products...</p>
                    <p className="text-sm text-gray-500">
                        Preparing your product dashboard
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                    {(!jwtToken && !isAuthLoading) && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => navigate('/admin/login')}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Product Management</h1>
                        <p className="text-gray-600 mt-1">Manage your product inventory</p>
                    </div>
                    <button
                        onClick={handleAddProduct}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-md hover:from-green-700 hover:to-green-600 transition-all flex items-center justify-center"
                    >
                        <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="relative">
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                value={sortConfig.key}
                                onChange={(e) => handleSort(e.target.value)}
                            >
                                <option value="name">Sort by Name</option>
                                <option value="price">Sort by Price</option>
                                <option value="stock">Sort by Stock</option>
                                <option value="createdAt">Sort by Date Added</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products List */}
            {filteredAndSortedProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-gray-500">
                        {searchTerm || categoryFilter !== 'all' 
                            ? "Try adjusting your search or filter criteria."
                            : "There are currently no products in your inventory."}
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setCategoryFilter('all');
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Clear filters
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAndSortedProducts.map(product => (
                        <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {/* Product Summary */}
                            <div 
                                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors grid grid-cols-2 md:grid-cols-5 gap-4 items-center"
                                onClick={() => toggleExpandProduct(product._id)}
                            >
                                <div className="col-span-2 md:col-span-1 flex items-center">
                                    <img
                                        src={product.images && product.images.length > 0 
                                            ? `${API_BASE_URL}/uploads/${product.images[0]}` 
                                            : `${API_BASE_URL}/uploads/default-product.png`}
                                        alt={product.name}
                                        className="w-12 h-12 rounded-md object-cover mr-4 border border-gray-200"
                                        onError={(e) => { 
                                            e.target.onerror = null; 
                                            e.target.src = `${API_BASE_URL}/uploads/default-product.png`;
                                        }}
                                    />
                                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-gray-500">Category</p>
                                    <p className="font-medium text-gray-900 capitalize">{product.category}</p>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-gray-500">Price</p>
                                    <p className="font-bold text-gray-900">
                                        ₹{product.price.toFixed(2)}
                                    </p>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-gray-500">Stock</p>
                                    <p className={`font-medium ${
                                        product.stock > 10 ? 'text-green-600' : 
                                        product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                        {product.stock} {product.stock === 1 ? 'unit' : 'units'}
                                    </p>
                                </div>
                                
                                <div className="flex items-center justify-end space-x-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewProduct(product._id);
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                        title="View"
                                    >
                                        <Eye className="h-5 w-5" />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditProduct(product._id);
                                        }}
                                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProduct(product._id);
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                    {expandedProductId === product._id ? (
                                        <ChevronUp className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                            </div>
                            
                            {/* Expanded Product Details */}
                            <AnimatePresence>
                                {expandedProductId === product._id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Product Images */}
                                            <div className="space-y-3">
                                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                    <svg className="mr-2 h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Product Images
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {product.images && product.images.length > 0 ? (
                                                        product.images.map((image, index) => (
                                                            <img
                                                                key={index}
                                                                src={`${API_BASE_URL}/uploads/${image}`}
                                                                alt={`${product.name} ${index + 1}`}
                                                                className="w-16 h-16 rounded-md object-cover border border-gray-200"
                                                                onError={(e) => { 
                                                                    e.target.onerror = null; 
                                                                    e.target.src = `${API_BASE_URL}/uploads/default-product.png`;
                                                                }}
                                                            />
                                                        ))
                                                    ) : (
                                                        <p className="text-gray-500 text-sm">No images available</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Product Details */}
                                            <div className="space-y-3">
                                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                    <svg className="mr-2 h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Product Details
                                                </h3>
                                                <div className="space-y-2">
                                                    <p className="text-gray-600">
                                                        <span className="font-medium">Description:</span> {product.description || 'No description provided'}
                                                    </p>
                                                    <p className="text-gray-600">
                                                        <span className="font-medium">Created:</span> {new Date(product.createdAt).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-gray-600">
                                                        <span className="font-medium">Last Updated:</span> {new Date(product.updatedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Quick Actions */}
                                            <div className="space-y-3">
                                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                    <svg className="mr-2 h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Quick Actions
                                                </h3>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => handleViewProduct(product._id)}
                                                        className="flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                    >
                                                        <Eye className="mr-1 h-4 w-4" /> View
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditProduct(product._id)}
                                                        className="flex items-center justify-center p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                                                    >
                                                        <Edit className="mr-1 h-4 w-4" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm("Are you sure you want to delete this product?")) {
                                                                handleDeleteProduct(product._id);
                                                            }
                                                        }}
                                                        className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                    >
                                                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/admin/products/duplicate/${product._id}`)}
                                                        className="flex items-center justify-center p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                                    >
                                                        <PlusCircle className="mr-1 h-4 w-4" /> Duplicate
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}