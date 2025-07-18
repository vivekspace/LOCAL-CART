import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Clock, Mail, Activity, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../Context/Context';
import UserRow from './UserRow';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [expandedUserId, setExpandedUserId] = useState(null);

    const { jwtToken, authAxios, isAuthLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            if (isAuthLoading || !jwtToken) {
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
                const response = await authAxios.get('/api/admin/users');
                setUsers(response.data.users);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError(err.response?.data?.message || 'Failed to load users. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [jwtToken, authAxios, isAuthLoading, navigate]);

    const handleToggleBlock = useCallback((userId, newStatus) => {
        setUsers(prevUsers =>
            prevUsers.map(user =>
                user._id === userId ? { ...user, status: newStatus } : user
            )
        );
    }, []);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleExpandUser = (userId) => {
        setExpandedUserId(expandedUserId === userId ? null : userId);
    };

    const filteredAndSortedUsers = React.useMemo(() => {
        let filteredUsers = [...users];
        
        // Apply search filter
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply role filter
        if (roleFilter !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
        }
        
        // Apply sorting
        if (sortConfig.key) {
            filteredUsers.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return filteredUsers;
    }, [users, searchTerm, roleFilter, statusFilter, sortConfig]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'user': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading || isAuthLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Loading user data</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we fetch user information</p>
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
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Users</h2>
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
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-lg shadow-md hover:from-gray-700 hover:to-gray-600 transition-all"
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                            <Users className="mr-3 text-blue-600" /> 
                            User Management
                        </h1>
                        <p className="text-gray-600 mt-1">Manage all registered users and their permissions</p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Shield className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="all">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                            </select>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Activity className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="blocked">Blocked</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users List */}
            {filteredAndSortedUsers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-gray-500">
                        {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                            ? "Try adjusting your search or filter criteria."
                            : "There are currently no users in the system."}
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setRoleFilter('all');
                                setStatusFilter('all');
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Clear filters
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAndSortedUsers.map(user => (
                        <div key={user._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {/* User Summary */}
                            <div 
                                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors grid grid-cols-2 md:grid-cols-5 gap-4 items-center"
                                onClick={() => toggleExpandUser(user._id)}
                            >
                                <div className="col-span-2 md:col-span-1 flex items-center">
                                    <div className="bg-blue-100 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">ID: {user._id.substring(0, 8)}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium text-gray-900 truncate">{user.email}</p>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-gray-500">Role</p>
                                    <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                                        {user.role}
                                    </span>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-gray-500">Last Active</p>
                                    <p className="font-medium text-gray-900">
                                        {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                                    </p>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                                        {user.status}
                                    </span>
                                    {expandedUserId === user._id ? (
                                        <ChevronUp className="h-5 w-5 text-gray-400 ml-2" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-gray-400 ml-2" />
                                    )}
                                </div>
                            </div>
                            
                            {/* Expanded User Details */}
                            <AnimatePresence>
                                {expandedUserId === user._id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t border-gray-200 p-4">
                                            <UserRow 
                                                user={user} 
                                                onToggleBlock={handleToggleBlock} 
                                                authAxios={authAxios}
                                                onClose={() => setExpandedUserId(null)}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}