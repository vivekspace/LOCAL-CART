import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductForm from './ProductFrom'; // Ensure this path is correct
import { useAuth } from '../../Context/Context';
// API_BASE_URL is generally handled by authAxios configuration
// so it's less critical to define it here explicitly.
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EditProductPage() {
    const { id } = useParams(); // Get product ID from URL
    const { jwtToken, authAxios, isAuthLoading, adminSignOut } = useAuth(); // Destructure from AuthContext

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // For initial product data fetch
    const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Removed the local adminToken state and its useEffect,
    // as authContext now provides jwtToken and handles initial loading.

    // Removed getAuthHeaders as authAxios handles the Authorization header.
    // The 'multipart/form-data' header will be passed directly to the patch call.

    // Fetch product details when component mounts or ID/jwtToken changes
    useEffect(() => {
        const fetchProduct = async () => {
            // Only fetch if authentication is not loading and a token exists
            if (isAuthLoading || !jwtToken || !id) {
                // If auth is done loading and no token, set error and potentially navigate
                if (!isAuthLoading && !jwtToken) {
                    setError("Admin token required to edit products. Please ensure you are logged in.");
                    navigate('/admin/login');
                }
                setIsLoading(false); // Authentication state isn't ready or token missing, so not actively loading product
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                // Use authAxios which already has Authorization header set
                const response = await authAxios.get(`/api/admin/products/${id}`);

                // Axios throws for non-2xx statuses, so no need for response.data.success check
                setProduct(response.data.product);
            } catch (err) {
                console.error('Error fetching product for edit:', err);
                // AuthContext's interceptor should handle 401 and global logout
                if (err.response && err.response.status === 404) {
                    setError('Product not found.');
                } else {
                    setError(err.response?.data?.message || 'Failed to load product details. Please try again.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [id, jwtToken, authAxios, isAuthLoading, navigate]); // Add authAxios and isAuthLoading to dependencies

    const handleUpdateProduct = async (formData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            // Use authAxios for patching. Explicitly set 'Content-Type' for FormData.
            const response = await authAxios.patch(`/api/admin/products/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for file uploads with FormData
                },
            });

            if (response.data.success) {
                toast.success("Product updated successfully!");
                navigate('/admin/products'); // Redirect back to product list
            } else {
                // This branch might not be hit if authAxios auto-throws on non-success
                throw new Error(response.data.message || 'Failed to update product.');
            }
        } catch (err) {
            console.error('Error updating product:', err);
            // AuthContext's interceptor should handle 401 and global logout
            setError(err.response?.data?.message || 'Failed to update product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Combined loading state for initial authentication check and product fetching
    if (isLoading || isAuthLoading || (!jwtToken && !isAuthLoading)) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700">Loading your edit page...</p>
                    <p className="text-sm text-gray-500">
                        LocalCart is crunching the numbers
                    </p>
                </div>
            </div>
        );
    }

    if (error && !product) { // Only show error if no product data was loaded initially
        return (
            <div className="p-6">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Error:</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!product) { // Product might be null if not found or initial state after loading
        return <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-700">Product not found or access denied.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Product: {product.name}</h1>
            <ProductForm
                product={product}
                onSubmit={handleUpdateProduct}
                isEditing={true}
                isLoading={isSubmitting} // Use isSubmitting for form button
                error={error}
            />
        </div>
    );
}