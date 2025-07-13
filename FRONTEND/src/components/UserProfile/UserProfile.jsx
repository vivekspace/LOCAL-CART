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
  // Destructure user, jwtToken, isAuthLoading, isLoggedIn, and setAuth directly
  const { user, jwtToken, isAuthLoading, isLoggedIn, setAuth } = useContext(AuthContext);
  console.log("the user in ProfilePage:", user); // Now directly logging the user object

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingChanges, setSubmittingChanges] = useState(false);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
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
    // Use jwtToken from localStorage directly, consistent with AuthProvider
    const token = localStorage.getItem("jwtToken"); 
    if (!token) {
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
          errorData = { message: response.statusText || "Unknown error" };
        }
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      } else {
        return {};
      }

    } catch (error) {
      console.error("Authenticated fetch error:", error);
      throw error;
    }
  }, [navigate]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const data = await makeAuthenticatedFetch(`${API_BASE_URL}/api/users/me`);

      if (data && data.data && data.data.user) {
        // Correctly update the 'user' property within the 'auth' state
        setAuth(prev => ({
          ...prev,
          user: data.data.user
        }));
        console.log("User profile fetched successfully:", data.data.user);
        return data.data.user;
      } else {
        console.warn("User data not found in response:", data);
        // If user data is not found, clear the user and jwtToken from state
        setAuth(prev => ({ ...prev, user: null, jwtToken: null }));
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }, [API_BASE_URL, makeAuthenticatedFetch, setAuth]);

  const fetchUserOrders = useCallback(async () => {
    try {
      const data = await makeAuthenticatedFetch(`${API_BASE_URL}/api/orders`);
      if (data && Array.isArray(data.orders)) {
        setOrders(data.orders);
        return data.orders;
      } else {
        console.warn("Invalid response format for orders:", data);
        setOrders([]);
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
      if (data && data.data && Array.isArray(data.data.addresses)) {
        setAddresses(data.data.addresses);
        return data.data.addresses;
      } else {
        console.warn("Invalid response format for addresses:", data);
        setAddresses([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching user addresses:", error);
      throw error;
    }
  }, [API_BASE_URL, makeAuthenticatedFetch]);

  const fetchAllData = useCallback(async () => {
    // Wait for initial auth check to complete
    if (isAuthLoading) { 
      return;
    }

    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await Promise.allSettled([
        fetchUserProfile(),
        fetchUserOrders(),
        fetchUserAddresses(),
      ]).then((results) => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Promise at index ${index} rejected:`, result.reason);
            if (index === 0 && result.reason.message === "Authentication required. Please login.") {
               // This case is already handled by makeAuthenticatedFetch redirecting
            }
          }
        });
      });
    } catch (error) {
      console.error("fetchAllData: Uncaught error during data fetching:", error);
    } finally {
      setLoading(false);
    }
  }, [
    isLoggedIn,
    isAuthLoading, // Use isAuthLoading here
    fetchUserProfile,
    fetchUserOrders,
    fetchUserAddresses,
  ]);

  useEffect(() => {
    // Only fetch data once auth state is determined
    if (!isAuthLoading) { // Use isAuthLoading here
      fetchAllData();
    }
  }, [isAuthLoading, fetchAllData]); // Depend on isAuthLoading

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
        // Correctly update the 'user' property within the 'auth' state
        setAuth(prev => ({
          ...prev,
          user: responseData.data.user
        }));
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
        method: editingAddress ? "PUT" : "POST",
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


  if (loading || isAuthLoading) { // Check both loading states
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 h-40 flex items-center justify-center p-6">
          <div className="relative w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-md">
            <img
              src={user.photo ? `${API_BASE_URL}/uploads/${user.photo}` : "https://via.placeholder.com/150"}
              alt="User Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={() => {
              setIsEditModalOpen(true);
              profileForm.reset({
                name: user.name || "",
                email: user.email || "",
                bio: user.bio || "",
              });
              setPreviewImage(user.photo ? `${API_BASE_URL}/uploads/${user.photo}` : "https://via.placeholder.com/150");
              setSelectedFile(null);
            }}
            className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md text-gray-700 hover:bg-gray-100 transition"
            aria-label="Edit Profile"
          >
            <Edit size={20} />
          </button>
        </div>

        <div className="p-6">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">{user.name}</h1>
          <p className="text-center text-gray-600 mb-6">{user.email}</p>

          {user.bio && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                <User size={20} className="mr-2 text-blue-600" /> Bio
              </h3>
              <p className="text-gray-700">{user.bio}</p>
            </div>
          )}

          {/* Profile Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* My Orders */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <ShoppingBag size={24} className="mr-3 text-purple-600" /> My Orders
              </h3>
              {orders.length > 0 ? (
                <ul className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <li key={order._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                      <span className="text-gray-700 font-medium">Order #{order._id.slice(-6)}</span>
                      <span className="text-green-600 font-bold">${order.totalAmount.toFixed(2)}</span>
                    </li>
                  ))}
                  {orders.length > 3 && (
                    <li className="text-center pt-2">
                      <Link to="/orders" className="text-blue-600 hover:underline flex items-center justify-center">
                        View All Orders <ChevronRight size={16} className="ml-1" />
                      </Link>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-gray-500">No orders placed yet.</p>
              )}
            </div>

            {/* My Addresses */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <MapPin size={24} className="mr-3 text-red-600" /> My Addresses
                </span>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setIsAddressModalOpen(true);
                  }}
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition shadow-md"
                  aria-label="Add New Address"
                >
                  <Plus size={20} />
                </button>
              </h3>
              {addresses.length > 0 ? (
                <ul className="space-y-4">
                  {addresses.map((address) => (
                    <li key={address._id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-800">{address.name}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingAddress(address);
                              setIsAddressModalOpen(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 transition"
                            aria-label={`Edit address ${address.name}`}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteAddressInitiate(address._id)}
                            className="text-red-500 hover:text-red-700 transition"
                            aria-label={`Delete address ${address.name}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {address.street}
                        {address.apartment && `, ${address.apartment}`}, {address.city}, {address.state} - {address.zipCode}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No addresses added yet.</p>
              )}
            </div>
          </div>

          {/* Other Sections (Optional) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <Heart size={24} className="mr-3 text-pink-600" /> Wishlist
              </h3>
              <Link to="/wishlist" className="text-blue-600 hover:underline flex items-center">
                View Wishlist <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <Bell size={24} className="mr-3 text-orange-600" /> Notifications
              </h3>
              <Link to="/notifications" className="text-blue-600 hover:underline flex items-center">
                Manage Notifications <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <Shield size={24} className="mr-3 text-green-600" /> Security
              </h3>
              <Link to="/change-password" className="text-blue-600 hover:underline flex items-center">
                Change Password <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <HelpCircle size={24} className="mr-3 text-yellow-600" /> Help & Support
              </h3>
              <Link to="/help" className="text-blue-600 hover:underline flex items-center">
                Get Help <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                // Assuming logout is available directly from AuthContext
                // You might need to import logout from useAuth if it's not in the context directly
                // For now, I'll assume it's part of the context value.
                // If you have a `logout` function directly in AuthContext, use it.
                // If not, you might need to add it to the context value.
                // For now, I'll add a placeholder for logout.
                // You should replace this with the actual logout function from your AuthContext.
                // Example: const { logout } = useContext(AuthContext);
                // For now, I'll just clear local storage and navigate.
                localStorage.removeItem("jwtToken");
                localStorage.removeItem("currentUser");
                toast.info("Logged out successfully!");
                navigate("/login");
              }}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <LogOut size={20} className="mr-2" /> Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
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
                className="w-full max-w-md rounded-xl bg-white shadow-xl"
              >
                <Dialog.Panel>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white rounded-t-xl flex justify-between items-center">
                    <Dialog.Title className="text-lg font-bold">Edit Profile</Dialog.Title>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="p-1 rounded-full hover:bg-blue-700 transition"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="p-6">
                    <div className="mb-4 text-center">
                      <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-gray-200 mb-2">
                        <img
                          src={previewImage || "https://via.placeholder.com/150"}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white cursor-pointer opacity-0 hover:opacity-100 transition-opacity rounded-full"
                        >
                          <Upload size={24} />
                        </label>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/jpeg, image/png"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                      <p className="text-sm text-gray-500">Click to change photo (JPEG/PNG, max 5MB)</p>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        id="name"
                        {...profileForm.register("name", { required: "Name is required" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        {...profileForm.register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                            message: "Invalid email address",
                          },
                        })}
                        disabled // Email usually not editable
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="mb-6">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        id="bio"
                        {...profileForm.register("bio")}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingChanges}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                      >
                        {submittingChanges ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Save Changes
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </motion.div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Add/Edit Address Modal */}
      <AnimatePresence>
        {isAddressModalOpen && (
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
                className="w-full max-w-md rounded-xl bg-white shadow-xl"
              >
                <Dialog.Panel>
                  <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4 text-white rounded-t-xl flex justify-between items-center">
                    <Dialog.Title className="text-lg font-bold">
                      {editingAddress ? "Edit Address" : "Add New Address"}
                    </Dialog.Title>
                    <button
                      onClick={() => setIsAddressModalOpen(false)}
                      className="p-1 rounded-full hover:bg-green-700 transition"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="p-6">
                    <div className="mb-4">
                      <label htmlFor="address-name" className="block text-sm font-medium text-gray-700 mb-1">Address Name (e.g., Home, Work)</label>
                      <input
                        type="text"
                        id="address-name"
                        {...addressForm.register("name", { required: "Address name is required" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      />
                      {addressForm.formState.errors.name && (
                        <p className="text-red-500 text-xs mt-1">{addressForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        id="street"
                        {...addressForm.register("street", { required: "Street address is required" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      />
                      {addressForm.formState.errors.street && (
                        <p className="text-red-500 text-xs mt-1">{addressForm.formState.errors.street.message}</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-1">Apartment, Suite, etc. (Optional)</label>
                      <input
                        type="text"
                        id="apartment"
                        {...addressForm.register("apartment")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          id="city"
                          {...addressForm.register("city", { required: "City is required" })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        />
                        {addressForm.formState.errors.city && (
                          <p className="text-red-500 text-xs mt-1">{addressForm.formState.errors.city.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          id="state"
                          {...addressForm.register("state", { required: "State is required" })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        />
                        {addressForm.formState.errors.state && (
                          <p className="text-red-500 text-xs mt-1">{addressForm.formState.errors.state.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                        <input
                          type="text"
                          id="zipCode"
                          {...addressForm.register("zipCode", { required: "Zip Code is required" })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        />
                        {addressForm.formState.errors.zipCode && (
                          <p className="text-red-500 text-xs mt-1">{addressForm.formState.errors.zipCode.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsAddressModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingChanges}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                      >
                        {submittingChanges ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Save Address
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </motion.div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
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
