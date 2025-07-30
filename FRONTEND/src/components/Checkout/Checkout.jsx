import React, { useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from "../../Context/Context"; // Ensure this path is correct
import { toast, ToastContainer } from "react-toastify"; 
import {
  CreditCard,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  CheckCircle,
  Truck,
  Plus,
  Edit3,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async"; 

const Checkout = () => {
  // Destructure user, jwtToken, isAuthLoading, cartItems, and selectedLocation directly
  const {
    cartItems: cart,
    user,
    jwtToken, // Changed from 'token' to 'jwtToken'
    isAuthLoading, // Added isAuthLoading for better control
    selectedLocation,
  } = useContext(AuthContext);
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); 

  // --- Form Data State ---
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    street: "", 
    apartment: "",
    city: "",
    zipCode: "", 
    email: user?.email || "", // Initialize email from user context
    state: "Maharashtra", 
  });

  const [shippingMethod, setShippingMethod] = useState("standard");
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isSavingAddress, setIsSavingAddress] = useState(false); 
  const [isDeletingAddress, setIsDeletingAddress] = useState(false); 

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  const shippingCost = shippingMethod === "express" ? 100 : 50;
  const totalPrice = subtotal + shippingCost;

  // Memoized function to prefill the form with address data
  const prefillFormWithAddress = useCallback(
    (address) => {
      if (!address) return;

      const nameParts = address.name ? address.name.split(" ") : [];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setFormData({
        firstname: firstName,
        lastname: lastName,
        phone: address.phone || "",
        street: address.street || "", 
        apartment: address.apartment || "", 
        city: address.city || "",
        zipCode: address.zipCode || "", 
        email: user?.email || "", // Keep user's email if available
        state: address.state || "Maharashtra",
      });
    },
    [user?.email] // Depend on user.email to re-create if user changes
  ); 
  
  // Effect to pre-fill city/state if location is detected and no address is being edited/selected
  useEffect(() => {
    if (
      showAddressForm && 
      !editingAddressId && 
      selectedLocation && 
      selectedLocation.type === "current_location" && 
      selectedLocation.city && 
      selectedLocation.city.toLowerCase() !== "current location" // Avoid placeholder string
    ) {
      setFormData((prev) => ({
        ...prev,
        city:
          selectedLocation.city.charAt(0).toUpperCase() +
          selectedLocation.city.slice(1),
        state: selectedLocation.state || "Maharashtra", // Use selectedLocation.state if available
      }));
    }
  }, [selectedLocation, showAddressForm, editingAddressId]); 

  // Main effect to fetch and manage addresses on component mount/user change
  useEffect(() => {
    const fetchAddresses = async () => {
      // Wait for AuthContext to finish loading
      if (isAuthLoading) {
        console.log("Checkout: Auth is loading, deferring address fetch.");
        return;
      }

      setIsFetchingAddresses(true);
      try {
        console.log(
          "Fetch addresses called with user:",
          !!user,
          "jwtToken:",
          !!jwtToken
        );

        // If user is not logged in, show the address form for guest checkout
        if (!user || !jwtToken) {
          console.log("No user or jwtToken, showing guest form");
          setShowAddressForm(true); 
          // Pre-fill email if user object exists (even if not fully authenticated)
          setFormData((prev) => ({
            ...prev,
            email: user?.email || prev.email,
          }));
          // Pre-fill city/state from selectedLocation if available for guests
          if (
            selectedLocation &&
            selectedLocation.type === "current_location" &&
            selectedLocation.city
          ) {
            setFormData((prev) => ({
              ...prev,
              city:
                selectedLocation.city.charAt(0).toUpperCase() +
                selectedLocation.city.slice(1),
              state: selectedLocation.state || "Maharashtra",
            }));
          }
          return; // Exit as there's no authenticated data to fetch
        }

        // If user is logged in, fetch their saved addresses
        console.log(
          "Fetching from URL:",
          `${import.meta.env.VITE_API_URL}/api/users/me/addresses`
        );
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/me/addresses`,
          {
            headers: {
              Authorization: `Bearer ${jwtToken}`, // Use jwtToken here
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response status:", response.status);
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "No error body" }));
          console.error("API response not OK:", response.status, errorData);
          // If 401, AuthContext should handle logout/redirect, otherwise toast error
          if (response.status !== 401) {
            toast.error(errorData.message || "Failed to fetch addresses");
          }
          throw new Error(errorData.message || "Failed to fetch addresses");
        }

        const data = await response.json();
        console.log("Address data is: -", data);

        if (data.data?.addresses?.length > 0) {
          setSavedAddresses(data.data.addresses);
          const defaultAddress =
            data.data.addresses.find((addr) => addr.isDefault) ||
            data.data.addresses[0];
          setSelectedAddressId(defaultAddress._id);
          prefillFormWithAddress(defaultAddress); // Use the memoized function
          setShowAddressForm(false); // Hide the form as saved addresses are available
        } else {
          // No saved addresses, show the form for a new address
          setShowAddressForm(true);
          // Pre-fill email and location data for new address form
          setFormData((prev) => ({
            ...prev,
            email: user?.email || prev.email,
          }));
          if (
            selectedLocation &&
            selectedLocation.type === "current_location" &&
            selectedLocation.city
          ) {
            setFormData((prev) => ({
              ...prev,
              city:
                selectedLocation.city.charAt(0).toUpperCase() +
                selectedLocation.city.slice(1),
              state: selectedLocation.state || "Maharashtra",
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        // If an error occurs (e.g., network, or API error not handled by 401),
        // default to showing the form for manual input.
        toast.error("Failed to load saved addresses. Please enter manually.");
        setShowAddressForm(true);
        // Attempt to pre-fill from location even on error
        if (
          selectedLocation &&
          selectedLocation.type === "current_location" &&
          selectedLocation.city
        ) {
          setFormData((prev) => ({
            ...prev,
            city:
              selectedLocation.city.charAt(0).toUpperCase() +
              selectedLocation.city.slice(1),
            state: selectedLocation.state || "Maharashtra",
          }));
        }
      } finally {
        setIsFetchingAddresses(false);
      }
    };

    fetchAddresses();
  }, [user, jwtToken, isAuthLoading, selectedLocation, prefillFormWithAddress]); 

  // --- Handlers ---

  // Handle selection of a saved address (radio button click)
  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    const selectedAddress = savedAddresses.find(
      (addr) => addr._id === addressId
    );
    if (selectedAddress) {
      prefillFormWithAddress(selectedAddress);
      setShowAddressForm(false); 
      setEditingAddressId(null); 
    }
  };

  const handleAddNewAddress = () => {
    setSelectedAddressId("");
    setEditingAddressId(null); 
    setShowAddressForm(true);
    setFormData({
      firstname: "",
      lastname: "",
      phone: "",
      street: "",
      apartment: "",
      city:
        selectedLocation?.type === "current_location" && selectedLocation?.city
          ? selectedLocation.city.charAt(0).toUpperCase() +
            selectedLocation.city.slice(1)
          : "",
      zipCode: "",
      email: user?.email || "",
      state: selectedLocation?.state || "Maharashtra", // Pre-fill state from location
    });
    if (
      selectedLocation &&
      selectedLocation.type === "current_location" &&
      selectedLocation.city
    ) {
      toast.info(
        `New address form pre-filled with "${selectedLocation.city}" from current location.`
      );
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address._id); 
    setSelectedAddressId(address._id); // Ensure this address is selected
    setShowAddressForm(true); 
    prefillFormWithAddress(address); 
  };

  const handleDeleteAddress = async (addressId) => {
    if (!user || !jwtToken) { // Use jwtToken
      toast.error("You must be logged in to delete addresses.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      setIsDeletingAddress(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/me/addresses/${addressId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Use jwtToken
          },
        }
      );

      if (response.ok) {
        setSavedAddresses((prev) =>
          prev.filter((addr) => addr._id !== addressId)
        );
        toast.success("Address deleted successfully");

        // After deletion, re-select an address or show add form
        if (selectedAddressId === addressId) {
          setSelectedAddressId("");
          if (savedAddresses.length - 1 > 0) { // Check if there are remaining addresses
            const remainingAddresses = savedAddresses.filter(addr => addr._id !== addressId);
            const newSelected = remainingAddresses.find(addr => addr.isDefault) || remainingAddresses[0];
            if (newSelected) {
              setSelectedAddressId(newSelected._id);
              prefillFormWithAddress(newSelected);
              setShowAddressForm(false);
            } else {
              // No addresses left after deletion
              setShowAddressForm(true);
              handleAddNewAddress(); // Show empty form
            }
          } else {
            // No addresses left after deletion
            setShowAddressForm(true);
            handleAddNewAddress(); // Show empty form
          }
        }
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "No error body" }));
        toast.error(errorData.message || "Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    } finally {
      setIsDeletingAddress(false);
    }
  };

  // Set default address
  const handleSetDefaultAddress = async (addressId) => {
    if (!user || !jwtToken) { // Use jwtToken
      toast.error("You must be logged in to set a default address.");
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/users/me/addresses/${addressId}/default`,
        {
          method: "PATCH", 
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Use jwtToken
            "Content-Type": "application/json", 
          },
        }
      );
      console.log("Set default address response:", response);

      if (response.ok) {
        setSavedAddresses((prev) =>
          prev.map((addr) => ({
            ...addr,
            isDefault: addr._id === addressId, // Set clicked address to default, others to false
          }))
        );
        setSelectedAddressId(addressId); // Ensure the newly defaulted address is selected
        toast.success("Default address updated successfully!");
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "No error body" }));
        console.error(
          "Failed to set default address API response:",
          response.status,
          errorData
        );
        toast.error(errorData.message || "Failed to set default address");
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error("Failed to set default address due to network error.");
    }
  };

  // Standard form field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Form validation
  const validateForm = () => {
    const errors = [];

    if (!formData.firstname) errors.push("First name is required");
    if (!formData.lastname) errors.push("Last name is required");
    if (!formData.phone) errors.push("Phone number is required");
    if (!formData.street) errors.push("Address line 1 (Street) is required"); 
    if (!formData.city) errors.push("City is required");
    if (!formData.zipCode) errors.push("Pincode is required"); 
    if (!formData.email) errors.push("Email is required");

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      errors.push("Phone number must be 10 digits");
    }

    if (formData.zipCode && !/^[0-9]{6}$/.test(formData.zipCode)) {
      errors.push("Pincode (Zip Code) must be 6 digits"); 
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Invalid email format");
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return false;
    }

    return true;
  };

  // Save address (new or edit)
  const handleSaveAddress = async () => {
    if (!validateForm()) return false;
    // Only allow saving address if user is logged in
    if (!user || !jwtToken) { 
      toast.error("You must be logged in to save addresses.");
      return false; 
    }

    try {
      setIsSavingAddress(true);
      const addressData = {
        name: `${formData.firstname} ${formData.lastname}`.trim(),
        street: formData.street,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        phone: formData.phone,
        // Set as default if it's the first address OR if it's being edited and was already default
        // Or if it's the only address being saved/updated
        isDefault: savedAddresses.length === 0 || (editingAddressId && savedAddresses.find(addr => addr._id === editingAddressId)?.isDefault) || (!editingAddressId && savedAddresses.length === 0)
      };

      const url = editingAddressId
        ? `${
            import.meta.env.VITE_API_URL
          }/api/users/me/addresses/${editingAddressId}`
        : `${import.meta.env.VITE_API_URL}/api/users/me/addresses`;

      const method = editingAddressId ? "PUT" : "POST"; // Use PUT for update, POST for create

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`, // Use jwtToken
        },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "No error body" }));
        throw new Error(
          errorData.message || "Failed to save address from server."
        );
      }

      const data = await response.json();
      const savedAddress = data.data.address;

      if (editingAddressId) {
        setSavedAddresses((prev) =>
          prev.map((addr) =>
            addr._id === editingAddressId ? savedAddress : addr
          )
        );
        toast.success("Address updated successfully!");
      } else {
        setSavedAddresses((prev) => [...prev, savedAddress]);
        toast.success("Address saved successfully!");
      }

      setSelectedAddressId(savedAddress._id); // Select the newly saved/updated address
      setShowAddressForm(false); // Hide the form
      setEditingAddressId(null); // Clear editing state
      return true; // Indicate success
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(error.message || "Failed to save address");
      return false; // Indicate failure
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Format full address for display
  const formatFullAddress = (address) => {
    return [
      address.street,
      address.apartment,
      address.city,
      address.state,
      address.zipCode,
    ]
      .filter(Boolean)
      .join(", ");
  };

  // Handle form submission and navigation to payment
  const handleContinueToPayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (cart.length === 0) {
      toast.error("Your cart is empty. Please add items before checking out.");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    // If the address form is shown AND the user is logged in, save it first.
    // Guests' addresses are not saved permanently at this step.
    if (user && jwtToken && showAddressForm) { // Use jwtToken here
      const saved = await handleSaveAddress();
      if (!saved) {
        setIsSubmitting(false);
        return;
      }
    }

    let finalAddressForOrder = null;
    if (selectedAddressId) {
      finalAddressForOrder = savedAddresses.find(
        (addr) => addr._id === selectedAddressId
      );
    } else if (showAddressForm) { // If no address selected but form is shown (newly entered or guest)
      
      finalAddressForOrder = {
        _id: "temp-" + Date.now(), // Temporary ID for guest orders
        name: `${formData.firstname} ${formData.lastname}`.trim(),
        street: formData.street,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode, 
        phone: formData.phone,
        isDefault: true, // Mark as default for this order
      };
    }

    if (!finalAddressForOrder) {
      toast.error("Please select or add a shipping address.");
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      customerDetails: {
        firstname: formData.firstname, 
        lastname: formData.lastname, 
        phone: formData.phone, 
        email: formData.email.toLowerCase().trim(), 
      },
      shippingAddress: {
        name: `${formData.firstname} ${formData.lastname}`.trim(), 
        street: formData.street,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        zip: formData.zipCode, // Use zipCode here from formData
        country: finalAddressForOrder.country || "India", // Use country from finalAddressForOrder or default
      },
      cartItems: cart.map((item) => ({
        productId: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        seller: item.seller?._id || item.vendorId || item.sellerId,
      })),
      shippingMethod, 
      subtotal: subtotal,
      shippingCost: shippingCost,
      tax: 0,
      discount: 0,
      totalAmount: totalPrice,
    };

    console.log("Order Data being sent to payment:", orderData);

    navigate("/payment", {
      state: {
        orderData: orderData, 
        formData: {
          customerName: `${orderData.customerDetails.firstname} ${orderData.customerDetails.lastname}`,
          customerEmail: orderData.customerDetails.email,
          customerPhone: orderData.customerDetails.phone,
          shippingAddressFull: formatFullAddress(orderData.shippingAddress), 
        },
      },
    });
    setIsSubmitting(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <Helmet>
        <title>Checkout - Complete Your Order | Your Store Name</title>
        <meta
          name="description"
          content={`Proceed to checkout with ${cart.length} items totaling ₹${totalPrice.toFixed(2)}. Manage shipping addresses and select delivery options.`}
        />
        
      </Helmet>
      <ToastContainer position="top-center" />
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-8">
          <div className="flex items-center">
            <Link to="/cart" className="mr-4">
              <button className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-100 transition">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
          </div>
          <div className="flex items-center mt-6">
            <div className="flex-1 h-1 bg-green-500 rounded-full"></div>
            <div className="mx-4 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle size={16} className="text-white" />
              </div>
              <span className="text-xs mt-1 text-green-600 font-medium">
                Cart
              </span>
            </div>
            <div className="flex-1 h-1 bg-green-500 rounded-full"></div>
            <div className="mx-4 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white font-medium">2</span>
              </div>
              <span className="text-xs mt-1 text-green-600 font-medium">
                Details
              </span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 rounded-full"></div>
            <div className="mx-4 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 font-medium">3</span>
              </div>
              <span className="text-xs mt-1 text-gray-500">Payment</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 rounded-full"></div>
          </div>
        </header>

        <form
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          onSubmit={handleContinueToPayment}
        >
          <div className="lg:col-span-2">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
                <h2 className="font-medium text-gray-700">
                  Contact Information
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    placeholder="your@email.com"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="newsletter"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="newsletter"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Email me with news and offers
                  </label>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
                <h2 className="font-medium text-gray-700">Shipping Address</h2>
              </div>
              <div className="p-6">
                {/* Loading State */}
                {isFetchingAddresses && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-gray-600 mt-2">
                      Loading saved addresses...
                    </p>
                  </div>
                )}

                {/* Saved Addresses List */}
                {!isFetchingAddresses &&
                  savedAddresses.length > 0 &&
                  !showAddressForm && (
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">
                          Select Address
                        </h3>
                        <button
                          type="button"
                          onClick={handleAddNewAddress}
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                        >
                          <Plus size={16} className="mr-1" />
                          Add New
                        </button>
                      </div>
                      {savedAddresses.map((address) => (
                        <div
                          key={address._id}
                          className={`border rounded-lg p-4 cursor-pointer transition ${
                            selectedAddressId === address._id
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleAddressSelect(address._id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h4 className="font-medium text-gray-800">
                                  {address.name}
                                </h4>
                                {address.isDefault && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-2">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatFullAddress(address)}
                              </p>
                              {address.phone && (
                                <p className="text-sm text-gray-600">
                                  Phone: {address.phone}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAddress(address);
                                }}
                                className="text-blue-600 hover:text-blue-700 p-1"
                                title="Edit address"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAddress(address._id);
                                }}
                                className="text-red-600 hover:text-red-700 p-1"
                                disabled={isDeletingAddress}
                                title="Delete address"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          {!address.isDefault && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefaultAddress(address._id);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                            >
                              Set as default
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                {/* Address Form */}
                {!isFetchingAddresses &&
                  (showAddressForm || savedAddresses.length === 0) && (
                    <div>
                      {savedAddresses.length > 0 && (
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-700">
                            {editingAddressId ? "Edit Address" : "New Address"}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddressId(null);
                              if (savedAddresses.length > 0) {
                                handleAddressSelect(savedAddresses[0]._id);
                              }
                            }}
                            className="text-gray-600 hover:text-gray-700 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First name
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                            name="firstname"
                            value={formData.firstname}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last name
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                            name="lastname"
                            value={formData.lastname}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                          placeholder="Street and number, P.O. Box, c/o"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apartment, suite, etc. (optional)
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                          name="apartment"
                          onChange={handleChange}
                          value={formData.apartment}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            disabled
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pincode
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                          placeholder="+91 XXXXXXXXXX"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          For delivery questions only
                        </p>
                      </div>

                      <div className="flex justify-between">
                        {user && jwtToken && ( // Only show save button if logged in
                          <button
                            type="button"
                            onClick={handleSaveAddress}
                            disabled={isSavingAddress}
                            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {isSavingAddress
                              ? "Saving..."
                              : editingAddressId
                              ? "Update Address"
                              : "Save Address"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Shipping Method */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
                <h2 className="font-medium text-gray-700">Shipping Method</h2>
              </div>
              <div className="p-6">
                <div
                  onClick={() => setShippingMethod("standard")}
                  className={`flex items-center justify-between p-4 border rounded-lg transition cursor-pointer mb-3 ${
                    shippingMethod === "standard"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <Truck size={20} className="text-green-600 mr-3" />
                    <div>
                      <h3 className="font-medium">Standard Shipping</h3>
                      <p className="text-sm text-gray-600">3-5 business days</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">₹50.00</span>
                </div>

                <div
                  onClick={() => setShippingMethod("express")}
                  className={`flex items-center justify-between p-4 border rounded-lg transition cursor-pointer ${
                    shippingMethod === "express"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <Truck size={20} className="text-gray-600 mr-3" />
                    <div>
                      <h3 className="font-medium">Express Shipping</h3>
                      <p className="text-sm text-gray-600">1-2 business days</p>
                    </div>
                  </div>
                  <span className="font-medium">₹100.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md sticky top-4 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="font-medium text-gray-700">Order Summary</h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {cart &&
                    cart.map((item) => (
                      <div
                        key={item.id || item._id}
                        className="flex justify-between items-start"
                      >
                        <div className="flex items-center">
                          <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 h-12 w-12 flex-shrink-0 mr-3 flex items-center justify-center">
                            <img
                              src={item.images[0]?.url}
                              alt={item.name}
                              className="w-full h-auto object-cover"
                              onError={(e) => {
                                e.target.src = `${
                                  import.meta.env.VITE_API_URL
                                }/uploads/default-product.png`;
                                e.target.onerror = null;
                              }}
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-800">
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity || 1}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium">
                          ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}

                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        ₹{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-green-600 font-medium">
                        {shippingMethod === "express"
                          ? `₹${shippingCost.toFixed(2)}`
                          : "Free"}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium text-gray-700">
                      <span>Taxes</span>
                      <span>Calculated at next step</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total</span>
                      <span className="font-bold text-lg text-gray-800">
                        ₹{totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || isSavingAddress}
                  className={`w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center font-medium transition ${
                    isSubmitting || isSavingAddress
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-green-700"
                  }`}
                >
                  <CreditCard size={16} className="mr-2" />
                  {isSubmitting
                    ? "Processing..."
                    : isSavingAddress
                    ? "Saving Address..."
                    : "Continue to Payment"}
                </button>
                <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
                  <ShieldCheck size={14} className="mr-1 text-green-600" />
                  Secure checkout
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md mt-4 p-6">
              <h3 className="font-medium text-gray-700 mb-4">Need Help?</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-600">Call us: +91 9876543210</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-600">
                    Email: localcart@example.com
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <MapPin size={16} />
                  </div>
                  <span className="text-gray-600">Find a store near you</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
