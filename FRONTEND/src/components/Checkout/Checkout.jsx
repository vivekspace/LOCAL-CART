import React, { useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from "../../Context/Context";
import { toast, ToastContainer } from "react-toastify"; // Keep ToastContainer if you render it here
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

const Checkout = () => {
  const {
    cartItems: cart,
    user,
    token, // Token is now correctly received from AuthContext after fix
    selectedLocation,
  } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- Address States ---
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); // Stores ID of address being edited

  // --- Form Data State ---
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    street: "", // Consistent with backend property
    apartment: "", // Consistent with backend property
    city: "",
    zipCode: "", // Consistent with backend property
    email: user?.email || "", // Pre-fill if user exists
    state: "Maharashtra", // Default state
  });

  // --- UI / Loading States ---
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [isSubmitting, setIsSubmitting] = useState(false); // For "Continue to Payment"
  const [isSavingAddress, setIsSavingAddress] = useState(false); // For Add/Edit Address Form submission
  const [isDeletingAddress, setIsDeletingAddress] = useState(false); // For Delete Address action

  // --- Derived Values ---
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  const shippingCost = shippingMethod === "express" ? 100 : 50;
  const totalPrice = subtotal + shippingCost;

  // --- Helper to prefill form fields from an address object (Memoized) ---
  // Using useCallback because it's a dependency of useEffect for fetching addresses
  const prefillFormWithAddress = useCallback((address) => {
    if (!address) return;

    const nameParts = address.name ? address.name.split(" ") : [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    setFormData({
      firstname: firstName,
      lastname: lastName,
      phone: address.phone || "",
      street: address.street || "", // Maps to address.street
      apartment: address.apartment || "", // Maps to address.apartment
      city: address.city || "",
      zipCode: address.zipCode || "", // Maps to address.zipCode
      email: user?.email || "",
      state: address.state || "Maharashtra",
    });
  }, [user?.email]); // Dependency on user.email for email pre-fill

  // --- Effects ---

  // Effect to populate form from selectedLocation (geolocation) for NEW addresses
  useEffect(() => {
   
    if (
      showAddressForm && // The address form is visible
      !editingAddressId && // Not currently editing an existing address
      selectedLocation && // Geolocation data is available
      selectedLocation.type === "current_location" && // It's specifically a current location
      selectedLocation.city && // And it has a city
      selectedLocation.city.toLowerCase() !== "current location" // Avoid placeholder city names
    ) {
      setFormData((prev) => ({
        ...prev,
        city:
          selectedLocation.city.charAt(0).toUpperCase() +
          selectedLocation.city.slice(1),
        state: "Maharashtra", // Assuming this is always true for your current location. Adjust if needed.
      }));
      toast.info(
        `New address form pre-filled with "${selectedLocation.city}" from your current location.`
      );
    }
  }, [selectedLocation, showAddressForm, editingAddressId]); // Dependencies

  // Effect to fetch saved addresses on component mount or when user/token changes
  useEffect(() => {
    console.log("Starting address fetch...");
    const fetchAddresses = async () => {
      try {
        console.log(
          "Fetch addresses called with user:",
          !!user,
          "token:",
          !!token
        );
        if (!user || !token) {
          console.log("No user or token, showing guest form");
          setIsFetchingAddresses(false);
          setShowAddressForm(true); // Always show form for guest users
          // For guests, attempt to pre-fill from geolocation if available
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
              state: "Maharashtra",
            }));
          } else {
            // Ensure email is set even for guests if user object is available (e.g., from a partial guest session)
            setFormData((prev) => ({
              ...prev,
              email: user?.email || prev.email,
            }));
          }
          return;
        }

        console.log(
          "Fetching from URL:",
          `${import.meta.env.VITE_API_URL}/api/users/me/addresses`
        );
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/me/addresses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
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
          setShowAddressForm(false);
        } else {
          setShowAddressForm(true);
          // Only prefill email if user is logged in
          setFormData((prev) => ({
            ...prev,
            email: user?.email || prev.email,
          }));
          // Pre-fill city from geolocation if no addresses exist
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
              state: "Maharashtra",
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast.error("Failed to load saved addresses");
        setShowAddressForm(true);
        // Pre-fill city from geolocation on error as well
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
            state: "Maharashtra",
          }));
        }
      } finally {
        setIsFetchingAddresses(false);
      }
    };

    fetchAddresses();
  }, [user, token, selectedLocation, prefillFormWithAddress]); // prefillFormWithAddress is now stable due to useCallback

  // --- Handlers ---

  // Handle selection of a saved address (radio button click)
  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    const selectedAddress = savedAddresses.find(
      (addr) => addr._id === addressId
    );
    if (selectedAddress) {
      prefillFormWithAddress(selectedAddress);
      setShowAddressForm(false); // Hide the form if an existing address is selected
      setEditingAddressId(null); // Clear editing state
    }
  };

  // Handle "Add New" button click
  const handleAddNewAddress = () => {
    setSelectedAddressId(""); // Deselect any chosen address
    setEditingAddressId(null); // Ensure no address is in editing mode
    setShowAddressForm(true); // Show the blank form
    // Clear form data for a fresh start, pre-filling email and potential geolocation city
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
      state: "Maharashtra",
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

  // Handle "Edit" icon click for a saved address
  const handleEditAddress = (address) => {
    setEditingAddressId(address._id); // Set the ID of the address being edited
    setSelectedAddressId(address._id); // Keep this address selected
    setShowAddressForm(true); // Show the form
    prefillFormWithAddress(address); // Populate the form with the address data
  };

  // Handle deleting an address
  const handleDeleteAddress = async (addressId) => {
    if (!user || !token) {
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
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSavedAddresses((prev) =>
          prev.filter((addr) => addr._id !== addressId)
        );
        toast.success("Address deleted successfully");

        // If the deleted address was the selected one, unselect it and show the form
        if (selectedAddressId === addressId) {
          setSelectedAddressId("");
          // If there are other addresses, select the first one; otherwise, show the form
          if (savedAddresses.length - 1 > 0) { // Check if any addresses left
              setSelectedAddressId(savedAddresses[0]._id);
              prefillFormWithAddress(savedAddresses[0]);
              setShowAddressForm(false);
          } else {
              setShowAddressForm(true);
              handleAddNewAddress(); // Re-initialize form for a new address
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: "No error body" }));
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
    if (!user || !token) {
      toast.error("You must be logged in to set a default address.");
      return;
    }

    try {
      // Assuming your backend expects a PATCH to /api/users/me/addresses/:id/default
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/me/addresses/${addressId}/default`,
        {
          method: "PATCH", // Or "PUT" if your API uses that
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Often needed for PATCH/PUT
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
        const errorData = await response.json().catch(() => ({ message: "No error body" }));
        console.error("Failed to set default address API response:", response.status, errorData);
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
    if (!formData.street) errors.push("Address line 1 (Street) is required"); // Updated message
    if (!formData.city) errors.push("City is required");
    if (!formData.zipCode) errors.push("Pincode is required"); // Updated message
    if (!formData.email) errors.push("Email is required");

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      errors.push("Phone number must be 10 digits");
    }

    // Corrected to zipCode as per formData state
    if (formData.zipCode && !/^[0-9]{6}$/.test(formData.zipCode)) {
      errors.push("Pincode (Zip Code) must be 6 digits"); // Updated message
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
    if (!user || !token) {
      toast.error("You must be logged in to save addresses.");
      return false; // Prevent saving for guests this way
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
        isDefault: savedAddresses.length === 0, // Only set as default if it's the first address
      };

      const url = editingAddressId
        ? `${import.meta.env.VITE_API_URL}/api/users/me/addresses/${editingAddressId}`
        : `${import.meta.env.VITE_API_URL}/api/users/me/addresses`;

      const method = editingAddressId ? "PUT" : "POST"; // Use PUT for update, POST for create

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "No error body" }));
        throw new Error(errorData.message || "Failed to save address from server.");
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
    // Ensure you use the correct properties from the address object
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

    // If the address form is shown (meaning it's a new address or an edited one),
    // and the user is logged in, save it first.
    if (user && token && showAddressForm) {
      const saved = await handleSaveAddress();
      if (!saved) {
        setIsSubmitting(false);
        return;
      }
    }
    // Handle guest users or when a new address was just added/edited by a logged-in user
    // The `selectedAddressId` should now be set if a new address was just saved.

    let finalAddressForOrder = null;
    if (selectedAddressId) {
        finalAddressForOrder = savedAddresses.find(addr => addr._id === selectedAddressId);
    }

    // If no saved/selected address (e.g., guest user filling form)
    if (!finalAddressForOrder && showAddressForm && !user) { // Only create temp if guest and form is shown
        finalAddressForOrder = {
            _id: "temp-" + Date.now(),
            name: `${formData.firstname} ${formData.lastname}`.trim(),
            street: formData.street, // Corrected field name
            apartment: formData.apartment, // Corrected field name
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode, // Corrected field name
            phone: formData.phone,
            isDefault: true,
        };
        // No need to setSavedAddresses for temp, it's just for this order session
    }

    if (!finalAddressForOrder) {
        toast.error("Please select or add a shipping address.");
        setIsSubmitting(false);
        return;
    }


    const orderData = {
      customerDetails: {
        firstName: finalAddressForOrder.name.split(" ")[0], // Extract from full name
        lastName: finalAddressForOrder.name.split(" ").slice(1).join(" "), // Extract from full name
        phone: finalAddressForOrder.phone,
        addressLine1: finalAddressForOrder.street, // Use street from the selected/final address
        addressLine2: finalAddressForOrder.apartment, // Use apartment from the selected/final address
        city: finalAddressForOrder.city,
        pincode: finalAddressForOrder.zipCode, // Use zipCode from the selected/final address
        email: formData.email.toLowerCase().trim(), // Email from form data
        state: finalAddressForOrder.state,
      },
      cartItems: cart.map((item) => ({
        productId: item._id, // Use item._id consistently
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        // Ensure seller/vendor ID is correctly passed based on your product structure
        seller: item.seller?._id || item.vendorId || item.sellerId,
      })),
      shippingMethod,
      totalPrice: totalPrice,
      orderDate: new Date().toISOString(),
    };

    navigate("/payment", {
      state: {
        orderData,
        formData: orderData.customerDetails, // Pass the processed customerDetails
      },
    });
    setIsSubmitting(false);
  };
  return (
    <div className="bg-gray-50 min-h-screen py-8">
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
                            value={formData.name}
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
                        {user && token && (
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
                          <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 h-12 w-12 flex-shrink-0 mr-3">
                            <img
                              src={`${import.meta.env.VITE_API_URL}/uploads/${
                                item.images[0]
                              }`}
                              alt={item.name}
                              className="w-full h-full object-cover"
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
