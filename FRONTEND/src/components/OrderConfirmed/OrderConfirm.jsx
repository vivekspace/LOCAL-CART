import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, ShoppingBag, Home, Printer } from "react-feather";
import { toast } from "react-toastify";

const OrderConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { orderId, paymentDetails, amount } = state || {};
  console.log(orderId, paymentDetails , amount)
  

  // Redirect if accessed without order data
  useEffect(() => {
    if (!orderId) {
      toast.error("Invalid order access");
      navigate("/");
    }
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden w-full max-w-md">
        {/* Header */}
        <div className="bg-green-100 p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Order Confirmed!</h1>
          <p className="text-gray-600 mt-2">
            Thank you for your purchase
          </p>
        </div>

        {/* Order Details */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID</span>
                <span className="font-mono text-gray-800">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="capitalize text-gray-800">{paymentDetails?.method || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Paid</span>
                <span className="font-bold text-gray-800">${amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-green-800 mb-2">What's next?</h3>
            <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
              <li>Order confirmation sent to your email</li>
              <li>Seller will process your items within 24 hours</li>
              <li>Tracking number will be provided via email</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => navigate("/orders")}
              className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
            >
              <ShoppingBag className="w-5 h-5" />
              View My Orders
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 transition"
            >
              <Home className="w-5 h-5" />
              Continue Shopping
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition"
            >
              <Printer className="w-5 h-5" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;