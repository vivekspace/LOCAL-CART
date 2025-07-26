import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/Context";
import axios from "axios";
import {
  Search,
  PlusCircle,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Star,
  Store,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Package,
  Mail,
  Phone,
  Calendar,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AdminVendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [expandedVendorId, setExpandedVendorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { authAxios, isAdmin, isAuthLoading } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchVendors = useCallback(async () => {
    if (isAuthLoading || !isAdmin) {
      if (!isAuthLoading && !isAdmin) {
        setError("Admin not authenticated or authorized. Please login.");
        navigate("/admin/login");
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authAxios.get(`${API_URL}/api/admin/vendors`);
      console.log(response);

      let apiVendors = [];
      if (response.data && Array.isArray(response.data)) {
        apiVendors = response.data;
      } else if (response.data && Array.isArray(response.data.vendors)) {
        apiVendors = response.data.vendors;
      } else {
        console.warn("API response structure unexpected:", response.data);
        setError(
          "Unexpected data structure from API. Expected an array of vendors."
        );
        setVendors([]);
        return;
      }

      const transformedVendors = apiVendors.map((vendor) => ({
        ...vendor,
        owner: vendor.name || "N/A",
        products: Array.isArray(vendor.products)
          ? vendor.products.length
          : "N/A",
        rating: vendor.rating !== undefined ? vendor.rating.toFixed(1) : "N/A",
        status: vendor.status || "Unknown",
        joined: vendor.createdAt
          ? new Date(vendor.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "Invalid Date",
        image:
          vendor.image ||
          `https://placehold.co/40x40/E0F2F1/059669?text=${
            vendor.name ? vendor.name.charAt(0) : "V"
          }`,
      }));
      setVendors(transformedVendors);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      if (axios.isAxiosError(err)) {
        if (err.response) {
          console.error("Error response data:", err.response.data);
          console.error("Error response status:", err.response.status);
          console.error("Error response headers:", err.response.headers);
          setError(
            `Request failed with status code ${err.response.status}. Please check your backend endpoint or authentication.`
          );
        } else if (err.request) {
          console.error("Error request:", err.request);
          setError(
            "No response received from server. Server might be down or unreachable."
          );
        } else {
          console.error("Axios config error:", err.message);
          setError(`An error occurred: ${err.message}.`);
        }
      } else {
        setError(`An unexpected error occurred: ${err.message}.`);
      }
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthLoading, isAdmin, authAxios, API_URL, navigate]);

  useEffect(() => {
    if (isAdmin !== undefined) {
      fetchVendors();
    }
  }, [isAdmin, fetchVendors]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toggleExpandVendor = (vendorId) => {
    setExpandedVendorId(expandedVendorId === vendorId ? null : vendorId);
  };

  const handleViewVendor = (id) => {
    navigate(`/admin/vendors/${id}`);
  };

  const handleEditVendor = (id) => {
    navigate(`/admin/vendors/edit/${id}`);
  };

  const handleDeleteVendor = async (id, vendorName) => {
    if (
      window.confirm(`Are you sure you want to delete vendor "${vendorName}"?`)
    ) {
      setLoading(true);
      setError(null);
      try {
        await authAxios.delete(`${API_URL}/api/admin/vendors/${id}`);
        fetchVendors();
      } catch (err) {
        console.error("Error deleting vendor:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to delete vendor."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredAndSortedVendors = React.useMemo(() => {
    let filteredVendors = [...vendors];

    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filteredVendors = filteredVendors.filter(
        (vendor) =>
          (vendor.name &&
            vendor.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (vendor.owner &&
            vendor.owner.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (vendor.email &&
            vendor.email.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filteredVendors = filteredVendors.filter(
        (vendor) => vendor.status?.toLowerCase() === statusFilter
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredVendors.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        } else if (sortConfig.key === "joined") {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          if (!isNaN(dateA) && !isNaN(dateB)) {
            aValue = dateA.getTime();
            bValue = dateB.getTime();
          } else {
            aValue = String(a.joined).toLowerCase();
            bValue = String(b.joined).toLowerCase();
          }
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          // Direct number comparison
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredVendors;
  }, [vendors, searchTerm, statusFilter, sortConfig]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <CheckCircle2 className="w-3 h-3" />;
      case "inactive":
        return <XCircle className="w-3 h-3" />;
      case "pending":
        return <Clock className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  if (loading || isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading vendors data</p>
          <p className="text-sm text-gray-500 mt-1">LocalCart is crunching the numbers</p>
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
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Vendors</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            {!isAdmin && !isAuthLoading ? (
              <button
                onClick={() => navigate("/admin/login")}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg shadow-md hover:from-indigo-700 hover:to-indigo-600 transition-all"
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
              <Store className="mr-3 text-indigo-600" />
              Vendor Management
            </h1>
            <p className="text-gray-600 mt-1">Manage all vendors in your LocalCart platform</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/vendors/new">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all">
                <PlusCircle className="w-4 h-4" />
                Add New Vendor
              </button>
            </Link>
            <button
              onClick={fetchVendors}
              className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-md flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search vendors by name, owner or email..."
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Vendors List */}
      {filteredAndSortedVendors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <Store className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No vendors found</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "There are currently no vendors in the system."}
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedVendors.map((vendor) => (
            <div key={vendor._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Vendor Summary */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors grid grid-cols-2 md:grid-cols-5 gap-4 items-center"
                onClick={() => toggleExpandVendor(vendor._id)}
              >
                <div className="col-span-2 md:col-span-1 flex items-center">
                  <img
                    alt={vendor.name}
                    src={vendor.image}
                    className="w-10 h-10 rounded-full object-cover mr-3 bg-indigo-100"
                    onError={(e) => {
                      e.target.onerror = null;
                        e.target.src = `https://placehold.co/40x40/EEF2FF/6366F1?text=${
                        vendor.name ? vendor.name.charAt(0) : "V"
                        }`;
                        e.target.style.backgroundColor = "#EEF2FF"; 
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{vendor.name}</p>
                    <p className="text-xs text-gray-500">ID: {vendor._id.substring(0, 8)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 truncate">{vendor.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Products</p>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{vendor.products}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-gray-900">{vendor.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      vendor.status
                    )}`}
                  >
                    {getStatusIcon(vendor.status)}
                    {vendor.status || "Unknown"}
                  </span>
                  {expandedVendorId === vendor._id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 ml-2" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 ml-2" />
                  )}
                </div>
              </div>

              {/* Expanded Vendor Details */}
              <AnimatePresence>
                {expandedVendorId === vendor._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-200 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Contact Information */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-indigo-600" />
                            Contact Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">Email:</span>
                              <span className="text-gray-900">{vendor.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">Phone:</span>
                              <span className="text-gray-900">{vendor.phone || "N/A"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Business Details */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Store className="w-4 h-4 text-indigo-600" />
                            Business Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">Owner:</span>
                              <span className="text-gray-900">{vendor.owner}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">Joined:</span>
                              <span className="text-gray-900">{vendor.joined}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Actions</h4>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewVendor(vendor._id);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditVendor(vendor._id);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVendor(vendor._id, vendor.name);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
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
};

export default AdminVendorsPage;