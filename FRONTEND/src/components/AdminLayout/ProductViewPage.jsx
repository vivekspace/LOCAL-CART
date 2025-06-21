import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Edit } from "lucide-react"; // Icons

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProductViewPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setAdminToken(token);
    } else {
      navigate("/admin/login");
    }
  }, [navigate]);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (!adminToken || !id) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/admin/products/${id}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        if (response.data.success) {
          setProduct(response.data.product);
        } else {
          throw new Error(
            response.data.message || "Failed to fetch product details."
          );
        }
      } catch (err) {
        console.error("Error fetching product for view:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load product details. Please try again."
        );
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminInfo");
          navigate("/admin/login");
        } else if (err.response && err.response.status === 404) {
          setError("Product not found.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, adminToken, navigate]);

 if (isLoading || !adminToken) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading your analytics...</p>
          <p className="text-sm text-gray-500">
            LocalCart is crunching the numbers
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
        {!adminToken && (
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/admin/login")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-700">
        Product not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Changed flex-row to flex-col and added responsive classes */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <h1 className="lg:md:text-3xl text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          {/* Added mb-4 for margin on small screens */}
          Product Details: {product.name}
        </h1>
        {/* Wrapped buttons in a div and added spacing/stacking for small screens */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <Link
            to={`/admin/products/edit/${product._id}`}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
          >
            <Edit size={20} className="mr-2" /> Edit Product
          </Link>
          <button
            onClick={() => navigate("/admin/products")}
            className="flex items-center justify-center px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75"
          >
            <ArrowLeft size={20} className="mr-2" /> Back to Products
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Images */}
          <div className="md:col-span-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Images</h2>
            <div className="flex flex-wrap gap-2 lg:md:gap-4">
              {product.images && product.images.length > 0 ? (
                product.images.map((img, index) => (
                  <img
                    key={index}
                    src={`${API_BASE_URL}/uploads/${img}`}
                    alt={`${product.name} - ${index + 1}`}
                    className="lg:md:w-32 lg:md:h-32 h-20 w-20 object-cover rounded-md shadow-sm"
                    onError={(e) =>
                      (e.target.src = `${API_BASE_URL}/uploads/default-product.png`)
                    }
                  />
                ))
              ) : (
                <img
                  src="/uploads/default-product.png"
                  alt="No product image"
                  className="w-32 h-32 object-cover rounded-md shadow-sm border border-gray-200"
                />
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="md:col-span-1 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name:</p>
              <p className="text-lg font-semibold text-gray-900">
                {product.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Description:</p>
              <p className="text-gray-800">{product.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Price:</p>
                <p className="text-lg font-semibold text-gray-900">
                  ₹{product.price.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Stock:</p>
                <p className="text-lg font-semibold text-gray-900">
                  {product.stock}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Category:</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {product.category}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Brand:</p>
                <p className="text-lg font-semibold text-gray-900">
                  {product.brand || "N/A"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created At:</p>
              <p className="text-gray-800">
                {new Date(product.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated:</p>
              <p className="text-gray-800">
                {new Date(product.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}