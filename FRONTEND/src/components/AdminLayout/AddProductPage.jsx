import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductForm from './ProductFrom';
import { useAuth } from '../../Context/Context';
// API_BASE_URL is no longer needed here as authAxios handles the base URL
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AddProductPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Use the useAuth hook to get authAxios and authentication state
    const { authAxios, jwtToken, isAuthLoading } = useAuth();

    useEffect(() => {
        // If authentication is still loading, do nothing yet
        if (isAuthLoading) {
            return;
        }
        // If not loading and no token, redirect to admin login
        if (!jwtToken) {
            navigate('/admin/login');
        }
        // No need to set local adminToken state here
    }, [navigate, jwtToken, isAuthLoading]); // Depend on jwtToken and isAuthLoading

    // getAuthHeaders is no longer needed as authAxios handles headers
    // const getAuthHeaders = useCallback(() => {
    //     return {
    //         headers: {
    //             Authorization: `Bearer ${adminToken}`,
    //             'Content-Type': 'multipart/form-data', // Important for file uploads
    //         },
    //     };
    // }, [adminToken]);

    const handleAddProduct = async (formData) => {
        setIsLoading(true);
        setError(null);

        // Ensure authAxios is available before making the call
        if (!authAxios) {
            setError("Authentication client not available. Please log in.");
            setIsLoading(false);
            return;
        }

        try {
            // Use authAxios.post directly. It is pre-configured with the base URL and JWT token.
            // Explicitly set 'Content-Type' for multipart/form-data when sending FormData.
            const response = await authAxios.post(
                '/api/admin/products', // Use relative URL
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data', // Essential for FormData
                    },
                }
            );

            if (response.data.success) {
                toast.success("Product added successfully!");
                navigate('/admin/products'); // Redirect back to product list
            } else {
                throw new Error(response.data.message || 'Failed to add product.');
            }
        } catch (err) {
            console.error('Error adding product:', err);
            setError(err.response?.data?.message || 'Failed to add product. Please try again.');
            // The AuthContext's interceptor will handle 401 errors (logout and redirection)
            // So, manual localStorage.removeItem and navigate calls are removed here.
        } finally {
            setIsLoading(false);
        }
    };

    // Show "Authenticating..." while the auth context is loading
    if (isAuthLoading) {
        return <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-700">Authenticating...</div>;
    }

    // Only render the form if jwtToken is present (meaning authentication is complete and successful)
    if (!jwtToken) {
        // This case is already handled by the useEffect redirect, but for explicit clarity
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Add New Product</h1>
            <ProductForm
                onSubmit={handleAddProduct}
                isEditing={false}
                isLoading={isLoading}
                error={error}
            />
        </div>
    );
}