import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductForm from './ProductFrom';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EditProductPage() {
    const { id } = useParams(); // Get product ID from URL
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [adminToken, setAdminToken] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if (token) {
            setAdminToken(token);
        } else {
            navigate('/admin/login');
        }
    }, [navigate]);

    const getAuthHeaders = useCallback(() => {
        return {
            headers: {
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'multipart/form-data', // Important for file uploads
            },
        };
    }, [adminToken]);

    // Fetch product details when component mounts or ID/token changes
    useEffect(() => {
        const fetchProduct = async () => {
            if (!adminToken || !id) return; // Don't fetch if no token or no ID
            setIsLoading(true);
            setError(null);
            try {
                // Make sure your backend has a GET endpoint for /api/admin/products/:id
                const response = await axios.get(`${API_BASE_URL}/api/admin/products/${id}`, {
                    headers: { Authorization: `Bearer ${adminToken}` } // No multipart for GET
                });

                if (response.data.success) {
                    setProduct(response.data.product);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch product details.');
                }
            } catch (err) {
                console.error('Error fetching product for edit:', err);
                setError(err.response?.data?.message || 'Failed to load product details. Please try again.');
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminInfo');
                    navigate('/admin/login');
                } else if (err.response && err.response.status === 404) {
                    setError('Product not found.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [id, adminToken, navigate]);

    const handleUpdateProduct = async (formData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await axios.patch(`${API_BASE_URL}/api/admin/products/${id}`, formData, getAuthHeaders());

            if (response.data.success) {
                toast.success("Product updated successfully!");
                navigate('/admin/products'); // Redirect back to product list
            } else {
                throw new Error(response.data.message || 'Failed to update product.');
            }
        } catch (err) {
            console.error('Error updating product:', err);
            setError(err.response?.data?.message || 'Failed to update product. Please try again.');
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                navigate('/admin/login');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!adminToken || isLoading) {
        return <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-700">Loading product details...</div>;
    }

    if (error && !product) { // Only show error if no product data was loaded
        return (
            <div className="p-6">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Error:</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!product) { // Product might be null if not found or initial state
        return <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-700">Product not found.</div>;
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