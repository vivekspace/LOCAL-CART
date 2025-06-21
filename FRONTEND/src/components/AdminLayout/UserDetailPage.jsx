import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UserDetailPage() {
    const { id } = useParams(); // Get the user ID from the URL parameter
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adminToken, setAdminToken] = useState(null);
    const [isTokenLoading, setIsTokenLoading] = useState(true);

    // --- Token Retrieval (Same as in UserManagement.jsx) ---
    useEffect(() => {
        const token = localStorage.getItem("adminToken"); //

        if (token) {
            setAdminToken(token);
        } else {
            console.warn("UserDetailPage: 'adminToken' not found. Redirecting to login.");
            setError("Authentication required. Please log in.");
            navigate('/admin/login'); // Redirect to login if no token
        }
        setIsTokenLoading(false);
    }, [navigate]);

    const getAuthHeaders = useCallback(() => {
        if (!adminToken) {
            return {};
        }
        return {
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        };
    }, [adminToken]);

    useEffect(() => {
        if (!isTokenLoading && adminToken && id) {
            const fetchUser = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/admin/users/${id}`, getAuthHeaders());

                    if (response.data.success && response.data.user) {
                        setUser(response.data.user);
                    } else {
                        throw new Error(response.data.message || 'Failed to fetch user details.');
                    }
                } catch (err) {
                    console.error('Error fetching user details:', err);
                    if (err.response && err.response.status === 401) {
                        setError("Your session has expired or is invalid. Please log in again.");
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('adminInfo');
                        navigate('/admin/login');
                    } else if (err.response && err.response.status === 404) {
                        setError("User not found.");
                    } else {
                        setError(err.response?.data?.message || 'Failed to load user details. Please try again.');
                    }
                } finally {
                    setLoading(false);
                }
            };

            fetchUser();
        } else if (!isTokenLoading && !adminToken) {
            setLoading(false);
        }
    }, [id, isTokenLoading, adminToken, getAuthHeaders, navigate]);

    if (loading || isTokenLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading your analytics...</p>
          <p className="text-sm text-gray-500">
            LocalCart is crunching the numbers
          </p>
        </div>
      </div>
    );
  }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Error:</p>
                    <p>{error}</p>
                </div>
                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate('/admin/users')} // Go back to user list
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Back to User List
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return <div className="p-6 text-center text-gray-600">No user data available.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">User Details: {user.name}</h1>
                <button
                    onClick={() => navigate('/admin/users')}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                    Back to List
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Name</p>
                        <p className="mt-1 text-lg text-gray-900">{user.name}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="mt-1 text-lg text-gray-900">{user.email}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Role</p>
                        <p className="mt-1 text-lg text-gray-900 capitalize">{user.role}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <p className="mt-1 text-lg text-gray-900 capitalize">{user.status}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Joined On</p>
                        <p className="mt-1 text-lg text-gray-900">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Last Active</p>
                        <p className="mt-1 text-lg text-gray-900">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Transactions Count</p>
                        <p className="mt-1 text-lg text-gray-900">{user.transactionsCount !== undefined ? user.transactionsCount : 0}</p>
                    </div>
                    {/* Add more user details here as needed */}
                </div>
            </div>
        </div>
    );
}