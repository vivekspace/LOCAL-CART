import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/Context';
// API_BASE_URL is no longer needed here as authAxios manages the base URL
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UserDetailPage() {
    const { id } = useParams(); // Get the user ID from the URL parameter
    const navigate = useNavigate();

    // Destructure necessary values from AuthContext
    const { jwtToken, authAxios, isAuthLoading, adminSignOut } = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // For user data fetching
    const [error, setError] = useState(null);

    // Removed local adminToken state and isTokenLoading state,
    // and the useEffect for token retrieval as AuthContext handles this.

    // Removed getAuthHeaders useCallback as authAxios automatically adds headers.

    useEffect(() => {
        const fetchUser = async () => {
            // Check if authentication is still loading or if no token is available after loading
            if (isAuthLoading) {
                setLoading(true); // Still loading auth, so product data is also pending
                return;
            }

            if (!jwtToken) {
                console.warn("UserDetailPage: JWT token not found. Redirecting to login.");
                setError("Authentication required. Please log in.");
                setLoading(false); // No token, so not loading product data
                navigate('/admin/login'); // Redirect if no token after auth loading
                return;
            }

            if (!id) {
                setError("User ID is missing.");
                setLoading(false);
                return;
            }

            setLoading(true); // Start loading user data
            setError(null);
            try {
                // Use authAxios for the API call. It's pre-configured with the base URL and JWT token.
                const response = await authAxios.get(`/api/admin/users/${id}`);

                // authAxios (configured via interceptors in AuthContext) will throw an error for non-2xx responses.
                // Thus, a direct check for response.data.success might not be strictly necessary if interceptors handle it,
                // but keeping it for explicit success check of the backend's data structure is fine.
                if (response.data.success && response.data.user) {
                    setUser(response.data.user);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch user details.');
                }
            } catch (err) {
                console.error('Error fetching user details:', err);
                // AuthContext's interceptor should handle 401 (logout and redirection)
                if (err.response && err.response.status === 404) {
                    setError("User not found.");
                } else {
                    setError(err.response?.data?.message || 'Failed to load user details. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, jwtToken, authAxios, isAuthLoading, navigate]); // Add jwtToken, authAxios, isAuthLoading to dependencies

    // Combined loading state: either the user data is loading, or authentication is still being processed
    if (loading || isAuthLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700">Loading user details...</p>
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
                {/* Only show "Back to User List" button if error is NOT due to missing token after auth loading */}
                {(!jwtToken && !isAuthLoading) ? (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => navigate('/admin/login')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Go to Login
                        </button>
                    </div>
                ) : (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => navigate('/admin/users')} // Go back to user list
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Back to User List
                        </button>
                    </div>
                )}
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