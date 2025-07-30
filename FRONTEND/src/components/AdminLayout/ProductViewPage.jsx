import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Edit, Star, Package, Tag, Layers, Box, Clock, Hash } from "lucide-react";
import { useAuth } from "../../Context/Context";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProductViewPage() {
    const { id } = useParams();
    const { jwtToken, authAxios, isAuthLoading } = useAuth();
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            if (isAuthLoading || !jwtToken || !id) {
                if (!isAuthLoading && !jwtToken) {
                    setError("Authentication required. Redirecting to login...");
                    navigate('/admin/login');
                }
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const response = await authAxios.get(`/api/admin/products/${id}`);
                setProduct(response.data.product);
                if (response.data.product.images?.length > 0) {
                    setActiveImage(0);
                }
            } catch (err) {
                console.error("Error fetching product:", err);
                if (err.response?.status === 404) {
                    setError("Product not found.");
                } else {
                    setError(err.response?.data?.message || "Failed to load product details.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [id, jwtToken, authAxios, isAuthLoading, navigate]);

    if (isLoading || isAuthLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Loading product details</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the product information</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-md p-6 bg-white rounded-xl shadow-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-red-100 p-3 rounded-full mb-4">
                            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Product</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        {!jwtToken && !isAuthLoading ? (
                            <button
                                onClick={() => navigate("/admin/login")}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all"
                            >
                                Go to Login
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate("/admin/products")}
                                className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-lg shadow-md hover:from-gray-700 hover:to-gray-600 transition-all"
                            >
                                Back to Products
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-md p-6 bg-white rounded-xl shadow-md text-center">
                    <div className="bg-yellow-100 p-3 rounded-full inline-flex mb-4">
                        <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h2>
                    <p className="text-gray-600 mb-6">The requested product could not be found in our system.</p>
                    <button
                        onClick={() => navigate("/admin/products")}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all"
                    >
                        Back to Products
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            {/* Header Section */}
            <div className="mb-8">
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                    <div>
                        <button
                            onClick={() => navigate("/admin/products")}
                            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
                        >
                            <ArrowLeft className="mr-2" /> Back to Products
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                            {product.name}
                        </h1>
                        <p className="text-gray-600 mt-1">Product ID: {product._id}</p>
                    </div>
                    <div className="flex space-x-3">
                        <Link
                            to={`/admin/products/edit/${product._id}`}
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-md hover:from-green-700 hover:to-green-600 transition-all"
                        >
                            <Edit className="mr-2" /> Edit Product
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Main Content */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Image Gallery */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Product Images
                        </h2>
                        {product.images?.length > 0 ? (
                            <div className="space-y-4">
                                <div className="relative aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={product.images[activeImage].url}
                                        alt={`${product.name} - Main`}
                                        className="w-full h-full object-contain p-4"
                                        onError={(e) => (e.target.src = `${API_BASE_URL}/uploads/default-product.png`)}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.images.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveImage(index)}
                                            className={`w-16 h-16 rounded-md overflow-hidden border-2 ${activeImage === index ? 'border-blue-500' : 'border-transparent'}`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={`${product.name} - ${index + 1}`}
                                                className="w-full h-full object-contain"
                                                onError={(e) => (e.target.src = `${API_BASE_URL}/uploads/default-product.png`)}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-100 rounded-lg p-8 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-2 text-gray-600">No images available for this product</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Product Information
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Tag className="w-5 h-5 text-gray-500 mr-2" />
                                <div>
                                    <p className="text-sm text-gray-500">Name</p>
                                    <p className="font-medium">{product.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Layers className="w-5 h-5 text-gray-500 mr-2" />
                                <div>
                                    <p className="text-sm text-gray-500">Description</p>
                                    <p className="font-medium">{product.description || "No description provided"}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Box className="w-5 h-5 text-gray-500 mr-2" />
                                <div>
                                    <p className="text-sm text-gray-500">Category</p>
                                    <p className="font-medium capitalize">{product.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <div>
                                    <p className="text-sm text-gray-500">Brand</p>
                                    <p className="font-medium">{product.brand || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Stock Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pricing & Inventory
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Price</p>
                                <p className="text-2xl font-bold text-gray-800">₹{product.price.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Stock</p>
                                <p className={`text-2xl font-bold ${
                                    product.stock > 10 ? 'text-green-600' : 
                                    product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                    {product.stock}
                                </p>
                                <p className="text-xs text-gray-500">{product.stock === 1 ? 'unit' : 'units'} available</p>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Product Metadata
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Hash className="w-5 h-5 text-gray-500 mr-2" />
                                <div>
                                    <p className="text-sm text-gray-500">Product ID</p>
                                    <p className="font-mono text-sm font-medium">{product._id}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Clock className="w-5 h-5 text-gray-500 mr-2" />
                                <div>
                                    <p className="text-sm text-gray-500">Created At</p>
                                    <p className="font-medium">{new Date(product.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Clock className="w-5 h-5 text-gray-500 mr-2" />
                                <div>
                                    <p className="text-sm text-gray-500">Last Updated</p>
                                    <p className="font-medium">{new Date(product.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}