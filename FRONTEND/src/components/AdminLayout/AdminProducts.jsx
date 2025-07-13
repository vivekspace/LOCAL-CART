import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../Context/Context';
// API_BASE_URL is generally handled by authAxios configuration
// so it's less critical to define it here explicitly for authenticated calls.
// However, for image URLs, we might still need it if not served by authAxios.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminProducts() {
    const { jwtToken, authAxios, isAuthLoading, adminSignOut } = useAuth(); // Destructure from AuthContext

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true); // Manages product fetching specific loading
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Initial check for authentication status and token presence
    useEffect(() => {
        // If auth is no longer loading and there's no JWT token, it means the user is not authenticated
        if (!isAuthLoading && !jwtToken) {
            console.warn("AdminProducts: JWT token not found. Redirecting to login.");
            setError("Admin token required to view products. Please ensure you are logged in.");
            // Rely on AuthContext's interceptor for actual logout, but navigate proactively
            navigate('/admin/login');
        }
        // When auth is done loading, set component's initial loading state
        if (!isAuthLoading) {
            setLoading(false); // Authentication state is settled
        }
    }, [isAuthLoading, jwtToken, navigate]);

    // Fetch products function, now using authAxios
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Use authAxios which already has Authorization header set
            const response = await authAxios.get('/api/admin/products');
            
            // Axios throws for non-2xx statuses, so no need for response.data.success check
            setProducts(response.data.products);
        } catch (err) {
            console.error('Error fetching products:', err);
            // AuthContext's interceptor should handle 401 and global logout
            setError(err.response?.data?.message || 'Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [authAxios]); // Dependency is authAxios

    // Effect to fetch products when authentication is ready and token is present
    useEffect(() => {
        if (!isAuthLoading && jwtToken) {
            fetchProducts();
        }
    }, [isAuthLoading, jwtToken, fetchProducts]);

    const handleEditProduct = useCallback((productId) => {
        navigate(`/admin/products/edit/${productId}`);
    }, [navigate]);

    const handleDeleteProduct = useCallback(async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) {
            return;
        }
        const originalProducts = products;
        setProducts(prevProducts => prevProducts.filter(p => p._id !== productId));
        setError(null);
        try {
            // Use authAxios for deletion
            await authAxios.delete(`/api/admin/products/${productId}`);
            toast.success("Product deleted successfully!");
        } catch (err) {
            console.error('Error deleting product:', err);
            setError(err.response?.data?.message || 'Failed to delete product. Please try again.');
            setProducts(originalProducts); // Revert on error
            // AuthContext's interceptor should handle 401 and global logout
        }
    }, [products, authAxios]);

    const handleViewProduct = useCallback((productId) => {
        navigate(`/admin/products/view/${productId}`);
    }, [navigate]);

    const handleAddProduct = useCallback(() => {
        navigate('/admin/products/new');
    }, [navigate]);

    // Combined loading state for initial authentication check and product fetching
    if (loading || isAuthLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700">Loading products...</p>
                    <p className="text-sm text-gray-500">
                        LocalCart is crunching the numbers
                    </p>
                </div>
            </div>
        );
    }

    // Error display (including if token is missing after initial auth check)
    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Error:</p>
                    <p>{error}</p>
                </div>
                {(!jwtToken && !isAuthLoading) && ( // Show login button if no token and auth check is complete
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => navigate('/admin/login')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="lg:md:text-3xl text-2xl font-bold text-gray-800">Product Management</h1>
                <button
                    onClick={handleAddProduct}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
                >
                    <PlusCircle size={20} className="mr-2" /> Add New Product
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.length > 0 ? (
                                products.map(product => (
                                    <tr key={product._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <img
                                                src={product.images && product.images.length > 0 ? `${API_BASE_URL}/uploads/${product.images[0]}` : 'default-product.png'}
                                                alt={product.name}
                                                className="w-12 h-auto object-cover rounded-md"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = `${API_BASE_URL}/uploads/default-product.png`;
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{product.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{product.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    onClick={() => handleViewProduct(product._id)}
                                                    className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                    title="View Product"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditProduct(product._id)}
                                                    className="p-2 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                                                    title="Edit Product"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product._id)}
                                                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center text-gray-600">No products found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}