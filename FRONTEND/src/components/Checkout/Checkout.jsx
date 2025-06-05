import React, { useContext, useState } from "react";
import { AuthContext } from "../../Context/Context";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import {
  CreditCard,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  CheckCircle,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const { cartItems: cart } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    pincode: "",
    email: "",
    state: "Maharashtra",
  });

  const [shippingMethod, setShippingMethod] = useState("standard");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = shippingMethod === "express" ? 100 : 50;
  const totalPrice = subtotal + shippingCost;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      "firstname",
      "lastname",
      "phone",
      "addressLine1",
      "city",
      "pincode",
      "email",
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(
          `Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`
        );
        return false;
      }
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    // Phone validation
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }

    return true;
  };

  const handleContinueToPayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm() || cart.length === 0) {
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      customerDetails: {
        ...formData,
        email: formData.email.toLowerCase().trim(),
      },
      cartItems: cart.map((item) => ({
        productId: item.id || item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        seller: item.seller?._id || item.vendorId || item.sellerId,
      })),
      shippingMethod,
      totalPrice: subtotal + (shippingMethod === "express" ? 100 : 50),
      orderDate: new Date().toISOString(),
    };

    navigate("/payment", {
      state: {
        orderData,
        formData,
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

            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
                <h2 className="font-medium text-gray-700">Shipping Address</h2>
              </div>
              <div className="p-6">
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
                    Address
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    placeholder="Street and number, P.O. Box, c/o"
                    name="addressLine1"
                    value={formData.addressLine1}
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
                    name="addressLine2"
                    onChange={handleChange}
                    value={formData.addressLine2}
                    required
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
                      ZIP code
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      name="pincode"
                      value={formData.pincode}
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
                    placeholder="+1 (___) ___-____"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For delivery questions only
                  </p>
                </div>
                <label
                  className="text-sm font-semibold text-gray-700 "
                  htmlFor="email"
                >
                  Email Address *
                </label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  name="email"
                  required
                  pattern="[^@\s]+@[^@\s]+\.[^@\s]+" // Basic email validation
                />
                <small>For order confirmation and tracking</small>
              </div>
            </div>

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
                      : "border-gray-200 hover:border-gray-300 "
                  }`}
                >
                  <div className="flex items-center">
                    <Truck size={20} className="text-green-600 mr-3" />
                    <div>
                      <h3 className="font-medium">Standard Shipping</h3>
                      <p className="text-sm text-gray-600">3-5 business days</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">Free</span>
                </div>

                <div
                  onClick={() => setShippingMethod("express")}
                  className={`flex items-center justify-between p-4 border rounded-lg transition cursor-pointer ${
                    shippingMethod === "express"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300 "
                  }`}
                >
                  <div className="flex items-center">
                    <Truck size={20} className="text-gray-600 mr-3" />
                    <div>
                      <h3 className="font-medium">Express Shipping</h3>
                      <p className="text-sm text-gray-600">1-2 business days</p>
                    </div>
                  </div>
                  <span className="font-medium">$9.99</span>
                </div>
              </div>
            </div>
          </div>

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
                        key={item.id}
                        className="flex justify-between items-start"
                      >
                        <div className="flex items-center h">
                          <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 h-12 w-12 flex-shrink-0 mr-3">
                            <img
                              src={`${import.meta.env.VITE_API_URL}/uploads/${item.images[0]}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  `${import.meta.env.VITE_API_URL}/uploads/default-product.png`;
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
                          ${(item.price * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}

                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-green-600 font-medium">
                        {shippingMethod === "express" ? "$9.99" : "Free"}
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
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleContinueToPayment}
                  disabled={isSubmitting}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center font-medium transition"
                  type="submit"
                >
                  <CreditCard size={16} className="mr-2" />
                  Continue to Payment
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
                  <span className="text-gray-600">
                    Call us: +1 (555) 123-4567
                  </span>
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
