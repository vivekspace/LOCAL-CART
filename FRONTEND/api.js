// src/api.js
import axios from 'axios';

// Update your API base URL configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
});

// Add a request interceptor to include the auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// admin auth 

export const loginAdmin = (credentials) => API.post('/admin/login', credentials);
export const getAdminProfile = () => API.get('/admin/profile');

export const register = (userData) => API.post('/auth/register', userData);

export const login = (credentials) => API.post('/auth/login', credentials);

// // products

export const getProducts = () => API.get('/products/shopping');
export const createProduct = (productData) => API.post('/products', productData);
export const updateProduct = (id, productData) => API.put(`/admin/products/${id}`, productData);
export const deleteProduct = (id) => API.delete(`/admin/products/${id}`);

//orders

export const getOrders = (params) => API.get('/admin/orders', { params });
export const updateOrderStatus = (id, status) => API.patch(`/admin/orders/${id}`, { status });


//vendor

export const getVendors = (params) => API.get('/admin/vendors', { params });
export const approveVendor = (id) => API.patch(`/admin/vendors/${id}/approve`);
export const rejectVendor = (id) => API.patch(`/admin/vendors/${id}/reject`);


//customer

export const getCustomers = (params) => API.get('/admin/customers', { params });
