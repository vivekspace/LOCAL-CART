import React, { useContext } from "react";
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
import { SiPaypal } from "react-icons/si";
import { Link } from "react-router-dom";

const PaymentPage = () => {
  const { cartItems } = useContext(AuthContext);

  // Calculate total price
  const totalPrice = cartItems
    ? cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
    : 0;

  // Add estimated tax (for demo purposes)
  const tax = totalPrice * 0.08;
  const finalTotal = totalPrice + tax;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
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
            <div className="flex-1 h-1 bg-green-500 rounded-full"></div>
            <div className="mx-4 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle size={16} className="text-white" />
              </div>
              <span className="text-xs mt-1 text-green-600 font-medium">Cart</span>
            </div>
            <div className="flex-1 h-1 bg-green-500 rounded-full"></div>
            <div className="mx-4 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle size={16} className="text-white" />
              </div>
              <span className="text-xs mt-1 text-green-600 font-medium">Details</span>
            </div>
            <div className="flex-1 h-1 bg-green-500 rounded-full"></div>
            <div className="mx-4 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white font-medium">3</span>
              </div>
              <span className="text-xs mt-1 text-green-600 font-medium">Payment</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 rounded-full"></div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
                <h2 className="font-medium text-gray-700">Payment Method</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Credit Card Option */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition cursor-pointer">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mr-4">
                        <CreditCard size={18} />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium">Credit or Debit Card</h3>
                        <p className="text-sm text-gray-500">Pay with Visa, Mastercard, etc.</p>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-8 h-5 bg-gray-100 rounded-sm"></div>
                        <div className="w-8 h-5 bg-gray-100 rounded-sm"></div>
                        <div className="w-8 h-5 bg-gray-100 rounded-sm"></div>
                      </div>
                    </div>

                    {/* Credit Card Form (shown when selected) */}
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Card number
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiration date
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Security code
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
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
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name on card
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                          placeholder="Full name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PayPal Option */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition cursor-pointer">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mr-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 0 1-.794.679H7.72a.483.483 0 0 1-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502zm-2.96-5.09c.762.868.983 1.81.752 3.285-.019.123-.04.24-.062.36-.735 3.773-3.089 5.446-6.956 5.446H8.957c-.63 0-1.174.414-1.354 1.002l-.014-.002-.93 5.894H3.121a.051.051 0 0 1-.05-.06l2.598-16.51A.95.95 0 0 1 6.607 2h5.976c2.183 0 3.716.469 4.523 1.388z" />
                        </svg>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium">PayPal</h3>
                        <p className="text-sm text-gray-500">Pay with your PayPal account</p>
                      </div>
                      <div className="w-12 h-8 bg-gray-100 rounded-sm"></div>
                    </div>
                  </div>

                  {/* Bank Transfer Option */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition cursor-pointer">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 mr-4">
                        <Banknote size={18} />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium">Bank Transfer</h3>
                        <p className="text-sm text-gray-500">Direct bank transfer</p>
                      </div>
                      <div className="w-12 h-8 bg-gray-100 rounded-sm"></div>
                    </div>
                  </div>

                  {/* Digital Wallet Option */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-500 transition cursor-pointer">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 mr-4">
                        <Wallet size={18} />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium">Digital Wallet</h3>
                        <p className="text-sm text-gray-500">Apple Pay, Google Pay, etc.</p>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-8 h-5 bg-gray-100 rounded-sm"></div>
                        <div className="w-8 h-5 bg-gray-100 rounded-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-700">Billing address</h3>
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
                      <span className="block font-medium">Same as shipping address</span>
                      <span className="block text-sm text-gray-500">
                        123 Main St, Apt 4B, New York, NY 10001, United States
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

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

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md sticky top-4 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="font-medium text-gray-700">Order Summary</h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {cartItems &&
                    cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 h-12 w-12 flex-shrink-0 mr-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
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
                      <span className="font-medium">${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-green-600 font-medium">Free</span>
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

                <button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center font-medium transition">
                  <Lock size={18} className="mr-2" />
                  Complete Order
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

            <div className="bg-white rounded-xl shadow-md mt-4 p-6">
              <h3 className="font-medium text-gray-700 mb-4">Payment Security</h3>
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-600">
                    PCI compliant payment processing
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <div dangerouslySetInnerHTML={{ __html: SiPaypal.svg }} className="w-6 h-6" />

                  </div>
                  <span className="text-gray-600">
                    We never store your credit card details
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;