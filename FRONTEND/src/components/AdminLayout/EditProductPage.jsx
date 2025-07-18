import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../Context/Context';
import ProductForm from './ProductFrom';
import { motion } from 'framer-motion';

export default function EditProductPage() {
    const { id } = useParams();
    const { jwtToken, authAxios, isAuthLoading } = useAuth();
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
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
            } catch (err) {
                console.error('Error fetching product:', err);
                if (err.response?.status === 404) {
                    setError('Product not found.');
                } else {
                    setError(err.response?.data?.message || 'Failed to load product details.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [id, jwtToken, authAxios, isAuthLoading, navigate]);

    const handleUpdateProduct = async (formData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await authAxios.patch(`/api/admin/products/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success("Product updated successfully!", {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            navigate('/admin/products');
        } catch (err) {
            console.error('Error updating product:', err);
            setError(err.response?.data?.message || 'Failed to update product.');
            toast.error("Failed to update product", {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

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

    if (error && !product) {
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
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-6xl mx-auto"
            >
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <button
                                onClick={() => navigate("/admin/products")}
                                className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
                            >
                                <ArrowLeft className="mr-2" /> Back to Products
                            </button>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                                Edit Product: <span className="text-blue-600">{product.name}</span>
                            </h1>
                            <p className="text-gray-600 mt-1">Product ID: {product._id}</p>
                        </div>
                        <button
                            type="submit"
                            form="product-form"
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-5 w-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Form Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="bg-white rounded-xl shadow-sm p-6"
                >
                    <ProductForm
                        product={product}
                        onSubmit={handleUpdateProduct}
                        isEditing={true}
                        isLoading={isSubmitting}
                        error={error}
                    />
                </motion.div>

                {/* Status Messages */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg"
                    >
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="font-medium">{error}</p>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}