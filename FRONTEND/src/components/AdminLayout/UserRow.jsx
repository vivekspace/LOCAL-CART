import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { ShieldAlert, ShieldCheck, Edit, Trash } from 'lucide-react'; // Assuming you have lucide-react installed
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UserRow({ user, onToggleBlock }) {
    const [currentUser, setCurrentUser] = useState(user);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [actionError, setActionError] = useState(null);

    const [localAdminToken, setLocalAdminToken] = useState(null); // State to hold the admin token for this component

    // Effect to retrieve the admin token from localStorage.
    // This is crucial for authentication when UserRow performs actions (block/unblock, etc.).
    useEffect(() => {
        const token = localStorage.getItem("adminToken"); // Retrieve the raw token string from 'adminToken' key
        if (token) {
            setLocalAdminToken(token);
            setActionError(null); // Clear any previous errors
        } else {
            console.warn("UserRow: 'adminToken' not found in localStorage. Cannot perform actions requiring authentication.");
            setActionError("Authentication token missing. Cannot perform actions."); // Error message to display
        }
    }, []); // Runs once on component mount

    // Effect to update internal currentUser state if the 'user' prop changes from parent.
    useEffect(() => {
        setCurrentUser(user);
    }, [user]);

    // Derived states for easier readability and conditional rendering
    const isActive = currentUser.status === 'active';
    const isBlocked = currentUser.status === 'blocked';
    const isPending = currentUser.status === 'pending';
    const isVendor = currentUser.role === 'seller';
    const isAdmin = currentUser.role === 'admin';
    const isSuperAdmin = currentUser.role === 'superadmin'; // Corrected from constIsSuperAdmin

    // Memoized function to get authorization headers, dependent on localAdminToken state.
    const getAuthHeaders = useCallback(() => {
        if (!localAdminToken) {
            console.warn("UserRow: Authentication token not available. API requests will fail.");
            return {};
        }
        return {
            headers: {
                Authorization: `Bearer ${localAdminToken}`,
            },
        };
    }, [localAdminToken]);

    // Handler for blocking/unblocking a user
    const handleBlockUnblock = async () => {
        setIsUpdating(true); // Indicate that an update is in progress
        setActionError(null); // Clear previous action errors
        try {
            const newStatus = isActive ? 'blocked' : 'active';
            const endpoint = `${API_BASE_URL}/api/admin/users/${currentUser._id}/status`;
            const payload = { status: newStatus, reason: isActive ? blockReason : '' };

            const response = await axios.patch(endpoint, payload, getAuthHeaders());

            if (response.data.success) {
                // Update the local state of the user
                setCurrentUser(prevUser => ({ ...prevUser, status: newStatus }));
                // Notify the parent (UserManagement) to update its list
                if (onToggleBlock) {
                    onToggleBlock(currentUser._id, newStatus);
                }
            } else {
                throw new Error(response.data.message || 'Failed to update user status.');
            }
        } catch (err) {
            console.error(`Error ${isActive ? 'blocking' : 'unblocking'} user:`, err);
            setActionError(err.response?.data?.message || `Failed to ${isActive ? 'block' : 'unblock'} user. Please try again.`);
            // If 401, token is invalid/expired; clear it from local storage
            if (err.response && err.response.status === 401) {
                console.warn("UserRow: Admin token invalid or expired. Clearing token.");
                localStorage.removeItem('adminToken'); // Remove the raw token
                localStorage.removeItem('adminInfo'); // Also clear adminInfo for consistency
                setLocalAdminToken(null);
            }
        } finally {
            setIsUpdating(false); // End update process
            setIsBlockModalOpen(false); // Close modal
            setBlockReason(''); // Reset block reason
        }
    };

    // Handler for approving a vendor application
    const handleApproveVendor = async () => {
        setIsUpdating(true);
        setActionError(null);
        try {
            const endpoint = `${API_BASE_URL}/api/admin/vendors/${currentUser._id}/approve`;
            const response = await axios.patch(endpoint, {}, getAuthHeaders());

            if (response.data.success) {
                setCurrentUser(prevUser => ({ ...prevUser, status: 'active', role: 'seller' }));
                if (onToggleBlock) {
                    onToggleBlock(currentUser._id, 'active');
                }
            } else {
                throw new Error(response.data.message || 'Failed to approve vendor.');
            }
        } catch (err) {
            console.error('Error approving vendor:', err);
            setActionError(err.response?.data?.message || 'Failed to approve vendor. Please try again.');
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                setLocalAdminToken(null);
            }
        } finally {
            setIsUpdating(false);
        }
    };

    // Handler for rejecting a vendor application
    const handleRejectVendor = async () => {
        setIsUpdating(true);
        setActionError(null);
        try {
            const endpoint = `${API_BASE_URL}/api/admin/vendors/${currentUser._id}/reject`;
            const response = await axios.patch(endpoint, {}, getAuthHeaders());

            if (response.data.success) {
                setCurrentUser(prevUser => ({ ...prevUser, status: 'rejected' }));
                if (onToggleBlock) {
                    onToggleBlock(currentUser._id, 'rejected');
                }
            } else {
                throw new Error(response.data.message || 'Failed to reject vendor.');
            }
        } catch (err) {
            console.error('Error rejecting vendor:', err);
            setActionError(err.response?.data?.message || 'Failed to reject vendor. Please try again.');
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                setLocalAdminToken(null);
            }
        } finally {
            setIsUpdating(false);
        }
    };

    // Helper function to render user photo or a fallback avatar
    const renderUserPhoto = () => {
        const photoUrl = currentUser.photo && currentUser.photo !== 'default.jpg'
            ? `${API_BASE_URL}/uploads/users/${currentUser.photo}`
            : `${API_BASE_URL }/uploads/default-user-avatar.png`; // Fallback image path

        return (
            <img
                src={photoUrl}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover mr-3"
                onError={(e) => {
                    // Hide image and show fallback div if image fails to load
                    e.target.style.display = 'none';
                    const fallbackDiv = e.target.parentElement.querySelector('.fallback-avatar');
                    if (fallbackDiv) {
                        fallbackDiv.style.display = 'flex';
                    }
                }}
            />
        );
    };


    return (
        <>
            <div className="grid grid-cols-12 p-4 border-b border-gray-200 text-gray-900 hover:bg-gray-50">
                <div className="col-span-3 flex items-center">
                    {renderUserPhoto()}
                    {/* Fallback avatar div */}
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-gray-600 font-semibold text-lg uppercase fallback-avatar"
                         style={{ display: (currentUser.photo && currentUser.photo !== 'default.jpg') ? 'none' : 'flex' }}>
                        {currentUser.name ? currentUser.name.charAt(0) : '?'}
                    </div>
                    <div>
                        {/* Link to User Detail Page using React Router's Link component */}
                        <Link
                            to={`/admin/users/${currentUser._id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                        >
                            {currentUser.name}
                        </Link>
                    </div>
                </div>
                <div className="col-span-3 text-sm text-gray-600 truncate">{currentUser.email}</div>
                <div className="col-span-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isVendor ? 'bg-purple-100 text-purple-800' :
                        isAdmin ? 'bg-blue-100 text-blue-800' :
                        isSuperAdmin ? 'bg-indigo-100 text-indigo-800' :
                        'bg-green-100 text-green-800'
                    } capitalize`}>
                        {currentUser.role}
                    </span>
                </div>
                <div className="col-span-2 text-sm text-gray-600">
                    {currentUser.lastLoginAt ? new Date(currentUser.lastLoginAt).toLocaleString() : 'N/A'}
                </div>
                <div className="col-span-1 text-center text-sm text-gray-600">
                    {currentUser.transactionsCount !== undefined ? currentUser.transactionsCount : 0}
                </div>
                <div className="col-span-2 flex items-center justify-between pl-2">
                    {/* Status display */}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isBlocked ? 'bg-red-100 text-red-800' :
                        isPending ? 'bg-yellow-100 text-yellow-800' :
                        isActive ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    } capitalize`}>
                        {currentUser.status || 'N/A'}
                    </span>
                    {/* Action buttons */}
                    <div className="flex space-x-2 ml-4">
                        {isVendor && isPending && (
                            <>
                                <button
                                    onClick={handleApproveVendor}
                                    className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 focus:ring-offset-2 focus:ring-offset-white"
                                    title="Approve Vendor"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? <span className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full block"></span> : <ShieldCheck size={18} />}
                                </button>
                                <button
                                    onClick={handleRejectVendor}
                                    className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 focus:ring-offset-2 focus:ring-offset-white"
                                    title="Reject Vendor"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? <span className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full block"></span> : <Trash size={18} />}
                                </button>
                            </>
                        )}

                        {/* Block/Unblock button for non-pending, non-vendor, non-admin users */}
                        {(!isPending && !isVendor && !isAdmin && !isSuperAdmin) && (
                            <button
                                onClick={() => setIsBlockModalOpen(true)}
                                className={`p-1 rounded-full ${
                                    isBlocked
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                        : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                                } focus:outline-none focus:ring-2 focus:ring-opacity-75 focus:ring-offset-2 focus:ring-offset-white`}
                                title={isBlocked ? 'Activate User' : 'Block User'}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <span className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full block"></span> : (isBlocked ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />)}
                            </button>
                        )}

                        {/* Edit/View Details button - now linking to UserDetailPage */}
                        <Link
                            to={`/admin/users/${currentUser._id}`}
                            className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 focus:ring-offset-2 focus:ring-offset-white"
                            title="View User Details" // Changed title to reflect navigation
                            disabled={isUpdating}
                        >
                            <Edit size={16} /> {/* You might want a different icon for "view" */}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Error message display for actions */}
            {actionError && (
                <div className="p-2 bg-red-100 text-red-700 text-sm rounded-b-lg -mt-px border border-red-200">
                    {actionError}
                </div>
            )}

            {/* Block/Unblock Confirmation Modal */}
            {isBlockModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {isActive ? 'Block User' : 'Unblock User'}
                                </h3>
                                <button
                                    onClick={() => setIsBlockModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            {isActive && ( // Only show reason dropdown when blocking
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason for blocking
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 bg-white"
                                        value={blockReason}
                                        onChange={(e) => setBlockReason(e.target.value)}
                                    >
                                        <option value="">Select a reason</option>
                                        <option value="spam">Spam or fake account</option>
                                        <option value="abuse">Abusive behavior</option>
                                        <option value="policy">Policy violation</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            )}

                            <p className="mb-6 text-gray-700">
                                {isActive
                                    ? `Are you sure you want to block ${currentUser.name}? They will lose access to their account.`
                                    : `Are you sure you want to unblock ${currentUser.name}? They will regain access to their account.`}
                            </p>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsBlockModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 focus:ring-offset-2"
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBlockUnblock}
                                    className={`px-4 py-2 rounded-md text-white ${
                                        isActive
                                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                    } focus:outline-none focus:ring-2 focus:ring-opacity-75 focus:ring-offset-2`}
                                    disabled={isUpdating || (isActive && !blockReason)} // Disable if blocking and no reason selected
                                >
                                    {isUpdating ? (
                                        <span className="flex items-center">
                                            <span className="animate-spin h-5 w-5 mr-2 border-b-2 border-white rounded-full"></span>
                                            Processing...
                                        </span>
                                    ) : (
                                        isActive ? 'Confirm Block' : 'Confirm Unblock'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}