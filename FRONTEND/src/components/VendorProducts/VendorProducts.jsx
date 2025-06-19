import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiFilter } from "react-icons/fi";
import axios from "axios"; // or your preferred HTTP client
import { Link } from "react-router-dom";
import { Box, Boxes } from "lucide-react";

const VendorProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("vendorToken");
        if (!token) {
          setError("No token found. Please login again.");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/vendor/products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(response.data);
        console.log("Fetched products:", response.data.data);
        setProducts(response.data.data); // Note: your backend returns data in response.data.data
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "active" && product.stock > 0) ||
      (activeFilter === "out-of-stock" && product.stock <= 0);
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (productId) => {
    try {
      const token = localStorage.getItem("vendorToken"); // or however you're storing the token
      if (!token) {
        alert("No token found. Please login again.");
        return;
      }

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/vendor/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProducts(products.filter((product) => product._id !== productId));
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading your products...</p>
          <p className="text-sm text-gray-500">
            LocalCart is crunching the products
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap lg:md:justify-between items-center mb-8">
        <div className="flex justify-center  items-center gap-4 lg:md:mb-0 mb-2">
          <Box className="bg-green-600 text-white rounded-xl p-1" size={35} />
          <h1 className="text-3xl font-bold text-green-600">My Products</h1>
        </div>
        <Link
          to={"/vendor-sell"}
          className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition  w-full lg:md:w-auto"
        >
          <FiPlus className="mr-2 " />
          Add New Product
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative flex-grow max-w-md">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === "all"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-white border border-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("active")}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === "active"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-white border border-gray-300"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveFilter("out-of-stock")}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === "out-of-stock"
                ? "bg-red-100 text-red-700 border border-red-300"
                : "bg-white border border-gray-300"
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Product
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Stock
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 ">
                          <img
                            className="rounded-full object-cover "
                            src={
                              product.images?.[0]
                                ? `${import.meta.env.VITE_API_URL}/uploads/${
                                    product.images[0]
                                  }` // Construct full path
                                : `${
                                    import.meta.env.VITE_API_URL
                                  }/uploads/default-product.png`
                            }
                            alt={product.name}
                            onError={(e) => {
                              console.log(
                                "Image failed to load:",
                                e.target.src
                              );
                              e.target.src = `${
                                import.meta.env.VITE_API_URL
                              }/uploads/default-product.png`;
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.stock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.stock > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.stock > 0 ? "Active" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">
                        <FiEdit className="inline" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(product._id)}
                      >
                        <FiTrash2 className="inline" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No products found. Try adjusting your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-500">Total Products</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {products.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-500">Active Products</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {products.filter((p) => p.stock > 0).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-500">Out of Stock</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {products.filter((p) => p.stock <= 0).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorProductsPage;
