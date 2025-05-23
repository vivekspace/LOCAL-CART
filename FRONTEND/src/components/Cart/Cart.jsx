import React, { useContext, useEffect } from "react";
import { AuthContext } from "../../Context/Context";
import {
  ShoppingBag,
  Truck,
  Trash2,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { Link } from "react-router-dom";

const CartPage = () => {
  const { cartItems, setCartItems } = useContext(AuthContext);
  console.log(cartItems);

  useEffect(() => {
    const consolidatedCart = consolidateCartItems(cartItems);

    if (JSON.stringify(consolidatedCart) !== JSON.stringify(cartItems)) {
      setCartItems(consolidatedCart);
    }
  }, []);

  // Function to consolidate duplicate items
  const consolidateCartItems = (items) => {
    const uniqueItems = {};

    // Group items by id and sum their quantities
    items.forEach((item) => {
      const itemId = item.id;
      if (!uniqueItems[itemId]) {
        uniqueItems[itemId] = { ...item, quantity: item.quantity || 1 };
      } else {
        uniqueItems[itemId].quantity += item.quantity || 1;
      }
    });

    // Convert back to array
    return Object.values(uniqueItems);
  };

  const handleIncrease = (itemId) => {
    const updatedCart = cartItems.map((item) =>
      item.id === itemId
        ? { ...item, quantity: (item.quantity || 1) + 1 }
        : item
    );
    setCartItems(updatedCart);
  };

  const handleDecrease = (itemId) => {
    const updatedCart = cartItems.map((item) =>
      item.id === itemId && (item.quantity || 1) > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    setCartItems(updatedCart);
  };

  const handleRemove = (itemId) => {
    const updatedCart = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCart);
  };

  const totalPrice = cartItems.reduce((sum, item) => {
    const quantity = typeof item.quantity === "number" ? item.quantity : 1;
    return sum + (item.price || 0) * quantity;
  }, 0);

  const totalItems = cartItems.reduce(
    (total, item) =>
      total + (typeof item.quantity === "number" ? item.quantity : 1),
    0
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <ShoppingBag className="mr-3 text-green-600" />
            Your Shopping Cart
          </h1>
          <div className="h-1 w-80 bg-green-500 mt-2 rounded-full"></div>
        </header>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-10 text-center">
            <div className="inline-flex justify-center items-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-medium text-gray-700 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-6">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Link to={"/"}>
              <button className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition">
                <ArrowLeft size={18} className="mr-2" />
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Cart Items */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
                  <h2 className="font-medium text-gray-700">
                    Items ({cartItems.length})
                  </h2>
                </div>

                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 lg:md:p-6 flex items-center hover:bg-gray-50 transition"
                    >
                      <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 h-20 w-20 flex-shrink-0">
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

                      <div className="ml-6 flex-grow">
                        <h3 className="font-medium text-gray-800 text-lg">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Vendor: {item.seller}
                        </p>
                      </div>

                      <div className="flex flex-col items-end space-y-3">
                        <span className="font-bold text-green-600">
                          $
                          {((item.price || 0) * (item.quantity || 1)).toFixed(
                            2
                          )}
                        </span>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDecrease(item.id)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                          >
                            <span className="text-gray-600">−</span>
                          </button>

                          <span className="w-8 text-center font-medium">
                            {item.quantity || 1}
                          </span>

                          <button
                            onClick={() => handleIncrease(item.id)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                          >
                            <span className="text-gray-600">+</span>
                          </button>

                          <button
                            onClick={() => handleRemove(item.id)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-red-500 ml-2 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                  <Link to={"/"}>
                    <button className="flex items-center text-green-600 font-medium text-sm hover:underline">
                      <ArrowLeft size={16} className="mr-1" />
                      Continue Shopping
                    </button>
                  </Link>

                  <div className="text-sm text-gray-500">
                    {totalItems} items
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Total:</span>
                      <span className="font-medium">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Truck size={16} className="mr-2 text-green-600" />
                        <span className="text-gray-600">Shipping:</span>
                      </div>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">
                          Total:
                        </span>
                        <span className="font-bold text-lg text-gray-800">
                          ${totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link to={"/checkout"}>
                    <button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center font-medium transition">
                      <CreditCard size={18} className="mr-2" />
                      Proceed to Checkout
                    </button>
                  </Link>
                </div>
              </div>

              {/* Additional Benefits */}
              <div className="bg-white rounded-xl shadow-md mt-4 p-6">
                <h3 className="font-medium text-gray-700 mb-4">
                  Why Shop With Us
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                      <Truck size={16} />
                    </div>
                    <span className="text-gray-600">
                      Free shipping on orders over $35
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
                      Quality guaranteed products
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
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-600">
                      Secure payment options
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
