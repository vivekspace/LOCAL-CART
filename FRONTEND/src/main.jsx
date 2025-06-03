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
import VendorPage from "./components/VendorPage/VendorPage.jsx";
import VendorDashboard from "./components/VendorDashboard/VendorDashboard.jsx";
import UserDashboard from "./components/UserDashboard/UserDashboard.jsx";
import Reward from "./components/Reward/Reward.jsx";
import ContactUs from "./components/ContactUs/ContactUs.jsx";
// import AdminLayout from "./components/AdminLayout/AdminLayout.jsx";
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
import UserRow from "./components/AdminLayout/UserRow.jsx";
import VendorProductsPage from "./components/VendorProducts/VendorProducts.jsx";
import VendorAnalytics from "./components/VendorAnalytics/VendorAnalytics.jsx";
import OrderPage from "./components/VendorOrder/VendorOrder.jsx";
// import Dashboard from "./components/AdminLayout/Dashboard.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route path="" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/shopping" element={<Shopping />} />
      <Route path="/account" element={<AccountSettings />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/product-info/:productId" element={<ProductCardPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/vendors" element={<VendorPage />} />
      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      <Route path="/user-dashboard" element={<UserDashboard />} />
      <Route path="/vendor-sell" element={<VendorSellPage />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/rewards" element={<Reward />} />
      {/* <Route path="/admin" element={<AdminLayout />} /> */}
      <Route path="applications" element={<VendorApplication />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="/vendor/register" element={<VendorRegister />} />
      <Route path="vendor/login" element={<VendorLogin />} />
      <Route path="/vendor/orders" element={<OrderPage/>}/>
      <Route path="vendor/analytics" element={<VendorAnalytics />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="vendor/products" element={<VendorProductsPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/vendor/profile" element={<VendorProfile />} />
      <Route path="order-confirmation" element={<OrderConfirmation />} />
      <Route path="/admin-panel" element={<AdminPanel />} />
      <Route path="/admin/applications" element={<VendorApplication />} />
      <Route path="/admin/users" element={<UserManagement />} />
      <Route path="/admin/users-row" element={<UserRow />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
