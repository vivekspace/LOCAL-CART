import React, { useContext, useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "@headlessui/react";
import { toast } from "react-toastify";
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
} from "lucide-react";
import { AuthContext } from "../../Context/Context";

console.log("🔥🔥🔥 ProfilePage.jsx HAS BEEN LOADED 🔥🔥🔥");

const ProfilePage = () => {
  const { user, setUser, isLoggedIn } = useContext(AuthContext);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submittingChanges, setSubmittingChanges] = useState(false);

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);

  // Separate forms for profile and address
  const profileForm = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      bio: "",
    },
  });

  // Update your address form initialization
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
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

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
      setUser(data.data.user);
      return data.data.user;
    } catch (error) {
      console.error("fetchUserProfile: FAILED:", error);
      toast.error(error.message || "Failed to load profile data.");
      throw error;
    }
  }, [API_BASE_URL, makeAuthenticatedFetch, setUser]);

  const fetchUserOrders = useCallback(async () => {
    try {
      const data = await makeAuthenticatedFetch(`${API_BASE_URL}/api/orders`);
      if (!data || !Array.isArray(data.orders)) {
        throw new Error("Invalid response format for orders from server");
      }
      setOrders(data.orders);
      return data.orders;
    } catch (error) {
      console.error("fetchUserOrders: FAILED:", error);
      toast.error(error.message || "Failed to load order history.");
      return [];
    }
  }, [API_BASE_URL, makeAuthenticatedFetch]);

  const fetchUserAddresses = useCallback(async () => {
    try {
      const data = await makeAuthenticatedFetch(
        `${API_BASE_URL}/api/users/me/addresses`
      );
      setAddresses(data.data?.addresses || []);
    } catch (error) {
      console.error("fetchUserAddresses error:", error);
      toast.error(error.message || "Failed to load addresses.");
      setAddresses([]);
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

  const onSubmitProfile = async (data) => {
    setSubmittingChanges(true);
    try {
      const responseData = await makeAuthenticatedFetch(
        `${API_BASE_URL}/api/users/updateMe`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      );
      setUser(responseData.data.user);
      toast.success("Profile updated successfully!");
      setIsEditModalOpen(false);
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
      // Combine address fields into a single fullAddress string
      const fullAddress = `${data.street}, ${
        data.apartment ? data.apartment + ", " : ""
      }${data.city}, ${data.state} ${data.zipCode}`;

      const addressData = {
        name: data.name,
        fullAddress,
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

  // Effect to reset profile form when modal opens or user changes
  useEffect(() => {
    if (isEditModalOpen && user) {
      profileForm.reset({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
      });
    }
  }, [isEditModalOpen, user]);

  // Effect to reset address form when modal opens/closes or editingAddress changes
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading your profile...</p>
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
            onClick={() => (window.location.href = "/login")}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="rounded-xl shadow-md p-6 mb-8 bg-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={user.photo || "https://via.placeholder.com/96"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-green-500"
              />
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute bottom-0 right-0 bg-green-500 p-2 rounded-full text-white hover:bg-green-600 transition"
                aria-label="Edit Profile"
              >
                <Edit size={16} />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.name || "N/A"}</h2>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Mail size={16} /> {user.email || "N/A"}
              </p>
              {user.bio && <p className="mt-3 text-gray-700">{user.bio}</p>}
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="rounded-xl shadow-md p-6 mb-8 bg-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingBag size={20} /> Order History
          </h2>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="p-4 rounded-lg border flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="font-medium">Order #{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()} •{" "}
                      <span
                        className={`font-semibold ${
                          order.status === "Delivered"
                            ? "text-green-600"
                            : order.status === "Pending"
                            ? "text-orange-500"
                            : "text-blue-500"
                        }`}
                      >
                        {order.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-lg">
                      ₹{order.totalAmount?.toFixed(2)}
                    </p>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You haven't placed any orders yet.</p>
          )}
        </div>

        {/* Saved Addresses */}
        <div className="rounded-xl shadow-md p-6 mb-8 bg-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin size={20} /> Saved Addresses
          </h2>
          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className="p-4 rounded-lg border bg-gray-50 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-gray-800">{address.name}</h3>
                    <p className="text-gray-600 mt-1">{address.fullAddress}</p>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => {
                        setEditingAddress(address);
                        setIsAddressModalOpen(true);
                      }}
                      className="text-green-600 hover:underline text-sm flex items-center gap-1"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address._id)}
                      className="text-red-600 hover:underline text-sm flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You don't have any saved addresses.</p>
          )}
          <button
            onClick={() => {
              setEditingAddress(null);
              setIsAddressModalOpen(true);
            }}
            className="mt-4 text-green-600 hover:underline flex items-center gap-1 font-medium"
          >
            <Plus size={16} /> <span>Add New Address</span>
          </button>
        </div>

        {/* Account Settings */}
        <div className="rounded-xl shadow-md p-6 bg-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock size={20} /> Account Settings
          </h2>
          <div className="space-y-2">
            <button className="w-full flex justify-between items-center p-3 hover:bg-gray-100 rounded-lg transition text-gray-700">
              <span className="flex items-center gap-2">
                <Lock size={16} /> Change Password
              </span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
            <button className="w-full flex justify-between items-center p-3 hover:bg-gray-100 rounded-lg transition text-gray-700">
              <span className="flex items-center gap-2">
                <Bell size={16} /> Notification Preferences
              </span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                setUser(null);
                toast.info("You have been logged out.");
                window.location.href = "/login";
              }}
              className="w-full flex justify-between items-center p-3 hover:bg-red-50 rounded-lg transition text-red-600 font-medium"
            >
              <span className="flex items-center gap-2">
                <Trash2 size={16} /> Logout
              </span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
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
          <Dialog.Panel className="w-full max-w-md mx-auto rounded-xl p-6 bg-white shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-2xl font-bold text-gray-800">
                Edit Profile
              </Dialog.Title>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 transition"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={profileForm.handleSubmit(onSubmitProfile)}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
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
                  className="block text-sm font-medium mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
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
                <label htmlFor="bio" className="block text-sm font-medium mb-1">
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
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingChanges || !profileForm.formState.isValid}
                  className={`flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition font-semibold ${
                    submittingChanges || !profileForm.formState.isValid
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {submittingChanges ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Add/Edit Address Modal */}
      {/* Add/Edit Address Modal */}
      <Dialog
        open={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        className="relative z-50"
      >
        {/* This div prevents background scrolling */}
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="w-full max-w-md mx-auto rounded-xl bg-white shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-2xl font-bold text-gray-800">
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </Dialog.Title>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddressModalOpen(false);
                    setEditingAddress(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 transition"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>

              <form
                onSubmit={addressForm.handleSubmit(onSubmitAddress)}
                className="space-y-4"
              >
                {/* Address Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
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

                {/* Street Address */}
                <div>
                  <label className="block text-sm font-medium mb-1">
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

                {/* Apartment/Suite */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Apartment, Suite, etc. (Optional)
                  </label>
                  <input
                    {...addressForm.register("apartment")}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition border-gray-300"
                  />
                </div>

                {/* City, State, ZIP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                    <label className="block text-sm font-medium mb-1">
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
                    <label className="block text-sm font-medium mb-1">
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

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddressModalOpen(false);
                      setEditingAddress(null);
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      submittingChanges || !addressForm.formState.isValid
                    }
                    className={`flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition ${
                      submittingChanges || !addressForm.formState.isValid
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {submittingChanges ? "Saving..." : "Save Address"}
                  </button>
                </div>
              </form>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
