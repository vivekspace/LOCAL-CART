import React, { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import mongoose from "mongoose";
import axios from "axios";
import { AuthContext } from "../../Context/Context";
import {
  CreditCard,
  ShieldCheck,
  Lock,
  ArrowLeft,
  CheckCircle,
  Banknote,
  Wallet,
} from "lucide-react";
import {
  SiAmericanexpress,
  SiApplepay,
  SiCashapp,
  SiGooglepay,
  SiMastercard,
  SiPaypal,
  SiVisa,
} from "react-icons/si";
import { Link } from "react-router-dom";

const PaymentPage = () => {
  const { cartItems: contextCartItems, clearCart } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // 3. State Initialization
  const { orderData, formData } = location.state || {};
  const cartItems = orderData?.cartItems || contextCartItems || [];

  // 4. Payment State Management
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [bankReceipt, setBankReceipt] = useState(null);

  // 5. Card Details State
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });

  const [cardErrors, setCardErrors] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });

  // 6. Payment Methods Configuration
  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: <CreditCard size={18} />,
      color: "blue",
      description: "Pay with Visa, Mastercard, etc.",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: <SiPaypal size={18} />,
      color: "blue",
      description: "Pay with your PayPal account",
    },
    {
      id: "googlepay",
      name: "Google Pay",
      icon: <SiGooglepay size={18} />,
      color: "gray",
      description: "Fast checkout with Google Pay",
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      icon: <Banknote size={18} />,
      color: "green",
      description: "Direct bank transfer",
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: <SiCashapp size={18} />,
      color: "purple",
      description: "Pay when you receive your order",
    },
    // ... other payment methods
  ];

  // 7. Order Calculations
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  const shippingCost = orderData?.shippingMethod === "express" ? 9.99 : 0;
  const tax = totalPrice * 0.08;
  const finalTotal = totalPrice + tax + shippingCost;

  // 8. Card Validation
  const validateCard = () => {
    const errors = {};
    const cleanNumber = cardDetails.number.replace(/\s/g, "");

    if (!cleanNumber.match(/^\d{16}$/)) {
      errors.number = "Invalid card number (16 digits required)";
    }
    // ... other validations
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 9. Data Validation Effect
  useEffect(() => {
    if (!orderData || !formData || !cartItems.length) {
      toast.error("Missing order information. Redirecting to checkout...");
      navigate("/checkout");
    }
  }, [orderData, formData, cartItems, navigate]);

  // 10. Input Formatting
  const formatCardNumber = (value) =>
    value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
  const formatExpiry = (value) =>
    value.replace(/\D/g, "").replace(/(\d{2})(?=\d)/g, "$1/");

  // 11. Main Payment Handler
  const handlePayment = async () => {

    // Validation checks
    if (!orderData || !formData || !cartItems.length) {
      toast.error("Missing order information");
      return;
    }

    if (selectedPayment === "card" && !validateCard()) {
      toast.error("Please fix card errors");
      return;
    }

    setIsProcessing(true);

    try {
      const paymentResult = await processPaymentMethod(selectedPayment);
      const orderResponse = await createOrder(paymentResult, "processing");

      // Vendor notification (non-blocking)
     
      clearCart();
      navigate("/order-confirmation", {
        state: { orderId: orderResponse.orderId },
      });
    } catch (error) {
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 12. Payment Processors
  const processPaymentMethod = async (method) => {
    switch (method) {
      case "card":
        return {
          method: "card",
          status: "paid",
          transactionId: `card_${Date.now()}`,
          last4: cardDetails.number.replace(/\s/g, "").slice(-4),
        };
      case "paypal":
        // Simulate PayPal payment success
        return {
          method: "paypal",
          status: "paid",
          transactionId: `paypal_${Date.now()}`,
        };
      case "googlepay":
        // Simulate Google Pay payment success
        return {
          method: "googlepay",
          status: "paid",
          transactionId: `googlepay_${Date.now()}`,
        };
      case "bank_transfer":
        // Simulate bank transfer (pending verification)
        return {
          method: "bank_transfer",
          status: "pending",
          transactionId: `bank_${Date.now()}`,
        };
      case "cod":
        // Cash on Delivery (unpaid)
        return {
          method: "cod",
          status: "pending",
          transactionId: `cod_${Date.now()}`,
        };
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  };

  // 13. Vendor ID Extraction (Improved)
  const getVendorId = (item) => {
    // Handle all possible vendor ID locations
    const seller = item.seller;

    if (typeof seller === "object" && seller !== null) {
      return seller._id || seller.id;
    }

    if (typeof seller === "string") {
      // Handle case where seller is already an ID
      if (mongoose.Types.ObjectId.isValid(seller)) {
        return seller;
      }
      // Handle stringified objects
      try {
        const parsed = JSON.parse(seller);
        return parsed._id || parsed.id;
      } catch {
        return null;
      }
    }

    return item.vendor?.id || item.vendorId || null;
  };

  // 14. Order Creation
  const createOrder = async (paymentResult, orderStatus) => {
    const orderPayload = {
      customerDetails: {
        ...formData,
        email: formData.email.toLowerCase().trim(),
      },
      cartItems: cartItems.map((item) => ({
        productId: item.productId || item._id || item.id,
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price,
        vendorId: getVendorId(item),
        seller: getVendorId(item), // Consistent vendor ID handling
      })),
      paymentDetails: {
        method: paymentResult.method,
        status: paymentResult.status,
        amount: finalTotal,
        transactionId: paymentResult.transactionId,
      },
      shipping: {
        method: orderData?.shippingMethod || "standard",
        cost: shippingCost,
        address: {
          line1: formData.addressLine1,
          line2: formData.addressLine2 || "",
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
      },
      pricing: {
        subtotal: totalPrice,
        tax,
        shipping: shippingCost,
        total: finalTotal,
      },
      orderStatus,
    };

    const response = await axios.post(
      "http://localhost:5000/api/orders",
      orderPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    return response.data;
  };



  // Loading state
  if (!orderData || !formData || !cartItems.length) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header and progress indicator */}
        <header className="mb-8">
          <div className="flex items-center">
            <Link to="/checkout" className="mr-4">
              <button className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-100 transition">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Payment</h1>
          </div>
          <div className="flex items-center mt-6">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={`flex-1 h-1 rounded-full ${
                    step < 3 ? "bg-green-500" : "bg-gray-200"
                  }`}
                ></div>
                <div className="mx-4 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step < 3
                        ? "bg-green-500"
                        : step === 3
                        ? "bg-blue-500"
                        : "bg-gray-200"
                    }`}
                  >
                    {step < 3 ? (
                      <CheckCircle size={16} className="text-white" />
                    ) : (
                      <span
                        className={`font-medium ${
                          step === 3 ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {step}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      step < 3
                        ? "text-green-600"
                        : step === 3
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step === 1 ? "Cart" : step === 2 ? "Details" : "Payment"}
                  </span>
                </div>
              </React.Fragment>
            ))}
            <div className="flex-1 h-1 bg-gray-200 rounded-full"></div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
                <h2 className="font-medium text-gray-700">Payment Method</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`border rounded-lg p-4 hover:border-${
                        method.color
                      }-500 transition cursor-pointer ${
                        selectedPayment === method.id
                          ? `border-${method.color}-500 bg-${method.color}-50`
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full bg-${method.color}-50 flex items-center justify-center text-${method.color}-500 mr-4`}
                        >
                          {method.icon}
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-medium">{method.name}</h3>
                          <p className="text-sm text-gray-500">
                            {method.description}
                          </p>
                        </div>
                        {selectedPayment === method.id && (
                          <CheckCircle className="text-green-500" size={18} />
                        )}
                      </div>

                      {/* Payment method specific forms */}
                      {selectedPayment === method.id && (
                        <div className="mt-4">
                          {method.id === "card" && (
                            <CardPaymentForm
                              cardDetails={cardDetails}
                              setCardDetails={setCardDetails}
                              cardErrors={cardErrors}
                              formatCardNumber={formatCardNumber}
                              formatExpiry={formatExpiry}
                            />
                          )}

                          {method.id === "bank_transfer" && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium mb-2">Bank Details</h4>
                              <div className="text-sm space-y-1 mb-3">
                                <p>Bank Name: LocalCart Bank</p>
                                <p>Account Name: LocalCart Stores</p>
                                <p>Account Number: 1234567890</p>
                                <p>IFSC Code: LOCAL12345</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Upload Payment Receipt *
                                </label>
                                <input
                                  type="file"
                                  className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-green-50 file:text-green-700
                                    hover:file:bg-green-100"
                                  onChange={(e) =>
                                    setBankReceipt(e.target.files[0])
                                  }
                                  accept="image/*,.pdf"
                                />
                              </div>
                            </div>
                          )}

                          {method.id === "cod" && (
                            <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-700">
                              You'll need to pay ${finalTotal.toFixed(2)} when
                              you receive your order. An additional $5
                              processing fee may apply.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Billing Address Section */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-700">
                      Billing Address
                    </h3>
                    <button className="text-sm text-green-600 hover:underline">
                      + Add new address
                    </button>
                  </div>
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="billing"
                      id="same"
                      className="mt-1 mr-3"
                      defaultChecked
                    />
                    <label htmlFor="same" className="flex-grow">
                      <span className="block font-medium">
                        Same as shipping address
                      </span>
                      <span className="block text-sm text-gray-500">
                        {formData.addressLine1}
                        {formData.addressLine2 &&
                          `, ${formData.addressLine2}`}, {formData.city},{" "}
                        {formData.state} - {formData.pincode}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
                <h2 className="font-medium text-gray-700">Order Notes</h2>
              </div>
              <div className="p-6">
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition min-h-[100px]"
                  placeholder="Add special instructions for your order..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md sticky top-4 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="font-medium text-gray-700">Order Summary</h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div
                      key={item.id || item._id || index}
                      className="flex justify-between items-start"
                    >
                      <div className="flex items-center">
                        <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 h-12 w-12 flex-shrink-0 mr-3">
                          <img
                            src={
                              item.images && item.images.length > 0
                                ? `http://localhost:5000/uploads/${item.images[0]}`
                                : "http://localhost:5000/uploads/default-product.png"
                            }
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src =
                                "http://localhost:5000/uploads/default-product.png"; // Full URL from backend
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
                      <span
                        className={`font-medium ${
                          shippingCost === 0 ? "text-green-600" : ""
                        }`}
                      >
                        {shippingCost === 0
                          ? "Free"
                          : `$${shippingCost.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Taxes</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total</span>
                      <span className="font-bold text-lg text-gray-800">
                        ${finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handlePayment();
                    console.log("Payment button clicked");
                  }}
                  disabled={isProcessing}
                  className={`w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center font-medium transition ${
                    isProcessing ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={18} className="mr-2" />
                      Complete Order
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
                  <ShieldCheck size={14} className="mr-1 text-green-600" />
                  Secure checkout
                </div>

                <div className="mt-4 text-xs text-gray-500 text-center">
                  By completing your purchase you agree to our{" "}
                  <a href="#" className="text-green-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-green-600 hover:underline">
                    Privacy Policy
                  </a>
                  .
                </div>
              </div>
            </div>

            {/* Payment Security Section */}
            <div className="bg-white rounded-xl shadow-md mt-4 p-6">
              <h3 className="font-medium text-gray-700 mb-4">
                Payment Security
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <Lock size={16} />
                  </div>
                  <span className="text-gray-600">
                    All transactions are encrypted and secure
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <CheckCircle size={16} />
                  </div>
                  <span className="text-gray-600">
                    PCI compliant payment processing
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="text-gray-600">
                    We never store your payment details
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
            <p className="mb-4">Your order #{orderId} has been confirmed.</p>
            <p className="text-sm text-gray-500">
              You'll receive an email confirmation shortly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Card Payment Form Component
const CardPaymentForm = ({
  cardDetails,
  setCardDetails,
  cardErrors,
  formatCardNumber,
  formatExpiry,
}) => {
  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({
      ...prev,
      [name]:
        name === "number"
          ? formatCardNumber(value).trim()
          : name === "expiry"
          ? formatExpiry(value)
          : value,
    }));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card number
        </label>
        <input
          name="number"
          value={cardDetails.number}
          onChange={handleCardChange}
          maxLength={19}
          className={`w-full px-4 py-2 border ${
            cardErrors.number ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition`}
          placeholder="1234 5678 9012 3456"
        />
        {cardErrors.number && (
          <p className="text-red-500 text-xs mt-1">{cardErrors.number}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiration date
          </label>
          <input
            name="expiry"
            value={cardDetails.expiry}
            onChange={handleCardChange}
            maxLength={5}
            className={`w-full px-4 py-2 border ${
              cardErrors.expiry ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition`}
            placeholder="MM/YY"
          />
          {cardErrors.expiry && (
            <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Security code
          </label>
          <div className="relative">
            <input
              name="cvc"
              value={cardDetails.cvc}
              onChange={handleCardChange}
              maxLength={4}
              className={`w-full px-4 py-2 border ${
                cardErrors.cvc ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition`}
              placeholder="CVC"
            />
            <div className="absolute right-3 top-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          {cardErrors.cvc && (
            <p className="text-red-500 text-xs mt-1">{cardErrors.cvc}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name on card
        </label>
        <input
          name="name"
          value={cardDetails.name}
          onChange={handleCardChange}
          className={`w-full px-4 py-2 border ${
            cardErrors.name ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition`}
          placeholder="Full name"
        />
        {cardErrors.name && (
          <p className="text-red-500 text-xs mt-1">{cardErrors.name}</p>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
