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
  Loader2,
} from "lucide-react";
import { AuthContext } from "../../Context/Context";
import { motion, AnimatePresence } from "framer-motion";

// Custom Confirmation Modal Component
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={isOpen}
          onClose={onCancel}
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
              className="w-full max-w-sm rounded-xl bg-white shadow-xl overflow-hidden"
            >
              <Dialog.Panel>
                {/* Header */}
                <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-4 text-white flex justify-between items-center">
                  <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
                  <button
                    onClick={onCancel}
                    className="p-1 rounded-full hover:bg-black/10 transition"
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
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition hover:shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:opacity-90 transition shadow-md"
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
  const { user, jwtToken, isAuthLoading, isLoggedIn, setAuth , logout } = useContext(AuthContext);
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
  console.log(user.photo)

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

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const makeAuthenticatedFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem("jwtToken"); 
    if (!token) {
      toast.error("Authentication required. Please login.");
      navigate("/login");
      throw new Error("Authentication required. Please login.");
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

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
        const data = await makeAuthenticatedFetch(`${API_BASE_URL}/api/orders/my-orders`);
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
        setPreviewImage(user?.photo ? user.photo : "https://via.placeholder.com/150");
        return;
      }

      // Validate file type
      if (!file.type.match("image/(jpeg|png)")) {
        toast.error("Please select a JPEG or PNG image file.");
        setSelectedFile(null);
        setPreviewImage(user?.photo ? user.photo : "https://via.placeholder.com/150");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB.");
        setSelectedFile(null);
        setPreviewImage(user?.photo ? user.photo : "https://via.placeholder.com/150");
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
          setPreviewImage(responseData.data.user.photo ? responseData.data.user.photo : "https://via.placeholder.com/150");
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
        setPreviewImage(user.photo ? user.photo : "https://via.placeholder.com/150");
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



  if (loading || isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen  bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5, 
            ease: "easeInOut"
          }}
          className="mb-6"
        >
          <div className="w-16 h-16 border-t-4 border-b-4 border-emerald-500 rounded-full" />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-medium text-gray-700"
        >
          Loading your profile
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-500 mt-2"
        >
          Just a moment please...
        </motion.p>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center"
        >
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <X className="w-10 h-10 text-red-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your profile.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:opacity-90 transition shadow-md"
            >
              Log In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/register")}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              Sign Up
            </motion.button>
          </div>
        </motion.div>
      </div>
    ); 
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8 font-inter">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl  mx-auto"
      >
        {/* Profile Header */}
        <div className="relative bg-gradient-to-r from-green-500 to-green-400 h-48 rounded-t-2xl flex items-center justify-center p-6 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-t-2xl" />
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="relative w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-xl"
          >
            <img
              src={user.photo ? user.photo.url : "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"}
              alt="User Profile"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => {
                setIsEditModalOpen(true);
                profileForm.reset({
                  name: user.name || "",
                  email: user.email || "",
                  bio: user.bio || "",
                });
                setPreviewImage(user.photo ? user.photo.url : "https://via.placeholder.com/150");
                setSelectedFile(null);
              }}
              className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md text-gray-700 hover:bg-gray-100 transition hover:shadow-lg"
              aria-label="Edit Profile"
            >
              <Edit size={18} />
            </button>
          </motion.div>
        </div>

        {/* Profile Content */}
        <div className="bg-white rounded-b-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <motion.h1 
                className="text-3xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {user.name}
              </motion.h1>
              <motion.p 
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {user.email}
              </motion.p>
              
              {user.bio && (
                <motion.div 
                  className="bg-indigo-50 p-4 rounded-xl mb-8 shadow-inner max-w-2xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-lg font-semibold text-green-600 mb-2 flex items-center justify-center">
                    <User size={20} className="mr-2 text-green-500" /> Bio
                  </h3>
                  <p className="text-gray-700">{user.bio}</p>
                </motion.div>
              )}
            </div>

            {/* Profile Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Orders Section */}
              <motion.div 
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    <ShoppingBag size={24} className="mr-3 text-green-600" /> My Orders
                  </h3>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                  </div>
                </div>
                {orders.length > 0 ? (
                  <ul className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <motion.li 
                        key={order._id} 
                        whileHover={{ x: 5 }}
                        className="flex justify-between items-center bg-gray-50 p-4 rounded-lg hover:bg-purple-50 transition"
                      >
                        <div>
                          <span className="text-gray-700 font-medium">Order #{order._id.slice(-6)}</span>
                          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="bg-gradient-to-r from-green-500 to-green-400 text-white px-3 py-1 rounded-full text-sm font-bold">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                      </motion.li>
                    ))}
                    {orders.length > 3 && (
                      <li className="text-center pt-2">
                        <Link 
                          to="/orders" 
                          className="inline-flex items-center text-green-500 hover:text-green-600 transition font-medium"
                        >
                          View All Orders <ChevronRight size={16} className="ml-1" />
                        </Link>
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No orders placed yet.</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/products')}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-lg hover:opacity-90 transition shadow-md text-sm"
                    >
                      Start Shopping
                    </motion.button>
                  </div>
                )}
              </motion.div>

              {/* Addresses Section */}
              <motion.div 
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    <MapPin size={24} className="mr-3 text-red-600" /> My Addresses
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditingAddress(null);
                      setIsAddressModalOpen(true);
                    }}
                    className="p-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full hover:opacity-90 transition shadow-lg"
                    aria-label="Add New Address"
                  >
                    <Plus size={20} />
                  </motion.button>
                </div>
                {addresses.length > 0 ? (
                  <ul className="space-y-4">
                    {addresses.map((address) => (
                      <motion.li 
                        key={address._id} 
                        whileHover={{ scale: 1.01 }}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-red-200 transition"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-800 flex items-center">
                            <MapPin size={16} className="mr-2 text-red-500" />
                            {address.name}
                          </span>
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setEditingAddress(address);
                                setIsAddressModalOpen(true);
                              }}
                              className="text-blue-500 hover:text-blue-700 transition"
                              aria-label={`Edit address ${address.name}`}
                            >
                              <Edit size={18} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteAddressInitiate(address._id)}
                              className="text-red-500 hover:text-red-700 transition"
                              aria-label={`Delete address ${address.name}`}
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {address.street}
                          {address.apartment && `, ${address.apartment}`}, {address.city}, {address.state} - {address.zipCode}
                        </p>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No addresses added yet.</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsAddressModalOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition shadow-md text-sm"
                    >
                      Add Your First Address
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Quick Links Grid */}
            <motion.div 
              className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {[
                {
                  icon: <Heart size={24} className="text-pink-500" />,
                  title: "Wishlist",
                  link: "/wishlist",
                  color: "bg-pink-50 hover:bg-pink-100",
                },
                {
                  icon: <Bell size={24} className="text-amber-500" />,
                  title: "Notifications",
                  link: "/notifications",
                  color: "bg-amber-50 hover:bg-amber-100",
                },
                {
                  icon: <Shield size={24} className="text-emerald-500" />,
                  title: "Security",
                  link: "/change-password",
                  color: "bg-emerald-50 hover:bg-emerald-100",
                },
                {
                  icon: <HelpCircle size={24} className="text-blue-500" />,
                  title: "Help & Support",
                  link: "/contact-us",
                  color: "bg-blue-50 hover:bg-blue-100",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className={`p-5 rounded-xl ${item.color} transition cursor-pointer shadow-sm hover:shadow-md`}
                  onClick={() => navigate(item.link)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">{item.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">Manage your {item.title.toLowerCase()}</p>
                    </div>
                    {item.icon}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Logout Button */}
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={logout}
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
              >
                <LogOut size={20} className="mr-2" /> Log Out
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>

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
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
              >
                <Dialog.Panel>
                  <div className="bg-gradient-to-r from-green-500 to-green-400 p-5 text-white flex justify-between items-center">
                    <Dialog.Title className="text-xl font-bold">Edit Profile</Dialog.Title>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="p-1 rounded-full hover:bg-black/10 transition"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="p-6">
                    <div className="mb-6 text-center">
                      <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                        <img
                          src={previewImage.url || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white cursor-pointer opacity-0 hover:opacity-100 transition-opacity rounded-full"
                        >
                          <div className="text-center">
                            <Upload size={24} className="mx-auto mb-1" />
                            <span className="text-xs font-medium">Change Photo</span>
                          </div>
                        </label>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/jpeg, image/png"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                      <p className="text-sm text-gray-500">JPEG or PNG, max 5MB</p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          id="name"
                          {...profileForm.register("name", { required: "Name is required" })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 focus:ring-2 transition"
                        />
                        {profileForm.formState.errors.name && (
                          <p className="text-red-500 text-xs mt-2">{profileForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
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
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-gray-100 cursor-not-allowed"
                        />
                        {profileForm.formState.errors.email && (
                          <p className="text-red-500 text-xs mt-2">{profileForm.formState.errors.email.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <textarea
                          id="bio"
                          {...profileForm.register("bio")}
                          rows="3"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 focus:ring-2 transition"
                          placeholder="Tell us about yourself..."
                        ></textarea>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="px-5 py-2.5 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={submittingChanges}
                        className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-400 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                      >
                        {submittingChanges ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Save Changes
                      </motion.button>
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
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
              >
                <Dialog.Panel>
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 p-5 text-white flex justify-between items-center">
                    <Dialog.Title className="text-xl font-bold">
                      {editingAddress ? "Edit Address" : "Add New Address"}
                    </Dialog.Title>
                    <button
                      onClick={() => setIsAddressModalOpen(false)}
                      className="p-1 rounded-full hover:bg-black/10 transition"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="p-6">
                    <div className="space-y-5">
                      <div>
                        <label htmlFor="address-name" className="block text-sm font-medium text-gray-700 mb-2">Address Name (e.g., Home, Work)</label>
                        <input
                          type="text"
                          id="address-name"
                          {...addressForm.register("name", { required: "Address name is required" })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 focus:ring-2 transition"
                          placeholder="Home, Office, etc."
                        />
                        {addressForm.formState.errors.name && (
                          <p className="text-red-500 text-xs mt-2">{addressForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          id="street"
                          {...addressForm.register("street", { required: "Street address is required" })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 focus:ring-2 transition"
                        />
                        {addressForm.formState.errors.street && (
                          <p className="text-red-500 text-xs mt-2">{addressForm.formState.errors.street.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-2">Apartment, Suite, etc. (Optional)</label>
                        <input
                          type="text"
                          id="apartment"
                          {...addressForm.register("apartment")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 focus:ring-2 transition"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            id="city"
                            {...addressForm.register("city", { required: "City is required" })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 focus:ring-2 transition"
                          />
                          {addressForm.formState.errors.city && (
                            <p className="text-red-500 text-xs mt-2">{addressForm.formState.errors.city.message}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State</label>
                          <input
                            type="text"
                            id="state"
                            {...addressForm.register("state", { required: "State is required" })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 focus:ring-2 transition"
                          />
                          {addressForm.formState.errors.state && (
                            <p className="text-red-500 text-xs mt-2">{addressForm.formState.errors.state.message}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                          <input
                            type="text"
                            id="zipCode"
                            {...addressForm.register("zipCode", { required: "Zip Code is required" })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 focus:ring-2 transition"
                          />
                          {addressForm.formState.errors.zipCode && (
                            <p className="text-red-500 text-xs mt-2">{addressForm.formState.errors.zipCode.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setIsAddressModalOpen(false)}
                        className="px-5 py-2.5 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={submittingChanges}
                        className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                      >
                        {submittingChanges ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        {editingAddress ? "Update Address" : "Add Address"}
                      </motion.button>
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