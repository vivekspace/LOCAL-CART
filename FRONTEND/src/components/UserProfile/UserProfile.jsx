// src/pages/ProfilePage.js
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
  Image,
  Upload,
} from "lucide-react";
import { AuthContext } from "../../Context/Context";

const ProfilePage = () => {
  const { user, setUser, isLoggedIn } = useContext(AuthContext);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingChanges, setSubmittingChanges] = useState(false);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

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
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required. Please login.");
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    // Don't set Content-Type for FormData (handled automatically with boundary)
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const data = await makeAuthenticatedFetch(`${API_BASE_URL}/api/users/me`);
      // Remove: await data.json();
      setUser(data.data.user);
      return data.data.user;
    } catch (error) {
      console.log("From Profile ", error);
      // ...
    }
  }, [API_BASE_URL, makeAuthenticatedFetch, setUser]);
  const fetchUserOrders = useCallback(async () => {
    try {
      const data = await makeAuthenticatedFetch(`${API_BASE_URL}/api/orders`);
      // Remove: await data.json();
      if (!data || !Array.isArray(data.orders)) {
        throw new Error("Invalid response format for orders from server");
      }
      setOrders(data.orders);
      return data.orders;
    } catch (error) {
      console.log("From Orders ", error);
      // ...
    }
  }, [API_BASE_URL, makeAuthenticatedFetch]);

  const fetchUserAddresses = useCallback(async () => {
    try {
      const data = await makeAuthenticatedFetch(
        `${API_BASE_URL}/api/users/me/addresses`
      );
      // Remove: await data.json();
      setAddresses(data.data?.addresses || []);
    } catch (error) {
      console.log("From Address ", error);
      // ...
    }
  }, [API_BASE_URL, makeAuthenticatedFetch]);

  const fetchAllData = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchUserOrders(),
        fetchUserAddresses(),
      ]);
    } catch (error) {
      console.error("fetchAllData: Error during data fetching:", error);
      if (error.message === "Authentication required. Please login.") {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [
    isLoggedIn,
    fetchUserProfile,
    fetchUserOrders,
    fetchUserAddresses,
    setUser,
  ]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match("image.*")) {
      toast.error("Please select an image file (JPEG, PNG)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
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

  // Corrected onSubmitProfile excerpt:
  const onSubmitProfile = async (data) => {
    setSubmittingChanges(true);
    try {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.email) formData.append("email", data.email);
      if (data.bio) formData.append("bio", data.bio);
      if (selectedFile) {
        formData.append("photo", selectedFile);
      }

      // makeAuthenticatedFetch already returns the parsed JSON
      const responseData = await makeAuthenticatedFetch(
        // Changed variable name from 'response' to 'responseData' for clarity
        `${API_BASE_URL}/api/users/updateMe`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      // No need for 'await response.json()' here. 'responseData' is already the parsed JSON object.
      setUser(responseData.data.user);
      toast.success("Profile updated successfully!");
      setIsEditModalOpen(false);
      setSelectedFile(null);
      setPreviewImage(null);
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
      await fetchUserAddresses();
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

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;

    try {
      await makeAuthenticatedFetch(
        `${API_BASE_URL}/api/users/me/addresses/${addressId}`,
        {
          method: "DELETE",
        }
      );
      toast.info("Address deleted successfully!");
      fetchUserAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error(error.message || "Failed to delete address.");
    }
  };

  useEffect(() => {
    if (isEditModalOpen && user) {
      profileForm.reset({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
      });
      setPreviewImage(user.photo || null);
      setSelectedFile(null);
    }
  }, [isEditModalOpen, user]);

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
  }, [isAddressModalOpen, editingAddress]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div> {/* Changed color to blue for user side */}
          <p className="text-lg text-gray-700">Loading your profile...</p> 
          <p className="text-sm text-gray-500">
            LocalCart is fetching your personalized experience
          </p> {/* Changed text */}
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">
            Please log in to view your profile.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with green Background */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-6 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-green-100 mt-1">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Overview Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-green-100">
          <div className="bg-gradient-to-r from-green-500 to-green-600 h-24 w-full"></div>
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 -mt-16">
              <div className="relative">
                <img
                  src={
                    previewImage || // This is for local preview before upload
                    (user?.photo
                      ? `${import.meta.env.VITE_API_URL}/uploads/${user.photo}`
                      : "https://via.placeholder.com/150") // Corrected line
                  }
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                />
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute bottom-2 right-2 bg-green-500 p-2 rounded-full text-white hover:bg-green-700 transition shadow-md"
                  aria-label="Edit Profile"
                >
                  <Edit size={16} />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800">
                  {user?.name || "N/A"}
                </h2>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Mail size={16} className="text-green-600" />
                  {user?.email || "N/A"}
                </p>
                {user?.bio && (
                  <p className="mt-3 text-gray-700 bg-green-50 p-3 rounded-lg border border-green-100">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Orders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order History Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                  <ShoppingBag size={20} className="text-green-600" />
                  Recent Orders
                </h2>
                {orders.length > 0 && (
                  <Link
                    to={"/orders"}
                    className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                  >
                    View All <ChevronRight size={16} />
                  </Link>
                )}
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <Link
                      to={`/orders/${order._id}`}
                      key={order._id}
                      className="group block p-5 rounded-lg border border-gray-200 hover:border-green-300 bg-white hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">
                              #{order.orderNumber}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium
                              ${
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag
                    size={40}
                    className="mx-auto text-gray-300 mb-3"
                  />
                  <p className="text-gray-500 mb-4">
                    You haven't placed any orders yet.
                  </p>
                  <Link
                    to={"/shopping"}
                    className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>

            {/* Addresses Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                  <MapPin size={20} className="text-green-600" />
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
                    <div
                      key={address._id}
                      className="p-4 rounded-lg border border-gray-200 bg-white hover:border-green-300 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-800">
                            {address.name}
                          </h3>
                          <p className="text-gray-600 mt-1 text-sm">
                            {address.street}
                            {address.apartment &&
                              `, ${address.apartment}`}, {address.city},{" "}
                            {address.state} {address.zipCode}
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
                              handleDeleteAddress(address._id);
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">
                    You don't have any saved addresses yet.
                  </p>
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Address
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Account Settings */}
          <div className="space-y-6">
            {/* Account Settings Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                <Lock size={20} className="text-green-600" />
                Account Settings
              </h2>
              <div className="space-y-3">
                <button className="w-full text-left flex justify-between items-center p-3 hover:bg-green-50 rounded-lg transition text-gray-700 group">
                  <span className="flex items-center gap-2">
                    <Lock size={16} className="text-green-600" />
                    Change Password
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover:text-green-600"
                  />
                </button>
                <button className="w-full text-left flex justify-between items-center p-3 hover:bg-green-50 rounded-lg transition text-gray-700 group">
                  <span className="flex items-center gap-2">
                    <Bell size={16} className="text-green-600" />
                    Notification Preferences
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover:text-green-600"
                  />
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    setUser(null);
                    toast.info("You have been logged out.");
                    navigate("/login");
                  }}
                  className="w-full text-left flex justify-between items-center p-3 hover:bg-red-50 rounded-lg transition text-red-600 font-medium group"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 size={16} />
                    Logout
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover:text-red-600"
                  />
                </button>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                <User size={20} className="text-green-600" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  to="/wishlist"
                  className="block p-3 hover:bg-green-50 rounded-lg transition text-gray-700 border border-gray-100 hover:border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </div>
                    <span className="font-medium">View Wishlist</span>
                  </div>
                </Link>
                <Link
                  to="/support"
                  className="block p-3 hover:bg-green-50 rounded-lg transition text-gray-700 border border-gray-100 hover:border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <span className="font-medium">Contact Support</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md mx-auto rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-green-600 p-4 text-white">
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
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <img
                    src={
                      previewImage || // This is for local preview before upload
                      (user?.photo
                        ? `${import.meta.env.VITE_API_URL}/uploads/${
                            user.photo
                          }`
                        : "https://via.placeholder.com/150") // Corrected line
                    }
                    alt="Profile Preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                  <label
                    htmlFor="profile-upload"
                    className="absolute bottom-0 right-0 bg-green-500 p-2 rounded-full text-white hover:bg-green-700 transition shadow-md cursor-pointer"
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
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)}
                    KB)
                  </p>
                )}
                <p className="text-xs text-gray-500 text-center">
                  JPG, PNG (max 5MB)
                </p>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1 text-gray-700"
                >
                  Name
                </label>
                <input
                  id="name"
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
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1 text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...profileForm.register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                    profileForm.formState.errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "focus:ring-green-500 border-gray-300"
                  }`}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium mb-1 text-gray-700"
                >
                  Bio (Optional)
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  {...profileForm.register("bio")}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition resize-none border-gray-300"
                  placeholder="Tell us a little about yourself..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submittingChanges ||
                    !profileForm.formState.isValid ||
                    isUploading
                  }
                  className={`flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition font-medium ${
                    submittingChanges ||
                    !profileForm.formState.isValid ||
                    isUploading
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {submittingChanges || isUploading
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Add/Edit Address Modal */}
      <Dialog
        open={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md mx-auto rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-green-600 p-4 text-white">
              <div className="flex justify-between items-center">
                <Dialog.Title className="text-xl font-bold">
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </Dialog.Title>
                <button
                  onClick={() => {
                    setIsAddressModalOpen(false);
                    setEditingAddress(null);
                  }}
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
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Address Name (e.g., Home, Work)
                </label>
                <input
                  {...addressForm.register("name", {
                    required: "Address name is required",
                  })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition border-gray-300"
                />
                {addressForm.formState.errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {addressForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Street Address
                </label>
                <input
                  {...addressForm.register("street", {
                    required: "Street address is required",
                  })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition border-gray-300"
                />
                {addressForm.formState.errors.street && (
                  <p className="text-red-500 text-xs mt-1">
                    {addressForm.formState.errors.street.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Apartment, Suite, etc. (Optional)
                </label>
                <input
                  {...addressForm.register("apartment")}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition border-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    City
                  </label>
                  <input
                    {...addressForm.register("city", {
                      required: "City is required",
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition border-gray-300"
                  />
                  {addressForm.formState.errors.city && (
                    <p className="text-red-500 text-xs mt-1">
                      {addressForm.formState.errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    State
                  </label>
                  <input
                    {...addressForm.register("state", {
                      required: "State is required",
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition border-gray-300"
                  />
                  {addressForm.formState.errors.state && (
                    <p className="text-red-500 text-xs mt-1">
                      {addressForm.formState.errors.state.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    ZIP Code
                  </label>
                  <input
                    {...addressForm.register("zipCode", {
                      required: "ZIP code is required",
                      pattern: {
                        value: /^\d{5,6}(?:[-\s]\d{4})?$/,
                        message: "Invalid ZIP code",
                      },
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition border-gray-300"
                  />
                  {addressForm.formState.errors.zipCode && (
                    <p className="text-red-500 text-xs mt-1">
                      {addressForm.formState.errors.zipCode.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddressModalOpen(false);
                    setEditingAddress(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingChanges || !addressForm.formState.isValid}
                  className={`flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition font-medium ${
                    submittingChanges || !addressForm.formState.isValid
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {submittingChanges ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
