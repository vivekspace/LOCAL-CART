// frontend/src/pages/SellerOrderDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; // Or use fetch, ensure axios is installed (npm install axios)

const VendorOrderDetailsPage = () => {
    const { orderId } = useParams(); // Get the orderId from the URL (e.g., /seller/orders/60d5ec49f1f2c20015a9b7b3)
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                // Make sure your backend route for fetching order details is correct
                // This assumes your backend API is at /api and orders details is at /api/orders/:orderId
                const response = await axios.get(`/api/orders/${orderId}`, { withCredentials: true });
                setOrder(response.data); // Assuming your API returns { success: true, data: orderObject } or just orderObject
            } catch (err) {
                console.error('Error fetching order details:', err);
                setError('Failed to load order details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]); // Re-run effect if orderId changes

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-xl text-gray-700">Loading order details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-xl text-red-500">{error}</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-xl text-gray-500">Order not found.</p>
            </div>
        );
    }

    // Render your order details here
    // This is a basic example; you'll want to style this beautifully with Tailwind CSS
    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Order Details #{orderId.slice(-6).toUpperCase()}</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-3">Customer Information</h2>
                        <p><strong>Name:</strong> {order.customerDetails?.firstname} {order.customerDetails?.lastname}</p>
                        <p><strong>Email:</strong> {order.customerDetails?.email}</p>
                        <p><strong>Phone:</strong> {order.customerDetails?.phone}</p>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-3">Shipping Address</h2>
                        <p>{order.shippingAddress?.street}</p>
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}</p>
                        <p>{order.shippingAddress?.country}</p>
                    </div>
                </div>

                <h2 className="text-xl font-semibold text-gray-700 mb-3">Order Items</h2>
                <div className="overflow-x-auto mb-8">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Product</th>
                                <th className="py-3 px-6 text-center">Quantity</th>
                                <th className="py-3 px-6 text-right">Price</th>
                                <th className="py-3 px-6 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm font-light">
                            {order.cartItems.map((item) => (
                                <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-6 text-left">{item.name}</td>
                                    <td className="py-3 px-6 text-center">{item.quantity}</td>
                                    <td className="py-3 px-6 text-right">₹{item.price.toFixed(2)}</td>
                                    <td className="py-3 px-6 text-right">₹{(item.quantity * item.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end mb-8">
                    <div className="w-full md:w-1/2 bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between py-1"><span>Subtotal:</span><span>₹{order.subtotal?.toFixed(2) || '0.00'}</span></div>
                        <div className="flex justify-between py-1"><span>Shipping:</span><span>₹{order.shippingCost?.toFixed(2) || '0.00'}</span></div>
                        <div className="flex justify-between py-1"><span>Tax:</span><span>₹{order.tax?.toFixed(2) || '0.00'}</span></div>
                        <div className="flex justify-between py-1 text-lg font-bold border-t pt-2 mt-2">
                            <span>Total:</span><span>₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-sm text-gray-600"><strong>Status:</strong> <span className={`font-semibold ${order.status === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>{order.status}</span></p>
                    <p className="text-sm text-gray-600"><strong>Ordered On:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                </div>

                {/* Add buttons for changing status, printing, etc. here */}
            </div>
        </div>
    );
};

export default VendorOrderDetailsPage;