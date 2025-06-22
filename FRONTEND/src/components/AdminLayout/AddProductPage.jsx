import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify'; // Assuming toast is available
import ProductForm from './ProductFrom';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AddProductPage() {
    const [isLoading, setIsLoading] = useState(false);
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

    const handleAddProduct = async (formData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/admin/products`, formData, getAuthHeaders());

            if (response.data.success) {
                toast.success("Product added successfully!");
                navigate('/admin/products'); // Redirect back to product list
            } else {
                throw new Error(response.data.message || 'Failed to add product.');
            }
        } catch (err) {
            console.error('Error adding product:', err);
            setError(err.response?.data?.message || 'Failed to add product. Please try again.');
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                navigate('/admin/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!adminToken) {
        return <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-700">Authenticating...</div>;
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