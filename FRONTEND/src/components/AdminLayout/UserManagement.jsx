import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import UserRow from './UserRow'; // Ensure this path is correct
// No need to import Link here as UserManagement doesn't link directly to user detail page itself.
// Link will be used in UserRow.jsx.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTokenLoading, setIsTokenLoading] = useState(true);
    const [adminToken, setAdminToken] = useState(null);

    // CRITICAL FIX: Get 'adminToken' directly from localStorage
    // This useEffect runs once on component mount to retrieve the authentication token.
    useEffect(() => {
        const token = localStorage.getItem("adminToken"); // <-- This is the key that holds the raw token

        if (token) {
            setAdminToken(token);
            setError(null); // Clear any previous token-related errors
        } else {
            console.warn("UserManagement: 'adminToken' not found in localStorage. Admin is not logged in.");
            setError("Admin token required to fetch users. Please ensure you are logged in."); // Error message seen on UI
            setAdminToken(null); // Explicitly set to null if not found
        }

        setIsTokenLoading(false); // Mark token loading as complete
    }, []); // Empty dependency array means this runs once on mount

    // Memoized function to generate authorization headers for API calls.
    // It depends on the 'adminToken' state.
    const getAuthHeaders = useCallback(() => {
        if (!adminToken) {
            console.warn("Authentication token not available. API requests will fail.");
            return {};
        }
        return {
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        };
    }, [adminToken]);

   
    useEffect(() => {
        if (!isTokenLoading && adminToken) { // Only attempt fetch if token is loaded and present
            const fetchUsers = async () => {
                setLoading(true); // Set loading state to true before API call
                setError(null); // Clear any previous errors

                try {
                    const response = await axios.get(`${API_BASE_URL}/api/admin/users`, getAuthHeaders());

                    if (response.data.success) {
                        setUsers(response.data.users); // Update users state with data from backend
                    } else {
                        // Handle cases where backend responds with success: false
                        throw new Error(response.data.message || 'Failed to fetch users data.');
                    }
                } catch (err) {
                    console.error('Error fetching users:', err);
                    // Handle 401 Unauthorized errors (token expired/invalid)
                    if (err.response && err.response.status === 401) {
                        setError("Your session has expired or is invalid. Please log in again.");
                        localStorage.removeItem('adminToken'); // Clear bad token
                        localStorage.removeItem('adminInfo'); // Also clear adminInfo for consistency
                        setAdminToken(null); // Clear token from state
                    } else {
                        // General error handling
                        setError(err.response?.data?.message || 'Failed to load users. Please try again.');
                    }
                } finally {
                    setLoading(false); // Always set loading to false when done
                }
            };

            fetchUsers();
        } else if (!isTokenLoading && !adminToken) {
            setLoading(false);
        }
    }, [isTokenLoading, adminToken, getAuthHeaders]); // Dependencies for this useEffect

  
    const handleToggleBlock = useCallback((userId, newStatus) => {
        setUsers(prevUsers =>
            prevUsers.map(user =>
                user._id === userId ? { ...user, status: newStatus } : user
            )
        );
    }, []);

    // Conditional rendering for loading, error, or data display.
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
                {!adminToken && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => window.location.href = '/admin/login'} 
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

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-12 font-semibold text-gray-600">
                        <div className="col-span-3">User</div>
                        <div className="col-span-3">Email</div>
                        <div className="col-span-1">Role</div>
                        <div className="col-span-2">Last Active</div>
                        <div className="col-span-1 text-center">Transactions</div>
                        <div className="col-span-2 pl-2">Status & Actions</div>
                    </div>
                </div>
                <div>
                    {users.length > 0 ? (
                        users.map(user => (
                            <UserRow key={user._id} user={user} onToggleBlock={handleToggleBlock} />
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-600">No users found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}