import React, { useContext, useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "@headlessui/react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Edit,
  Lock,
  MapPin,
  ShoppingBag,
  Bell,
  X,
  ChevronRight,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  Heart,
  HelpCircle,
  CreditCard,
  Shield,
  LogOut,
  Loader2, // Added for loading spinner
} from "lucide-react";
import { AuthContext } from "../../Context/Context"; // Ensure this path is correct for your project
import { motion, AnimatePresence } from "framer-motion";

// Custom Confirmation Modal Component
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={isOpen}
          onClose={onCancel} // Allow closing on backdrop click or Escape key
          className="relative z-50"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Dialog Panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-xl bg-white shadow-xl"
            >
              <Dialog.Panel>
                {/* Header */}
                <div className="bg-red-500 p-4 text-white rounded-t-xl flex justify-between items-center">
                  <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
                  <button
                    onClick={onCancel}
                    className="p-1 rounded-full hover:bg-red-600 transition"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 text-gray-700">
                  <p>{message}</p>
                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    Confirm
                  </button>
                </div>
              </Dialog.Panel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};


const ProfilePage = () => {
  // Ensure AuthContext is properly providing user and setUser
  const { user, setUser, isLoggedIn, loadingAuth } = useContext(AuthContext);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingChanges, setSubmittingChanges] = useState(false);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  // const [isUploading, setIsUploading] = useState(false); // Not used currently
  const navigate = useNavigate();

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  const profileForm = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      bio: "",
    },
  });

  const addressForm = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      street: "",
      apartment: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // IMPORTANT: Ensure this VITE_API_URL is correctly set in your .env file
  // For example, in .env: VITE_API_URL=http://localhost:5000
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const makeAuthenticatedFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      // It's crucial to handle this by redirecting to login or showing an error
      toast.error("Authentication required. Please login.");
      navigate("/login"); // Redirect to login
      throw new Error("Authentication required. Please login.");
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    // If body is FormData, do NOT set Content-Type header explicitly
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // If response is not JSON, use the status text
          errorData = { message: response.statusText || "Unknown error" };
        }
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      // If the response is empty (e.g., DELETE requests), response.json() might fail.
      // Check for content-type or status
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      } else {
        // For non-JSON responses (e.g., successful DELETE with no content)
        return {};
      }

    } catch (error) {
      console.error("Authenticated fetch error:", error);
      throw error; // Re-throw to be caught by the calling function
    }
  }, [navigate]);

  const fetchUserProfile = useCallback(async () => {
    try {
      // makeAuthenticatedFetch already returns the parsed JSON
      const data = await makeAuthenticatedFetch(`${API_BASE_URL}/api/users/me`);
      // Make sure the data structure matches what you expect from your backend
      // Assuming data.data.user is where the user object resides
      if (data && data.data && data.data.user) {
        setUser(data.data.user);
        console.log("User profile fetched successfully:", data.data.user);
        return data.data.user;
      } else {
        console.warn("User data not found in response:", data);
        setUser(null); // Clear user if not found
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Do not unset user here, let isLoggedIn check handle it if auth fails
      throw error; // Re-throw to allow fetchAllData to catch and handle setLoading
    }
  }, [API_BASE_URL, makeAuthenticatedFetch, setUser]);

  const fetchUserOrders = useCallback(async () => {
    try {
      const data = await makeAuthenticatedFetch(`${API_BASE_URL}/api/orders`);
      // Ensure data.orders is an array
      if (data && Array.isArray(data.orders)) {
        setOrders(data.orders);
        return data.orders;
      } else {
        console.warn("Invalid response format for orders:", data);
        setOrders([]); // Set to empty array to avoid errors
        return [];
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error;
    }
  }, [API_BASE_URL, makeAuthenticatedFetch]);

  const fetchUserAddresses = useCallback(async () => {
    try {
      const data = await makeAuthenticatedFetch(`${API_BASE_URL}/api/users/me/addresses`);
      // Ensure data.data.addresses is an array
      if (data && data.data && Array.isArray(data.data.addresses)) {
        setAddresses(data.data.addresses);
        return data.data.addresses;
      } else {
        console.warn("Invalid response format for addresses:", data);
        setAddresses([]); // Set to empty array
        return [];
      }
    } catch (error) {
      console.error("Error fetching user addresses:", error);
      throw error;
    }
  }, [API_BASE_URL, makeAuthenticatedFetch]);

  const fetchAllData = useCallback(async () => {
    if (loadingAuth) { // Wait for initial auth check to complete
      return;
    }

    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await Promise.allSettled([ // Use Promise.allSettled to allow all promises to resolve/reject
        fetchUserProfile(),
        fetchUserOrders(),
        fetchUserAddresses(),
      ]).then((results) => {
        // You can inspect results[0].status, results[0].value/reason etc.
        // For example, if profile fetch fails, it might be due to expired token.
        // The makeAuthenticatedFetch already handles redirecting, but this can be for specific logging.
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Promise at index ${index} rejected:`, result.reason);
            // Specific handling if needed, e.g., for profile fetch failure
            if (index === 0 && result.reason.message === "Authentication required. Please login.") {
               // This case is already handled by makeAuthenticatedFetch redirecting
            }
          }
        });
      });
    } catch (error) {
      console.error("fetchAllData: Uncaught error during data fetching:", error);
      // This catch might not be hit if makeAuthenticatedFetch handles errors internally and redirects
    } finally {
      setLoading(false);
    }
  }, [
    isLoggedIn,
    loadingAuth, // Add loadingAuth to dependencies
    fetchUserProfile,
    fetchUserOrders,
    fetchUserAddresses,
  ]);

  useEffect(() => {
    // Only fetch data once auth state is determined
    if (!loadingAuth) {
      fetchAllData();
    }
  }, [loadingAuth, fetchAllData]); // Depend on loadingAuth

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewImage(user?.photo ? `${API_BASE_URL}/uploads/${user.photo}` : "https://via.placeholder.com/150");
      return;
    }

    // Validate file type
    if (!file.type.match("image/(jpeg|png)")) {
      toast.error("Please select a JPEG or PNG image file.");
      setSelectedFile(null);
      setPreviewImage(user?.photo ? `${API_BASE_URL}/uploads/${user.photo}` : "https://via.placeholder.com/150");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB.");
      setSelectedFile(null);
      setPreviewImage(user?.photo ? `${API_BASE_URL}/uploads/${user.photo}` : "https://via.placeholder.com/150");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmitProfile = async (data) => {
    setSubmittingChanges(true);
    try {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      // Email should generally not be editable via this route if it's a primary identifier
      // If your backend allows, uncomment: if (data.email) formData.append("email", data.email);
      if (data.bio) formData.append("bio", data.bio);
      if (selectedFile) {
        formData.append("photo", selectedFile);
      }

      const responseData = await makeAuthenticatedFetch(
        `${API_BASE_URL}/api/users/updateMe`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      // Assuming responseData.data.user is the updated user object
      if (responseData && responseData.data && responseData.data.user) {
        setUser(responseData.data.user);
        toast.success("Profile updated successfully!");
        setIsEditModalOpen(false);
        setSelectedFile(null);
        setPreviewImage(responseData.data.user.photo ? `${API_BASE_URL}/uploads/${responseData.data.user.photo}` : "https://via.placeholder.com/150");
      } else {
        toast.error("Profile update response missing user data.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setSubmittingChanges(false);
    }
  };

  const onSubmitAddress = async (data) => {
    setSubmittingChanges(true);
    try {
      const addressData = {
        name: data.name,
        street: data.street,
        apartment: data.apartment,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      };

      const endpoint = editingAddress
        ? `${API_BASE_URL}/api/users/me/addresses/${editingAddress._id}`
        : `${API_BASE_URL}/api/users/me/addresses`;

      await makeAuthenticatedFetch(endpoint, {
        method: editingAddress ? "PATCH" : "POST",
        body: JSON.stringify(addressData),
      });

      toast.success(
        `Address ${editingAddress ? "updated" : "added"} successfully!`
      );
      await fetchUserAddresses(); // Re-fetch addresses to update the list
      setIsAddressModalOpen(false);
      setEditingAddress(null);
      addressForm.reset();
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(error.message || "Failed to save address.");
    } finally {
      setSubmittingChanges(false);
    }
  };

  const handleDeleteAddressInitiate = (addressId) => {
    setAddressToDelete(addressId);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteAddressConfirm = async () => {
    setIsConfirmModalOpen(false); // Close modal
    if (!addressToDelete) return;

    try {
      await makeAuthenticatedFetch(
        `${API_BASE_URL}/api/users/me/addresses/${addressToDelete}`,
        {
          method: "DELETE",
        }
      );
      toast.info("Address deleted successfully!");
      fetchUserAddresses(); // Re-fetch addresses to update the list
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error(error.message || "Failed to delete address.");
    } finally {
      setAddressToDelete(null);
    }
  };

  const handleDeleteAddressCancel = () => {
    setIsConfirmModalOpen(false);
    setAddressToDelete(null);
  };


  useEffect(() => {
    if (isEditModalOpen && user) {
      profileForm.reset({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
      });
      // Set initial preview image, consider backend path
      setPreviewImage(user.photo ? `${API_BASE_URL}/uploads/${user.photo}` : "https://via.placeholder.com/150");
      setSelectedFile(null); // Clear selected file when opening modal
    }
  }, [isEditModalOpen, user, profileForm, API_BASE_URL]);

  useEffect(() => {
    if (isAddressModalOpen) {
      addressForm.reset(
        editingAddress || {
          name: "",
          street: "",
          apartment: "",
          city: "",
          state: "",
          zipCode: "",
        }
      );
    }
  }, [isAddressModalOpen, editingAddress, addressForm]);

  useEffect(() => {
    // Prevent navigation during modal interactions (optional, for data loss prevention)
    const handleBeforeUnload = (event) => {
      if (isEditModalOpen || isAddressModalOpen || submittingChanges) {
        event.preventDefault();
        event.returnValue = ""; // For Chrome compatibility
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isEditModalOpen, isAddressModalOpen, submittingChanges]);


  if (loading || loadingAuth) { // Check both loading states
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="mb-6"
        >
          <div className="w-16 h-16 border-t-4 border-b-4 border-green-500 rounded-full" />
        </motion.div>
        <h2 className="text-xl font-medium text-gray-700">Loading your profile</h2>
        <p className="text-gray-500 mt-2">Just a moment please...</p>
      </div>
    );
  }

  // Display access denied if not logged in after auth check completes
  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md bg-white p-8 rounded-xl shadow-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your profile.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-inter"> {/* Applied Inter font */}
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Profile</h1>
              <p className="text-green-100 max-w-2xl">
                Manage your account details, orders, and preferences
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
              <span className="text-sm bg-green-400 px-3 py-1 rounded-full">
                Member since {new Date(user.createdAt).getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100"
        >
          <div className="relative h-40 bg-gradient-to-r from-green-400 to-green-500">
            <div className="absolute -bottom-16 left-6">
              <div className="relative group">
                <img
                  src={
                    previewImage || // Use previewImage if a new file is selected
                    (user?.photo
                      ? `${API_BASE_URL}/uploads/${user.photo}` // Ensure this matches your backend path
                      : "https://placehold.co/150x150/e0e0e0/ffffff?text=User") // Placeholder with text
                  }
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => {
                    // Fallback if the image fails to load
                    e.target.onerror = null; // Prevents infinite loop
                    e.target.src = "https://placehold.co/150x150/e0e0e0/ffffff?text=Error";
                  }}
                />
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute bottom-2 right-2 bg-green-600 p-2 rounded-full text-white hover:bg-green-700 transition-all shadow-md opacity-0 group-hover:opacity-100"
                  aria-label="Edit Profile"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-20 px-6 pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {user?.name || "User"}
                </h2>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Mail size={16} className="text-green-500" />
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition"
              >
                <Edit size={14} /> Edit Profile
              </button>
            </div>

            {user?.bio && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-gray-700 italic">"{user.bio}"</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Orders & Addresses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Orders Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                  <ShoppingBag className="text-green-500" />
                  Recent Orders
                </h2>
                {orders.length > 0 && (
                  <Link
                    to="/orders"
                    className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                  >
                    View All <ChevronRight size={16} />
                  </Link>
                )}
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <motion.div
                      whileHover={{ y: -2 }}
                      key={order._id}
                      className="group"
                    >
                      <Link
                        to={`/orders/${order._id}`}
                        className="block p-5 rounded-lg border border-gray-200 hover:border-green-300 bg-white hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">
                                #{order.orderNumber}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  order.status === "Delivered"
                                    ? "bg-green-100 text-green-700"
                                    : order.status === "Pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{order.totalAmount?.toFixed(2)}
                            </span>
                            <ChevronRight
                              size={20}
                              className="text-gray-400 group-hover:text-green-600 transition-colors"
                            />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag
                    size={40}
                    className="mx-auto text-gray-300 mb-3"
                  />
                  <p className="text-gray-500 mb-4">
                    You haven't placed any orders yet
                  </p>
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Addresses Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                  <MapPin className="text-green-500" />
                  Saved Addresses
                </h2>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setIsAddressModalOpen(true);
                  }}
                  className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={16} /> Add New
                </button>
              </div>

              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <motion.div
                      whileHover={{ y: -2 }}
                      key={address._id}
                      className="relative"
                    >
                      <div className="p-4 rounded-lg border border-gray-200 bg-white hover:border-green-300 transition h-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-gray-800">
                              {address.name}
                            </h3>
                            <p className="text-gray-600 mt-1 text-sm">
                              {address.street}
                              {address.apartment && `, ${address.apartment}`},{" "}
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddress(address);
                                setIsAddressModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddressInitiate(address._id);
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">
                    You don't have any saved addresses yet
                  </p>
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Address
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Account Settings */}
          <div className="space-y-6">
            {/* Account Settings Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                <Shield className="text-green-500" />
                Account Security
              </h2>
              <div className="space-y-3">
                <button className="w-full text-left flex justify-between items-center p-3 hover:bg-green-50 rounded-lg transition text-gray-700 group">
                  <span className="flex items-center gap-2">
                    <Lock size={16} className="text-green-500" />
                    Change Password
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover:text-green-600"
                  />
                </button>
                <Link
                  to="/wishlist"
                  className="block w-full text-left flex justify-between items-center p-3 hover:bg-green-50 rounded-lg transition text-gray-700 group"
                >
                  <span className="flex items-center gap-2">
                    <Heart size={16} className="text-green-500" />
                    Wishlist
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover:text-green-600"
                  />
                </Link>
                <Link
                  to="/payment-methods"
                  className="block w-full text-left flex justify-between items-center p-3 hover:bg-green-50 rounded-lg transition text-gray-700 group"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard size={16} className="text-green-500" />
                    Payment Methods
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover:text-green-600"
                  />
                </Link>
              </div>
            </motion.div>

            {/* Support Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                <HelpCircle className="text-green-500" />
                Help & Support
              </h2>
              <div className="space-y-3">
                <Link
                  to="/contact"
                  className="block p-3 hover:bg-green-50 rounded-lg transition text-gray-700 border border-gray-100 hover:border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <HelpCircle size={16} className="text-green-600" />
                    </div>
                    <span className="font-medium">Contact Support</span>
                  </div>
                </Link>
                <Link
                  to="/faq"
                  className="block p-3 hover:bg-green-50 rounded-lg transition text-gray-700 border border-gray-100 hover:border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <HelpCircle size={16} className="text-green-600" />
                    </div>
                    <span className="font-medium">FAQs</span>
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Logout Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  setUser(null); // Clear user in context
                  toast.info("You have been logged out");
                  navigate("/login");
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition text-red-600 font-medium"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="relative z-50"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
          >
            <Dialog.Panel>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <Dialog.Title className="text-xl font-bold">
                    Edit Profile
                  </Dialog.Title>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-white hover:text-green-200 p-1 transition"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form
                onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                className="p-6 space-y-5"
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-4 group">
                    <img
                      src={
                        previewImage ||
                        (user?.photo
                          ? `${API_BASE_URL}/uploads/${user.photo}`
                          : "https://placehold.co/96x96/e0e0e0/ffffff?text=User")
                      }
                      alt="Profile Preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/96x96/e0e0e0/ffffff?text=Error";
                      }}
                    />
                    <label
                      htmlFor="profile-upload"
                      className="absolute bottom-0 right-0 bg-green-500 p-2 rounded-full text-white hover:bg-green-600 transition shadow-md cursor-pointer opacity-0 group-hover:opacity-100"
                      aria-label="Upload new profile picture"
                    >
                      <Upload size={16} />
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </p>
                  )}
                  <p className="text-xs text-gray-500 text-center">
                    JPG, PNG (max 5MB)
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="profile-name" className="block text-sm font-medium mb-1 text-gray-700">
                      Full Name
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      {...profileForm.register("name", {
                        required: "Name is required",
                      })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                        profileForm.formState.errors.name
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-green-500 border-gray-300"
                      }`}
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-red-500 text-xs mt-1">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="profile-email" className="block text-sm font-medium mb-1 text-gray-700">
                      Email Address
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      {...profileForm.register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                      disabled // Email usually cannot be changed directly via profile edit
                      className={`w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed ${
                        profileForm.formState.errors.email
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {profileForm.formState.errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="profile-bio" className="block text-sm font-medium mb-1 text-gray-700">
                      Bio (Optional)
                    </label>
                    <textarea
                      id="profile-bio"
                      {...profileForm.register("bio")}
                      rows="3"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                        profileForm.formState.errors.bio
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-green-500 border-gray-300"
                      }`}
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submittingChanges || !profileForm.formState.isValid}
                  >
                    {submittingChanges ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} /> Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </motion.div>
        </div>
      </Dialog>


      {/* Address Modal */}
      <Dialog
        open={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        className="relative z-50"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
          >
            <Dialog.Panel>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <Dialog.Title className="text-xl font-bold">
                    {editingAddress ? "Edit Address" : "Add New Address"}
                  </Dialog.Title>
                  <button
                    onClick={() => setIsAddressModalOpen(false)}
                    className="text-white hover:text-green-200 p-1 transition"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form
                onSubmit={addressForm.handleSubmit(onSubmitAddress)}
                className="p-6 space-y-4"
              >
                <div>
                  <label htmlFor="address-name" className="block text-sm font-medium mb-1 text-gray-700">
                    Address Name (e.g., Home, Work)
                  </label>
                  <input
                    id="address-name"
                    type="text"
                    {...addressForm.register("name", {
                      required: "Address name is required",
                    })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                      addressForm.formState.errors.name
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-green-500 border-gray-300"
                    }`}
                  />
                  {addressForm.formState.errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {addressForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="address-street" className="block text-sm font-medium mb-1 text-gray-700">
                    Street Address
                  </label>
                  <input
                    id="address-street"
                    type="text"
                    {...addressForm.register("street", {
                      required: "Street address is required",
                    })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                      addressForm.formState.errors.street
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-green-500 border-gray-300"
                    }`}
                  />
                  {addressForm.formState.errors.street && (
                    <p className="text-red-500 text-xs mt-1">
                      {addressForm.formState.errors.street.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="address-apartment" className="block text-sm font-medium mb-1 text-gray-700">
                    Apartment, Suite, etc. (Optional)
                  </label>
                  <input
                    id="address-apartment"
                    type="text"
                    {...addressForm.register("apartment")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="address-city" className="block text-sm font-medium mb-1 text-gray-700">
                      City
                    </label>
                    <input
                      id="address-city"
                      type="text"
                      {...addressForm.register("city", {
                        required: "City is required",
                      })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                        addressForm.formState.errors.city
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-green-500 border-gray-300"
                      }`}
                    />
                    {addressForm.formState.errors.city && (
                      <p className="text-red-500 text-xs mt-1">
                        {addressForm.formState.errors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="address-state" className="block text-sm font-medium mb-1 text-gray-700">
                      State
                    </label>
                    <input
                      id="address-state"
                      type="text"
                      {...addressForm.register("state", {
                        required: "State is required",
                      })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                        addressForm.formState.errors.state
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-green-500 border-gray-300"
                      }`}
                    />
                    {addressForm.formState.errors.state && (
                      <p className="text-red-500 text-xs mt-1">
                        {addressForm.formState.errors.state.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="address-zip" className="block text-sm font-medium mb-1 text-gray-700">
                    ZIP Code
                  </label>
                  <input
                    id="address-zip"
                    type="text"
                    {...addressForm.register("zipCode", {
                      required: "ZIP Code is required",
                      pattern: {
                        value: /^\d{5}(-\d{4})?$/, // Basic ZIP code pattern
                        message: "Invalid ZIP Code",
                      },
                    })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                      addressForm.formState.errors.zipCode
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-green-500 border-gray-300"
                    }`}
                  />
                  {addressForm.formState.errors.zipCode && (
                    <p className="text-red-500 text-xs mt-1">
                      {addressForm.formState.errors.zipCode.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submittingChanges || !addressForm.formState.isValid}
                  >
                    {submittingChanges ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} /> Saving...
                      </>
                    ) : (
                      editingAddress ? "Save Changes" : "Add Address"
                    )}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </motion.div>
        </div>
      </Dialog>

      {/* Confirmation Modal for Address Deletion */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this address? This action cannot be undone."
        onConfirm={handleDeleteAddressConfirm}
        onCancel={handleDeleteAddressCancel}
      />
    </div>
  );
};

export default ProfilePage;
