import React, { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import {
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShoppingCartIcon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";

const VendorProfile = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [favorite, setFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cart, setCart] = useState([]);

  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("token")); // Assuming token is stored in localStorage

        // adjust based on your storage
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/vendors/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setVendor(res.data.vendor);
      } catch (err) {
        console.error("Error fetching vendor profile:", err);
      }
    };

    fetchProfile();
  }, []);

  if (!vendor) return <p>Loading...</p>;

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === vendor.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? vendor.images.length - 1 : prevIndex - 1
    );
  };

  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <StarIcon
          key={i}
          className={`w-5 h-5 ${
            i < rating ? "text-yellow-400" : "text-gray-300"
          }`}
        />
      ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vendor Header */}
      <div className="relative bg-gradient-to-r from-green-600 to-green-800 text-white py-12 px-4 sm:px-6 lg:px-8 rounded-b-2xl shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400"></div>

        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="relative group">
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
              alt={vendor.name}
              className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
            />
            <button
              onClick={() => setFavorite(!favorite)}
              className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md hover:scale-110 transition-transform"
            >
              <HeartIcon
                className={`w-6 h-6 ${
                  favorite ? "text-red-500 fill-current" : "text-gray-400"
                }`}
              />
            </button>
          </div>

          <div className="text-center mt-6">
            <h1 className="text-3xl font-bold">{vendor.name}</h1>
            <span className="inline-block bg-yellow-400 text-gray-800 px-4 py-1 rounded-full text-sm font-semibold mt-2">
              {vendor.category}
            </span>

            <div className="flex items-center justify-center mt-3">
              <MapPinIcon className="w-5 h-5 mr-1" />
              <span>{vendor.location}</span>
            </div>

            <div className="flex items-center justify-center mt-2">
              <div className="flex mr-2">{renderStars(vendor.rating)}</div>
              <span>
                {vendor.rating} ({vendor.reviewCount} reviews)
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-lg">{vendor.bio}</p>

            <div className="flex gap-4 justify-center mt-6">
              <button className="bg-white text-green-700 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-md">
                Contact Vendor
              </button>
              <button className="border-2 border-white px-6 py-2 rounded-full font-semibold hover:bg-white hover:text-green-700 transition-colors">
                Visit Store
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="max-w-4xl mx-auto mt-8 relative">
        <div className="relative h-64 md:h-80 rounded-xl overflow-hidden shadow-lg">
          <img
            src={vendor.images[currentImageIndex]}
            alt="Vendor showcase"
            className="w-full h-full object-cover"
          />
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {vendor.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentImageIndex
                    ? "bg-white"
                    : "bg-white bg-opacity-50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("products")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "products"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "about"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "reviews"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Reviews
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "products" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendor.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-green-600 font-bold mt-1">
                      ${product.price}/{product.unit}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      In stock: {product.stock}
                    </p>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                    >
                      <ShoppingCartIcon className="w-5 h-5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "about" && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">About {vendor.name}</h2>
              <p className="mb-6">{vendor.bio}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <PhoneIcon className="w-5 h-5 text-green-600 mr-2" />
                      <span>{vendor.contact.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <EnvelopeIcon className="w-5 h-5 text-green-600 mr-2" />
                      <span>{vendor.contact.email}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="w-5 h-5 text-green-600 mr-2" />
                      <span>{vendor.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Business Hours</h3>
                  <p>{vendor.hours}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-6">
              {vendor.reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{review.user}</h3>
                      <div className="flex items-center mt-1">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-500">
                          {review.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Indicator (fixed at bottom) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded-full shadow-xl hover:bg-green-700 transition-colors cursor-pointer">
          <div className="relative">
            <ShoppingCartIcon className="w-8 h-8" />
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cart.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProfile;
