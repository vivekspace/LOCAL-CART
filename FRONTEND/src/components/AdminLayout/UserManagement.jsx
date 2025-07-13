import React, { useEffect, useState, useCallback } from 'react';
// axios is implicitly used by authAxios, but can be kept if direct axios calls are still made elsewhere.
// Since UserManagement only uses authAxios, direct axios import can be removed if not used.
// import axios from 'axios';
import UserRow from './UserRow'; // Ensure this path is correct
import { useAuth } from '../../Context/Context';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

// API_BASE_URL is no longer needed here as authAxios manages the base URL
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true); // For users data fetch
    const [error, setError] = useState(null);

    // Destructure necessary values from AuthContext
    const { jwtToken, authAxios, isAuthLoading, adminSignOut } = useAuth();
    const navigate = useNavigate();

    // Removed the local adminToken and isTokenLoading states and their useEffect,
    // as AuthContext now provides jwtToken and handles initial loading.

    // Removed getAuthHeaders useCallback as authAxios automatically adds headers.

    useEffect(() => {
        const fetchUsers = async () => {
            // Check if authentication is still loading or if no token is available after loading
            if (isAuthLoading) {
                setLoading(true); // Still loading auth, so user data is also pending
                return;
            }

            if (!jwtToken) {
                console.warn("UserManagement: JWT token not found. Redirecting to login.");
                setError("Admin token required to fetch users. Please ensure you are logged in.");
                setLoading(false); // No token, so not loading user data
                // No need for explicit navigate here, the error state will render a login button.
                // Or you could navigate directly if that's the desired UX for missing token
                return;
            }

            setLoading(true); // Set loading state to true before API call
            setError(null); // Clear any previous errors

            try {
                // Use authAxios for the API call. It's pre-configured with the base URL and JWT token.
                const response = await authAxios.get(`/api/admin/users`);

                // authAxios (configured via interceptors in AuthContext) will throw an error for non-2xx responses.
                // Thus, a direct check for response.data.success might not be strictly necessary if interceptors handle it,
                // but keeping it for explicit success check of the backend's data structure is fine.
                if (response.data.success) {
                    setUsers(response.data.users); // Update users state with data from backend
                } else {
                    // Handle cases where backend responds with success: false
                    throw new Error(response.data.message || 'Failed to fetch users data.');
                }
            } catch (err) {
                console.error('Error fetching users:', err);
                // AuthContext's interceptor should handle 401 (logout and redirection)
                setError(err.response?.data?.message || 'Failed to load users. Please try again.');
            } finally {
                setLoading(false); // Always set loading to false when done
            }
        };

        fetchUsers();
    }, [jwtToken, authAxios, isAuthLoading, navigate]); // Add jwtToken, authAxios, isAuthLoading to dependencies

    const handleToggleBlock = useCallback((userId, newStatus) => {
        // This function primarily updates the local state.
        // The actual API call for blocking/unblocking is likely within UserRow.jsx,
        // which would also need to use `authAxios`
        setUsers(prevUsers =>
            prevUsers.map(user =>
                user._id === userId ? { ...user, status: newStatus } : user
            )
        );
    }, []);

    // Conditional rendering for combined loading, error, or data display.
    if (loading || isAuthLoading) { // Check both local loading and auth context loading
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700">Loading user data...</p>
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
                {/* Show "Go to Login" button only if there's an error AND no token after auth loading is complete */}
                {!jwtToken && !isAuthLoading && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => navigate('/admin/login')} // Use navigate for SPA routing
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>

            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <div className="p-4 border-b border-gray-200 bg-gray-50 min-w-[900px]">
                    <div className="grid grid-cols-12 font-semibold text-gray-600">
                        <div className="col-span-3">User</div>
                        <div className="col-span-3">Email</div>
                        <div className="col-span-1">Role</div>
                        <div className="col-span-2">Last Active</div>
                        <div className="col-span-1 text-center">Transactions</div>
                        <div className="col-span-2 pl-2">Status & Actions</div>
                    </div>
                </div>
                <div className="min-w-[900px]">
                    {users.length > 0 ? (
                        users.map(user => (
                            // Pass authAxios down if UserRow makes API calls that need authentication
                            <UserRow key={user._id} user={user} onToggleBlock={handleToggleBlock} authAxios={authAxios} />
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-600">No users found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}