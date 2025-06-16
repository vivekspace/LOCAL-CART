import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import {
    Search,
    PlusCircle,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    Star,
    Store,
    RefreshCw,
    AlertCircle,
    Clock
} from 'lucide-react';

const VendorsPage = () => {
    const [vendors, setVendors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const vendorsPerPage = 8;
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    // IMPORTANT: Replace 'YOUR_API_BASE_URL_HERE' with your actual backend API URL.
    // Based on your previous error, it was 'http://localhost:808'.
    const API_URL = import.meta.env.VITE_API_URL; 

    // Function to fetch vendors from the API
    const fetchVendors = async () => {
        setLoading(true);
        setError(null);
        try {
            const adminToken = localStorage.getItem("adminToken");
            if (!adminToken) {
                setError("Admin not authenticated. Please login.");
                navigate('/admin/login');
                return;
            }

            const response = await axios.get(`${API_URL}/api/admin/vendors`, {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
            console.log(response)

            let apiVendors = [];
            // --- FIX: Adjusting to match your backend's direct array response ---
            if (response.data && Array.isArray(response.data)) {
                // Your backend returns an array directly, not an object with a 'vendors' key
                apiVendors = response.data;
            } else if (response.data && Array.isArray(response.data.vendors)) {
                // Keep this fallback in case backend structure changes
                apiVendors = response.data.vendors;
            } else {
                console.warn("API response structure unexpected:", response.data);
                setError("Unexpected data structure from API. Expected an array of vendors.");
                setVendors([]);
                return; // Exit if data structure is unexpected
            }

            const transformedVendors = apiVendors.map(vendor => ({
                ...vendor,
                // --- FIXES FOR MISSING INFO START ---
                // Mapping 'name' to 'owner' as you don't have a separate owner field
                owner: vendor.name || 'N/A', // Assuming vendor's name is the owner for display
                // Calculating products count from the 'products' array
                products: Array.isArray(vendor.products) ? vendor.products.length : 'N/A',
                // 'rating' field is missing from your backend, so it will always be N/A
                rating: vendor.rating !== undefined ? vendor.rating.toFixed(1) : 'N/A',
                // 'status' field is missing from your backend, defaulting to 'Unknown'
                status: vendor.status || 'Unknown',
                // 'createdAt' field is missing, using _id as a fallback for 'joined', will be 'Invalid Date'
                // RECOMMENDED BACKEND FIX: Add `timestamps: true` to your Mongoose Vendor schema
                joined: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Invalid Date',
                // --- FIXES FOR MISSING INFO END ---
                image: vendor.image || `https://placehold.co/40x40/E0F2F1/059669?text=${vendor.name ? vendor.name.charAt(0) : 'V'}` // Keep fallback image
            }));
            setVendors(transformedVendors);

        } catch (err) {
            console.error("Error fetching vendors:", err);
            if (axios.isAxiosError(err)) { // Use Axios's type guard
                if (err.response) {
                    console.error("Error response data:", err.response.data);
                    console.error("Error response status:", err.response.status);
                    console.error("Error response headers:", err.response.headers);
                    setError(`Request failed with status code ${err.response.status}. Please check your backend endpoint.`);
                } else if (err.request) {
                    console.error("Error request:", err.request);
                    setError("No response received from server. Server might be down or unreachable.");
                } else {
                    console.error("Axios config error:", err.message);
                    setError(`An error occurred: ${err.message}.`);
                }
            } else {
                setError(`An unexpected error occurred: ${err.message}.`);
            }
            // Add a more specific error message for CORS if detected (if you still see it)
            if (err.message && err.message.includes('CORS policy')) {
                setError(prev => `${prev} CORS error. Ensure your backend allows requests from ${window.location.origin}.`);
            }
            setVendors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedVendors = React.useMemo(() => {
        let sortableItems = [...vendors];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                } else if (sortConfig.key === 'joined') {
                    // Try to parse dates for sorting, fall back to string comparison if invalid
                    const dateA = new Date(a.createdAt); // Use original createdAt if available
                    const dateB = new Date(b.createdAt);
                    if (!isNaN(dateA) && !isNaN(dateB)) {
                        aValue = dateA.getTime();
                        bValue = dateB.getTime();
                    } else {
                        // Fallback to string comparison for invalid dates or if createdAt is missing
                        aValue = String(a.joined).toLowerCase();
                        bValue = String(b.joined).toLowerCase();
                    }
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    // Direct number comparison
                } else {
                    // Fallback for other types or mixed types to string comparison
                    aValue = String(aValue).toLowerCase();
                    bValue = String(bValue).toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [vendors, sortConfig]);

    const filteredVendors = sortedVendors.filter(vendor => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return (
            (vendor.name && vendor.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (vendor.owner && vendor.owner.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (vendor.email && vendor.email.toLowerCase().includes(lowerCaseSearchTerm))
        );
    });

    const indexOfLastVendor = currentPage * vendorsPerPage;
    const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
    const currentVendors = filteredVendors.slice(indexOfFirstVendor, indexOfLastVendor);
    const totalPages = Math.ceil(filteredVendors.length / vendorsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleViewVendor = (id) => {
        navigate(`/admin/vendors/${id}`);
    };

    const handleEditVendor = (id) => {
        navigate(`/admin/vendors/edit/${id}`);
    };

    const handleDeleteVendor = async (id, vendorName) => {
        if (window.confirm(`Are you sure you want to delete vendor "${vendorName}"?`)) {
            setLoading(true);
            setError(null);
            try {
                const adminToken = localStorage.getItem("adminToken");
                await axios.delete(`${API_URL}/api/admin/vendors/${id}`, {
                    headers: {
                        Authorization: `Bearer ${adminToken}`
                    }
                });
                fetchVendors();
            } catch (err) {
                console.error("Error deleting vendor:", err);
                if (axios.isAxiosError(err)) {
                    console.error("Error response data:", err.response?.data);
                    console.error("Error response status:", err.response?.status);
                    console.error("Error response headers:", err.response?.headers);
                }
                setError(err.response?.data?.message || err.message || "Failed to delete vendor.");
            } finally {
                setLoading(false);
            }
        }
    };

    const getStatusBadge = (status) => {
        let colorClass = "";
        let IconComponent = AlertCircle;

        switch (status?.toLowerCase()) {
            case 'active':
                colorClass = "bg-green-200 text-green-600";
                IconComponent = CheckCircle2;
                break;
            case 'inactive':
                colorClass = "bg-red-200 text-red-600";
                IconComponent = XCircle;
                break;
            case 'pending':
                colorClass = "bg-yellow-200 text-yellow-600";
                IconComponent = Clock;
                break;
            default:
                colorClass = "bg-gray-200 text-gray-600";
                IconComponent = AlertCircle;
                break;
        }
        return (
            <span className={`relative inline-block px-3 py-1 font-semibold text-sm rounded-full ${colorClass}`}>
                <span className="relative flex items-center gap-1 capitalize">
                    <IconComponent className="w-3 h-3 mr-1" />
                    {status || 'Unknown'}
                </span>
            </span>
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Store className="w-6 h-6 text-green-600" />
                            Vendor Management
                        </h1>
                        <p className="text-gray-600">Manage all vendors in your LocalCart platform</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/admin/vendors/new">
                            <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
                                <PlusCircle className="w-4 h-4" />
                                Add New Vendor
                            </button>
                        </Link>
                        <button onClick={fetchVendors} className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                placeholder="Search vendors by name, owner or email..."
                                className="pl-10 w-full rounded border-gray-300 focus:ring-green-500 focus:border-green-500"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Loading, Error, or Vendors Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative flex items-center gap-2" role="alert">
                        <AlertCircle className="w-5 h-5" />
                        <span className="block sm:inline"> {error}</span>
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                        No vendors found matching your criteria.
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr className="hover:bg-transparent">
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Image
                                    </th>
                                    <th
                                        className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                                        onClick={() => requestSort('name')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Name
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Owner</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                                    <th
                                        className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                                        onClick={() => requestSort('products')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Products
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                                        onClick={() => requestSort('rating')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Rating
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                                        onClick={() => requestSort('status')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Status
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                                        onClick={() => requestSort('joined')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Joined
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentVendors.map((vendor) => (
                                    <tr key={vendor._id}>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="block relative">
                                                        <img
                                                            alt={vendor.name}
                                                            src={vendor.image || `https://placehold.co/40x40/E0F2F1/059669?text=${vendor.name ? vendor.name.charAt(0) : 'V'}`}
                                                            className="mx-auto object-cover rounded-full h-9 w-9"
                                                            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/40x40/E0F2F1/059669?text=${vendor.name ? vendor.name.charAt(0) : 'V'}`; }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <Link to={`/admin/vendors/${vendor._id}`} className="text-green-600 hover:text-green-700 font-medium">
                                                {vendor.name}
                                            </Link>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{vendor.owner}</td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-600">{vendor.email}</p>
                                            <p className="text-gray-500 text-xs">{vendor.phone}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{vendor.products}</td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span>{vendor.rating}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            {getStatusBadge(vendor.status)}
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{vendor.joined}</td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                            <div className="relative inline-block text-left">
                                                <button
                                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded inline-flex items-center"
                                                    onClick={(e) => { e.stopPropagation(); /* Implement dropdown toggle here */ }}
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                <div className="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                                        <button onClick={() => handleViewVendor(vendor._id)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2" role="menuitem">
                                                            <Eye className="w-4 h-4" />
                                                            View
                                                        </button>
                                                        <button onClick={() => handleEditVendor(vendor._id)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2" role="menuitem">
                                                            <Edit className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button onClick={() => handleDeleteVendor(vendor._id, vendor.name)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:text-red-900 flex items-center gap-2" role="menuitem">
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {filteredVendors.length > vendorsPerPage && (
                    <div className="mt-6 flex w-full items-center justify-center">
                        <div className="inline-flex items-center justify-between gap-2 text-sm font-medium">
                            <button
                                onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-500 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                    key={pageNum}
                                    onClick={() => paginate(pageNum)}
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${pageNum === currentPage ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-500'} transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1`}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            <button
                                onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-500 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorsPage;
