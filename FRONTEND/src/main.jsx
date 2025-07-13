import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layout and Components
import Layout from "./Layout.jsx";
import Home from "./components/Home/Home.jsx";
import Login from "./components/Login/Login.jsx";
import Register from "./components/Register/Register.jsx";
import Shopping from "./components/Shopping/Shopping.jsx";
import ProductCardPage from "./components/ProductInfo/ProductInfo.jsx";
import Cart from "./components/Cart/Cart.jsx";
import Checkout from "./components/Checkout/Checkout.jsx";
import PaymentPage from "./components/Payment/Payment.jsx";
import OrderConfirmation from "./components/OrderConfirmed/OrderConfirm.jsx";
import UserDashboard from "./components/UserDashboard/UserDashboard.jsx";
import UserProfile from "./components/UserProfile/UserProfile.jsx";
import Reward from "./components/Reward/Reward.jsx";
import Orders from "./components/Orders/Orders.jsx";
import OrderedItemsPage from "./components/CustomerOrders/CustomerOrders.jsx";
import VendorDashboard from "./components/VendorDashboard/VendorDashboard.jsx";
import VendorProductsPage from "./components/VendorProducts/VendorProducts.jsx";
import VendorSellPage from "./components/VendorSellPage/VendorSellPage.jsx";
import VendorAnalytics from "./components/VendorAnalytics/VendorAnalytics.jsx";
import VendorProfile from "./components/VendorProfile/VendorProfile.jsx";
import VendorMessagesPage from "./components/VendorMessage/VendorMessage.jsx";
import AdminPanel from "./components/AdminPanel/AdminPanel.jsx";
import UserManagement from "./components/AdminLayout/UserManagement.jsx";
import AdminProducts from "./components/AdminLayout/AdminProducts.jsx";
import AdminOrdersPage from "./components/AdminOrders/AdminOrders.jsx";
import EditProductPage from "./components/AdminLayout/EditProductPage.jsx";
import AddProductPage from "./components/AdminLayout/AddProductPage.jsx";
import ProductViewPage from "./components/AdminLayout/ProductViewPage.jsx";
import UserDetailPage from "./components/AdminLayout/UserDetailPage.jsx";
import AdminSettingsPage from "./components/AdminLayout/AdminSetting.jsx";
import VendorLogin from "./components/VendorLogin/VendorLogin.jsx";
import VendorRegister from "./components/VendorRegister/VendorRegister.jsx";
import AdminLogin from "./components/AdminLogin/AdminLogin.jsx";
import ContactUs from "./components/ContactUs/ContactUs.jsx";
import AboutUsPage from "./components/AboutUs/AboutUs.jsx";
import NotFoundPage from "./components/PageNotFound/PageNotFound.jsx";
import AccountSettings from "./components/AccountSetting/AccountSetting.jsx";
import AuthProvider from "/src/Context/Context.jsx";
import RoleBasedRoute from "./components/RoleBasedRoute/RoleBasedRoute.jsx";
import VendorOrderPage from "./components/VendorOrder/VendorOrder.jsx";
import AdminVendorsPage from "./components/VendorListPage/VendorListPage.jsx";
import Landing from "./components/Landing/Landing.jsx";
import VendorApplicationPage from './components/VendorApplicationPage/VendorApplicationPage.jsx'

// Define your router object
// Your routes are already correctly defined here.
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      {/* Public Routes */}
      <Route index element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="shopping" element={<Shopping />} />
      <Route path="product-info/:productId" element={<ProductCardPage />} />
      <Route path="contact-us" element={<ContactUs />} />
      <Route path="about-us" element={<AboutUsPage />} />

      {/* Auth Routes */}
      <Route path="vendor/login" element={<VendorLogin />} />
      <Route path="vendor/register" element={<VendorRegister />} />
      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="vendor/application/form" element={<VendorApplicationPage />} />

      {/* Customer Protected Routes */}
      <Route
        element={
          <RoleBasedRoute allowedRoles={["customer"]} redirectPath="/login" />
        }
      >
        <Route path="account" element={<AccountSettings />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="order-confirmation" element={<OrderConfirmation />} />
        <Route path="user-dashboard" element={<UserDashboard />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="rewards" element={<Reward />} />
        <Route path="orders" element={<Orders />} />
        <Route path="landing" element={<Landing/>}/>
        <Route path="orders/:orderId" element={<OrderedItemsPage />} />
      </Route>

      {/* Vendor Protected Routes */}
      <Route
        element={
          <RoleBasedRoute
            allowedRoles={["seller"]}
            redirectPath="/vendor/login"
          />
        }
      >
        <Route path="vendor">
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="sell" element={<VendorSellPage />} />
          <Route path="products" element={<VendorProductsPage />} />
          <Route path="order" element={<VendorOrderPage />} />
          <Route path="analytics" element={<VendorAnalytics />} />
          <Route path="profile" element={<VendorProfile />} />
          <Route path="messages" element={<VendorMessagesPage />} />
        </Route>
      </Route>

      {/* Admin Protected Routes */}
      <Route
        element={
          <RoleBasedRoute
            allowedRoles={["admin"]}
            redirectPath="/admin/login"
          />
        }
      >
        <Route path="admin">
          <Route path="panel" element={<AdminPanel />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="users/edit/:id" element={<UserDetailPage />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="vendors" element={<AdminVendorsPage/>}/>
          <Route path="products/new" element={<AddProductPage />} />
          <Route path="products/edit/:id" element={<EditProductPage />} />
          <Route path="products/view/:id" element={<ProductViewPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
        </Route>
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  )
);

// The main App component where all providers are wrapped
function MainApp() {
  return (
    <StrictMode>
      <HelmetProvider>
        <AuthProvider> {/* ✅ AuthProvider wraps RouterProvider */}
          <RouterProvider router={router} />
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
          {/* <ScrollToTop /> */}
        </AuthProvider>
      </HelmetProvider>
    </StrictMode>
  );
}


// Render the MainApp
createRoot(document.getElementById("root")).render(<MainApp />);