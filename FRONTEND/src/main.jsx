import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Layout from "./Layout.jsx";
import Home from "./components/Home/Home.jsx";
import Login from "./components/Login/Login.jsx";
import Register from "./components/Register/Register.jsx";
import Landing from "./components/Landing/Landing.jsx";
import Shopping from "./components/Shopping/Shopping.jsx";
import AccountSettings from "./components/AccountSetting/AccountSetting.jsx";
import ProductCardPage from "./components/ProductInfo/ProductInfo.jsx";
import Cart from "./components/Cart/Cart.jsx";
import Checkout from "./components/Checkout/Checkout.jsx";
import PaymentPage from "./components/Payment/Payment.jsx";
import VendorDashboard from "./components/VendorDashboard/VendorDashboard.jsx";
import UserDashboard from "./components/UserDashboard/UserDashboard.jsx";
import Reward from "./components/Reward/Reward.jsx";
import ContactUs from "./components/ContactUs/ContactUs.jsx";
import VendorApplication from "./components/AdminLayout/VendorApplication.jsx";
import UserManagement from "./components/AdminLayout/UserManagement.jsx";
import VendorSellPage from "./components/VendorSellPage/VendorSellPage.jsx";
import VendorLogin from "./components/VendorLogin/VendorLogin.jsx";
import VendorRegister from "./components/VendorRegister/VendorRegister.jsx";
import UserProfile from "./components/UserProfile/UserProfile.jsx";
import AdminPanel from "./components/AdminPanel/AdminPanel.jsx";
import AdminLogin from "./components/AdminLogin/AdminLogin.jsx";
import VendorProfile from "./components/VendorProfile/VendorProfile.jsx";
import NotFoundPage from "./components/PageNotFound/PageNotFound.jsx";
import OrderConfirmation from "./components/OrderConfirmed/OrderConfirm.jsx";
import AuthProvider from "/src/Context/Context.jsx";
import VendorProductsPage from "./components/VendorProducts/VendorProducts.jsx";
import VendorAnalytics from "./components/VendorAnalytics/VendorAnalytics.jsx";
import OrderPage from "./components/VendorOrder/VendorOrder.jsx";
import OrderedItemsPage from "./components/CustomerOrders/CustomerOrders.jsx";
import VendorsPage from "./components/VendorListPage/VendorListPage.jsx";
import Orders from "./components/Orders/Orders.jsx";
import UserDetailPage from "./components/AdminLayout/UserDetailPage.jsx";
import AdminProducts from "./components/AdminLayout/AdminProducts.jsx";
import EditProductPage from "./components/AdminLayout/EditProductPage.jsx";
import ProductViewPage from "./components/AdminLayout/ProductViewPage.jsx";
import AddProductPage from "./components/AdminLayout/AddProductPage.jsx";
import AdminSettingsPage from "./components/AdminLayout/AdminSetting.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Create a wrapper component for Layout that includes AuthProvider
const LayoutWithAuth = () => {
  return (
    <AuthProvider>
      <Layout />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      element={<LayoutWithAuth />}
      // errorElement={<NotFoundPage />} // Fallback error boundary
    >
      {/* Public Routes */}
      <Route index element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="landing" element={<Landing />} />
      <Route path="shopping" element={<Shopping />} />
      <Route path="product-info/:productId" element={<ProductCardPage />} />
      <Route path="contact" element={<ContactUs />} />
      
      {/* User Routes */}
      <Route path="account" element={<AccountSettings />} />
      <Route path="cart" element={<Cart />} />
      <Route path="checkout" element={<Checkout />} />
      <Route path="payment" element={<PaymentPage />} />
      <Route path="order-confirmation" element={<OrderConfirmation />} />
      <Route path="user-dashboard" element={<UserDashboard />} />
      <Route path="profile" element={<UserProfile />} />
      <Route path="rewards" element={<Reward />} />
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:orderId" element={<OrderedItemsPage />} />
      
      {/* Vendor Routes */}
      <Route path="vendor/login" element={<VendorLogin />} />
      <Route path="vendor/register" element={<VendorRegister />} />
      <Route path="vendor/dashboard" element={<VendorDashboard />} />
      <Route path="vendor/sell" element={<VendorSellPage />} />
      <Route path="vendor/products" element={<VendorProductsPage />} />
      <Route path="vendor/orders" element={<OrderPage />} />
      <Route path="vendor/analytics" element={<VendorAnalytics />} />
      <Route path="vendor/profile" element={<VendorProfile />} />
      
      {/* Admin Routes */}
      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="admin-panel" element={<AdminPanel />} />
      <Route path="admin/applications" element={<VendorApplication />} />
      <Route path="admin/users" element={<UserManagement />} />
      <Route path="admin/users/edit/:id" element={<UserDetailPage />} />
      <Route path="admin/vendors" element={<VendorsPage />} />
      <Route path="admin/products" element={<AdminProducts />} />
      <Route path="admin/products/new" element={<AddProductPage />} />
      <Route path="admin/products/edit/:id" element={<EditProductPage />} />
      <Route path="admin/products/view/:id" element={<ProductViewPage />} />
      <Route path="admin/settings" element={<AdminSettingsPage />} />
      
      {/* Fallback Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);