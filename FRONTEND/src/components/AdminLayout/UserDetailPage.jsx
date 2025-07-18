import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Shield, Activity, Calendar, Clock, CreditCard, Settings, Lock, Unlock , Edit , ShoppingBag} from 'lucide-react';
import { useAuth } from '../../Context/Context';
import { motion } from 'framer-motion';

export default function UserDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { jwtToken, authAxios, isAuthLoading } = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (isAuthLoading || !jwtToken || !id) {
                if (!isAuthLoading && !jwtToken) {
                    setError("Authentication required. Redirecting to login...");
                    navigate('/admin/login');
                }
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await authAxios.get(`/api/admin/users/${id}`);
                setUser(response.data.user);
            } catch (err) {
                console.error('Error fetching user:', err);
                if (err.response?.status === 404) {
                    setError("User not found.");
                } else {
                    setError(err.response?.data?.message || 'Failed to load user details.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, jwtToken, authAxios, isAuthLoading, navigate]);

    const toggleUserStatus = async () => {
        if (!user) return;
        
        setIsUpdatingStatus(true);
        try {
            const newStatus = user.status === 'active' ? 'blocked' : 'active';
            const response = await authAxios.patch(`/api/admin/users/${id}/status`, { status: newStatus });
            setUser({ ...user, status: newStatus });
        } catch (err) {
            console.error('Error updating user status:', err);
            setError(err.response?.data?.message || 'Failed to update user status.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    if (loading || isAuthLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Loading user details</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the user information</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-md p-6 bg-white rounded-xl shadow-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-red-100 p-3 rounded-full mb-4">
                            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading User</h2>
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
                                onClick={() => navigate("/admin/users")}
                                className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-lg shadow-md hover:from-gray-700 hover:to-gray-600 transition-all"
                            >
                                Back to Users
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-md p-6 bg-white rounded-xl shadow-md text-center">
                    <div className="bg-yellow-100 p-3 rounded-full inline-flex mb-4">
                        <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">User Not Found</h2>
                    <p className="text-gray-600 mb-6">The requested user could not be found in our system.</p>
                    <button
                        onClick={() => navigate("/admin/users")}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all"
                    >
                        Back to Users
                    </button>
                </div>
            </div>
        );
    }

    const getStatusColor = () => {
        return user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const getRoleColor = () => {
        return user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
    };

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
                    <button
                        onClick={() => navigate("/admin/users")}
                        className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
                    >
                        <ArrowLeft className="mr-2" /> Back to Users
                    </button>
                    
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center">
                            <div className="bg-blue-100 text-blue-800 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mr-4">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{user.name}</h1>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`px-3 py-1 inline-flex items-center text-sm leading-5 font-semibold rounded-full ${getRoleColor()}`}>
                                        {user.role}
                                    </span>
                                    <span className={`px-3 py-1 inline-flex items-center text-sm leading-5 font-semibold rounded-full ${getStatusColor()}`}>
                                        {user.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <button
                            onClick={toggleUserStatus}
                            disabled={isUpdatingStatus}
                            className={`px-6 py-3 rounded-lg shadow-md transition-all flex items-center justify-center ${
                                user.status === 'active' ? 
                                'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white' :
                                'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white'
                            }`}
                        >
                            {isUpdatingStatus ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {user.status === 'active' ? 'Blocking...' : 'Activating...'}
                                </>
                            ) : (
                                <>
                                    {user.status === 'active' ? (
                                        <>
                                            <Lock className="mr-2 h-5 w-5" /> Block User
                                        </>
                                    ) : (
                                        <>
                                            <Unlock className="mr-2 h-5 w-5" /> Activate User
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Information Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <User className="mr-2 h-5 w-5 text-blue-500" />
                                Basic Information
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <Mail className="w-5 h-5 text-gray-500 mr-2" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Shield className="w-5 h-5 text-gray-500 mr-2" />
                                    <div>
                                        <p className="text-sm text-gray-500">Role</p>
                                        <p className="font-medium capitalize">{user.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Activity className="w-5 h-5 text-gray-500 mr-2" />
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <p className="font-medium capitalize">{user.status}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activity Card */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <Clock className="mr-2 h-5 w-5 text-purple-500" />
                                Activity
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                                    <div>
                                        <p className="text-sm text-gray-500">Joined On</p>
                                        <p className="font-medium">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-5 h-5 text-gray-500 mr-2" />
                                    <div>
                                        <p className="text-sm text-gray-500">Last Active</p>
                                        <p className="font-medium">
                                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <CreditCard className="mr-2 h-5 w-5 text-green-500" />
                                Statistics
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Total Transactions</p>
                                    <p className="text-3xl font-bold text-gray-800">
                                        {user.transactionsCount !== undefined ? user.transactionsCount : 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Spent</p>
                                    <p className="text-3xl font-bold text-gray-800">
                                        ₹{user.totalSpent !== undefined ? user.totalSpent.toFixed(2) : '0.00'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions Card */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <Settings className="mr-2 h-5 w-5 text-yellow-500" />
                                Quick Actions
                            </h2>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/admin/users/${user._id}/edit`)}
                                    className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-left flex items-center"
                                >
                                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                </button>
                                <button
                                    onClick={() => navigate(`/admin/users/${user._id}/orders`)}
                                    className="w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-left flex items-center"
                                >
                                    <ShoppingBag className="mr-2 h-4 w-4" /> View Orders
                                </button>
                                <button
                                    onClick={() => navigate(`/admin/users/${user._id}/transactions`)}
                                    className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-left flex items-center"
                                >
                                    <CreditCard className="mr-2 h-4 w-4" /> View Transactions
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}