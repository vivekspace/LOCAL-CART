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
  Store, // For vendor store icon
  Package, // For products
  Phone, // For contact number
  ClipboardList, // For orders
} from "lucide-react";
import { AuthContext } from "../../Context/Context";
import { motion, AnimatePresence } from "framer-motion";

// Custom Confirmation Modal Component (reused from UserProfile)
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
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 p-4 text-white flex justify-between items-center">
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
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-400 text-white hover:opacity-90 transition shadow-md"
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

const VendorProfile = () => {
  const { user, jwtToken, authAxios,isAuthLoading, isLoggedIn, setAuth } = useContext(AuthContext);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingChanges, setSubmittingChanges] = useState(false);
  const [products, setProducts] = useState([]); // State for vendor's products
  const [orders, setOrders] = useState([]); // State for vendor's received orders
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  console.log(user, "user in vendor profile");

  // Form for vendor profile details
  const vendorProfileForm = useForm({
    mode: "onChange",
    defaultValues: {
      businessName: "",
      email: "",
      contactNumber: "",
      businessDescription: "",
      businessAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
    },
  });

  // Form for product details
  const productForm = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stock: "",
      imageUrl: "", // For product image URL
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

  // Fetch vendor profile data
  const fetchVendorProfile = useCallback(async () => {
      try {
        // Assuming an API endpoint for fetching vendor's own profile
        const data = await makeAuthenticatedFetch(`${API_BASE_URL}/api/vendors/me`);
        if (data && data.data && data.data.vendor) {
          setAuth(prev => ({
            ...prev,
            user: data.data.vendor // Assuming 'user' in AuthContext can represent a vendor
          }));
          console.log("Vendor profile fetched successfully:", data.data.vendor);
          return data.data.vendor;
        } else {
          console.warn("Vendor data not found in response:", data);
          setAuth(prev => ({ ...prev, user: null, jwtToken: null }));
          return null;
        }
      } catch (error) {
        console.error("Error fetching vendor profile:", error);
        throw error;
      }
    }, [API_BASE_URL, makeAuthenticatedFetch, setAuth]);

    // Fetch vendor's products
    const fetchVendorProducts = useCallback(async () => {
      try {
        // Assuming an API endpoint for fetching vendor's products
      const data = await authAxios.get(`/api/vendor/products`);
      console.log("fetch vendor products data",data.data.data)
        setProducts(data.data.data);
      } catch (error) {
        console.error("Error fetching vendor products:", error);
        throw error;
      }
    }, [API_BASE_URL, makeAuthenticatedFetch]);

    // Fetch vendor's received orders
    const fetchVendorOrders = useCallback(async () => {
      try {
        // Assuming an API endpoint for fetching orders received by the vendor
        const data = await authAxios.get(`${API_BASE_URL}/api/vendor/orders`);
        setOrders(data.data.orders);
        console.log("fetch vendor order data",data.data.orders)
        
      } catch (error) {
        console.error("Error fetching vendor orders:", error);
        throw error;
      }
    }, [API_BASE_URL, makeAuthenticatedFetch]);

    const fetchAllData = useCallback(async () => {
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
          fetchVendorProfile(),
          fetchVendorProducts(),
          fetchVendorOrders(),
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
      isAuthLoading,
      fetchVendorProfile,
      fetchVendorProducts,
      fetchVendorOrders,
    ]);

    useEffect(() => {
      if (!isAuthLoading) {
        fetchAllData();
      }
    }, [isAuthLoading, fetchAllData]);

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        setSelectedFile(null);
        setPreviewImage(user?.photo ? user.photo : "https://via.placeholder.com/150");
        return;
      }

      if (!file.type.match("image/(jpeg|png)")) {
        toast.error("Please select a JPEG or PNG image file.");
        setSelectedFile(null);
        setPreviewImage(user?.photo ? user.photo : "https://via.placeholder.com/150");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB.");
        setSelectedFile(null);
        setPreviewImage(user?.photo ? user.photo : "https://via.placeholder.com/150");
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    };

    // Submit vendor profile changes
    const onSubmitVendorProfile = async (data) => {
      setSubmittingChanges(true);
      try {
        const formData = new FormData();
        if (data.businessName) formData.append("businessName", data.businessName);
        if (data.businessDescription) formData.append("businessDescription", data.businessDescription);
        if (data.contactNumber) formData.append("contactNumber", data.contactNumber);
        if (data.businessAddress) formData.append("businessAddress", JSON.stringify(data.businessAddress)); // Stringify complex object
        if (selectedFile) {
          formData.append("photo", selectedFile);
        }

        const responseData = await makeAuthenticatedFetch(
          `${API_BASE_URL}/api/vendors/updateMe`, // Assuming this endpoint exists
          {
            method: "PATCH",
            body: formData,
          }
        );

        if (responseData && responseData.data && responseData.data.vendor) {
          setAuth(prev => ({
            ...prev,
            user: responseData.data.vendor
          }));
          toast.success("Vendor profile updated successfully!");
          setIsEditModalOpen(false);
          setSelectedFile(null);
          setPreviewImage(responseData.data.vendor.photo ? responseData.data.vendor.photo : "https://via.placeholder.com/150");
        } else {
          toast.error("Vendor profile update response missing data.");
        }
      } catch (error) {
        console.error("Error updating vendor profile:", error);
        toast.error(error.message || "Failed to update vendor profile.");
      } finally {
        setSubmittingChanges(false);
      }
    };

    // Submit product changes (add/edit)
    const onSubmitProduct = async (data) => {
      setSubmittingChanges(true);
      try {
        const productPayload = {
          name: data.name,
          description: data.description,
          price: parseFloat(data.price),
          stock: parseInt(data.stock, 10),
          imageUrl: data.imageUrl,
        };

        const endpoint = editingProduct
          ? `${API_BASE_URL}/api/vendors/me/products/${editingProduct._id}`
          : `${API_BASE_URL}/api/vendors/me/products`;

        await makeAuthenticatedFetch(endpoint, {
          method: editingProduct ? "PUT" : "POST",
          body: JSON.stringify(productPayload),
        });

        toast.success(
          `Product ${editingProduct ? "updated" : "added"} successfully!`
        );
        await fetchVendorProducts(); // Re-fetch products to update the list
        setIsProductModalOpen(false);
        setEditingProduct(null);
        productForm.reset();
      } catch (error) {
        console.error("Error saving product:", error);
        toast.error(error.message || "Failed to save product.");
      } finally {
        setSubmittingChanges(false);
      }
    };

    const handleDeleteProductInitiate = (productId) => {
      setProductToDelete(productId);
      setIsConfirmModalOpen(true);
    };

    const handleDeleteProductConfirm = async () => {
      setIsConfirmModalOpen(false);
      if (!productToDelete) return;

      try {
        await makeAuthenticatedFetch(
          `${API_BASE_URL}/api/vendors/me/products/${productToDelete}`,
          {
            method: "DELETE",
          }
        );
        toast.info("Product deleted successfully!");
        fetchVendorProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error(error.message || "Failed to delete product.");
      } finally {
        setProductToDelete(null);
      }
    };

    const handleDeleteProductCancel = () => {
      setIsConfirmModalOpen(false);
      setProductToDelete(null);
    };

    useEffect(() => {
      if (isEditModalOpen && user) {
        vendorProfileForm.reset({
          businessName: user.businessName || "",
          email: user.email || "",
          contactNumber: user.contactNumber || "",
          businessDescription: user.businessDescription || "",
          businessAddress: {
            street: user.businessAddress?.street || "",
            city: user.businessAddress?.city || "",
            state: user.businessAddress?.state || "",
            zipCode: user.businessAddress?.zipCode || "",
          },
        });
        setPreviewImage(user.photo ? user.photo.url : "https://via.placeholder.com/150");
        setSelectedFile(null);
      }
    }, [isEditModalOpen, user, vendorProfileForm]);

    useEffect(() => {
      if (isProductModalOpen) {
        productForm.reset(
          editingProduct || {
            name: "",
            description: "",
            price: "",
            stock: "",
            imageUrl: "",
          }
        );
      }
    }, [isProductModalOpen, editingProduct, productForm]);

    useEffect(() => {
      const handleBeforeUnload = (event) => {
        if (isEditModalOpen || isProductModalOpen || submittingChanges) {
          event.preventDefault();
          event.returnValue = "";
        }
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }, [isEditModalOpen, isProductModalOpen, submittingChanges]);

  if (loading || isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full" />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-medium text-gray-700"
        >
          Loading vendor profile
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
          className="max-w-md w-full bg-white lg:md:p-8 p-2 rounded-2xl shadow-lg text-center"
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
            Please log in as a vendor to view this page.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-400 text-white rounded-lg hover:opacity-90 transition shadow-md"
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
        <div className="relative bg-gradient-to-r from-indigo-500 to-indigo-400 h-48 rounded-t-2xl flex items-center justify-center p-6 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-t-2xl" />
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="relative w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-xl"
          >
            <img
              src={user.photo ? user.photo.url : "https://res.cloudinary.com/dr9zse9a6/image/upload/v1753848167/vendor_default_logo_ht2qor.webp"}
              alt="Vendor Profile"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => {
                setIsEditModalOpen(true);
                vendorProfileForm.reset({
                  businessName: user.businessName || "",
                  email: user.email || "",
                  contactNumber: user.contactNumber || "",
                  businessDescription: user.businessDescription || "",
                  businessAddress: {
                    street: user.businessAddress?.street || "",
                    city: user.businessAddress?.city || "",
                    state: user.businessAddress?.state || "",
                    zipCode: user.businessAddress?.zipCode || "",
                  },
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
          <div className="lg:md:p-8 p-2">
            <div className="text-center mb-8">
              <motion.h1 
                className="text-3xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {user.businessName}
              </motion.h1>
              <motion.p 
                className="text-lg text-gray-600 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {user.email}
              </motion.p>
              <motion.p 
                className="text-md text-gray-600 mb-6 flex items-center justify-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Phone size={18} className="mr-2 text-gray-500" /> {user.contactNumber}
              </motion.p>
              
              {user.businessDescription && (
                <motion.div 
                  className="bg-indigo-50 p-4 rounded-xl mb-8 shadow-inner max-w-2xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-lg font-semibold text-indigo-600 mb-2 flex items-center justify-center">
                    <Store size={20} className="mr-2 text-indigo-500" /> Business Description
                  </h3>
                  <p className="text-gray-700">{user.businessDescription}</p>
                </motion.div>
              )}

              {user.businessAddress && (
                <motion.div 
                  className="bg-indigo-50 p-4 rounded-xl mb-8 shadow-inner max-w-2xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <h3 className="text-lg font-semibold text-indigo-600 mb-2 flex items-center justify-center">
                    <MapPin size={20} className="mr-2 text-indigo-500" /> Business Address
                  </h3>
                  <p className="text-gray-700">
                    {user.businessAddress.street}
                    {user.businessAddress.apartment && `, ${user.businessAddress.apartment}`}, <br/>
                    {user.businessAddress.city}, {user.businessAddress.state} - {user.businessAddress.zipCode}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Vendor Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Products Section */}
              <motion.div 
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Package size={24} className="mr-3 text-indigo-600" /> My Products
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-400 text-white rounded-full hover:opacity-90 transition shadow-lg"
                    aria-label="Add New Product"
                  >
                    <Plus size={20} />
                  </motion.button>
                </div>
                {products.length > 0 ? (
                  <ul className="space-y-3">
                    {products.slice(0, 3).map((product) => (
                      <motion.li 
                        key={product._id} 
                        whileHover={{ x: 5 }}
                        className="flex justify-between items-center bg-gray-50 lg:md:p-4 p-2 rounded-lg hover:bg-indigo-100 transition"
                      >
                        <div className="flex items-center">
                          <img 
                            src={product.images[0].url || "https://placehold.co/50x50/e0e0e0/333333?text=Product"} 
                            alt={product.name} 
                            className="w-12 h-12 object-contain rounded-md mr-4"
                          />
                          <div>
                            <span className="text-gray-700 text-sm font-medium">{product.name}</span>
                            <p className="text-xs  text-gray-500">Stock: {product.stock}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-gradient-to-r from-indigo-500 to-indigo-400 text-white lg:md:px-3 px-1.5  py-1 rounded-full lg:md:text-sm text-xs font-bold">
                            ${product.price.toFixed(2)}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setEditingProduct(product);
                              setIsProductModalOpen(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 transition"
                            aria-label={`Edit product ${product.name}`}
                          >
                            <Edit size={14} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteProductInitiate(product._id)}
                            className="text-red-500 hover:text-red-700  transition"
                            aria-label={`Delete product ${product.name}`}
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </motion.li>
                    ))}
                    {products.length > 3 && (
                      <li className="text-center pt-2">
                        <Link 
                          to="/vendor/products" 
                          className="inline-flex items-center text-indigo-500 hover:text-indigo-600 transition font-medium"
                        >
                          View All Products <ChevronRight size={16} className="ml-1" />
                        </Link>
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No products added yet.</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsProductModalOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-400 text-white rounded-lg hover:opacity-90 transition shadow-md text-sm"
                    >
                      Add Your First Product
                    </motion.button>
                  </div>
                )}
              </motion.div>

              {/* Recent Orders Section */}
              <motion.div 
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    <ClipboardList size={24} className="mr-3 text-indigo-600" /> Recent Orders
                  </h3>
                  <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                    {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                  </div>
                </div>
                {orders.length > 0 ? (
                  <ul className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <motion.li 
                        key={order._id} 
                        whileHover={{ x: 5 }}
                        className="flex justify-between items-center bg-gray-50 p-4 rounded-lg hover:bg-indigo-100 transition"
                      >
                        <div>
                          <span className="text-gray-700 font-medium">Order #{order._id.slice(-6)}</span>
                          <p className="text-sm text-gray-500">Items: {order.items.length}</p>
                        </div>
                        <span className="bg-gradient-to-r from-indigo-500 to-indigo-400 text-white px-3 py-1 rounded-full text-sm font-bold">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                      </motion.li>
                    ))}
                    {orders.length > 3 && (
                      <li className="text-center pt-2">
                        <Link 
                          to="/vendor/orders" 
                          className="inline-flex items-center text-indigo-500 hover:text-indigo-600 transition font-medium"
                        >
                          View All Orders <ChevronRight size={16} className="ml-1" />
                        </Link>
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No recent orders.</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/vendor/products')}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-400 text-white rounded-lg hover:opacity-90 transition shadow-md text-sm"
                    >
                      Manage Products
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
                  icon: <Bell size={24} className="text-amber-500" />,
                  title: "Notifications",
                  link: "/vendor/notifications",
                  color: "bg-amber-50 hover:bg-amber-100",
                },
                {
                  icon: <Shield size={24} className="text-emerald-500" />,
                  title: "Security",
                  link: "/vendor/change-password",
                  color: "bg-emerald-50 hover:bg-emerald-100",
                },
                {
                  icon: <CreditCard size={24} className="text-purple-500" />,
                  title: "Payout Settings",
                  link: "/vendor/payouts",
                  color: "bg-purple-50 hover:bg-purple-100",
                },
                {
                  icon: <HelpCircle size={24} className="text-blue-500" />,
                  title: "Help & Support",
                  link: "/vendor/contact-us",
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
                onClick={() => {
                  localStorage.removeItem("jwtToken");
                  localStorage.removeItem("currentUser");
                  toast.info("Logged out successfully!");
                  navigate("/login");
                }}
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
              >
                <LogOut size={20} className="mr-2" /> Log Out
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Edit Vendor Profile Modal */}
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
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 p-5 text-white flex justify-between items-center">
                    <Dialog.Title className="text-xl font-bold">Edit Vendor Profile</Dialog.Title>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="p-1 rounded-full hover:bg-black/10 transition"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <form onSubmit={vendorProfileForm.handleSubmit(onSubmitVendorProfile)} className="p-6">
                    <div className="mb-6 text-center">
                      <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                        <img
                          src={previewImage || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"}
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
                        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                        <input
                          type="text"
                          id="businessName"
                          {...vendorProfileForm.register("businessName", { required: "Business name is required" })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                        />
                        {vendorProfileForm.formState.errors.businessName && (
                          <p className="text-red-500 text-xs mt-2">{vendorProfileForm.formState.errors.businessName.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          id="email"
                          {...vendorProfileForm.register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                              message: "Invalid email address",
                            },
                          })}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-gray-100 cursor-not-allowed"
                        />
                        {vendorProfileForm.formState.errors.email && (
                          <p className="text-red-500 text-xs mt-2">{vendorProfileForm.formState.errors.email.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                        <input
                          type="text"
                          id="contactNumber"
                          {...vendorProfileForm.register("contactNumber", { required: "Contact number is required" })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                        />
                        {vendorProfileForm.formState.errors.contactNumber && (
                          <p className="text-red-500 text-xs mt-2">{vendorProfileForm.formState.errors.contactNumber.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                        <textarea
                          id="businessDescription"
                          {...vendorProfileForm.register("businessDescription")}
                          rows="3"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                          placeholder="Tell us about your business..."
                        ></textarea>
                      </div>
                      <fieldset className="space-y-4 border p-4 rounded-xl shadow-sm">
                        <legend className="text-md font-semibold text-gray-800">Business Address</legend>
                        <div>
                          <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                          <input
                            type="text"
                            id="street"
                            {...vendorProfileForm.register("businessAddress.street", { required: "Street is required" })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                          />
                          {vendorProfileForm.formState.errors.businessAddress?.street && (
                            <p className="text-red-500 text-xs mt-2">{vendorProfileForm.formState.errors.businessAddress.street.message}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
                            <input
                              type="text"
                              id="city"
                              {...vendorProfileForm.register("businessAddress.city", { required: "City is required" })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                            />
                            {vendorProfileForm.formState.errors.businessAddress?.city && (
                              <p className="text-red-500 text-xs mt-2">{vendorProfileForm.formState.errors.businessAddress.city.message}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State</label>
                            <input
                              type="text"
                              id="state"
                              {...vendorProfileForm.register("businessAddress.state", { required: "State is required" })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                            />
                            {vendorProfileForm.formState.errors.businessAddress?.state && (
                              <p className="text-red-500 text-xs mt-2">{vendorProfileForm.formState.errors.businessAddress.state.message}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                            <input
                              type="text"
                              id="zipCode"
                              {...vendorProfileForm.register("businessAddress.zipCode", { required: "Zip Code is required" })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                            />
                            {vendorProfileForm.formState.errors.businessAddress?.zipCode && (
                              <p className="text-red-500 text-xs mt-2">{vendorProfileForm.formState.errors.businessAddress.zipCode.message}</p>
                            )}
                          </div>
                        </div>
                      </fieldset>
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
                        className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-400 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
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

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <Dialog
            open={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
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
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 p-5 text-white flex justify-between items-center">
                    <Dialog.Title className="text-xl font-bold">
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </Dialog.Title>
                    <button
                      onClick={() => setIsProductModalOpen(false)}
                      className="p-1 rounded-full hover:bg-black/10 transition"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="p-6">
                    <div className="space-y-5">
                      <div>
                        <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                        <input
                          type="text"
                          id="product-name"
                          {...productForm.register("name", { required: "Product name is required" })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                        />
                        {productForm.formState.errors.name && (
                          <p className="text-red-500 text-xs mt-2">{productForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          id="product-description"
                          {...productForm.register("description")}
                          rows="3"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                          placeholder="Detailed description of the product..."
                        ></textarea>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                          <input
                            type="number"
                            id="product-price"
                            step="0.01"
                            {...productForm.register("price", { required: "Price is required", valueAsNumber: true, min: { value: 0, message: "Price cannot be negative" } })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                          />
                          {productForm.formState.errors.price && (
                            <p className="text-red-500 text-xs mt-2">{productForm.formState.errors.price.message}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                          <input
                            type="number"
                            id="product-stock"
                            step="1"
                            {...productForm.register("stock", { required: "Stock is required", valueAsNumber: true, min: { value: 0, message: "Stock cannot be negative" } })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                          />
                          {productForm.formState.errors.stock && (
                            <p className="text-red-500 text-xs mt-2">{productForm.formState.errors.stock.message}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="product-image-url" className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                        <input
                          type="text"
                          id="product-image-url"
                          {...productForm.register("imageUrl")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 transition"
                          placeholder="e.g., https://example.com/product-image.jpg"
                        />
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setIsProductModalOpen(false)}
                        className="px-5 py-2.5 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={submittingChanges}
                        className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-400 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                      >
                        {submittingChanges ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        {editingProduct ? "Update Product" : "Add Product"}
                      </motion.button>
                    </div>
                  </form>
                </Dialog.Panel>
              </motion.div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Product Deletion */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={handleDeleteProductConfirm}
        onCancel={handleDeleteProductCancel}
      />
    </div>
  );
};

export default VendorProfile;
