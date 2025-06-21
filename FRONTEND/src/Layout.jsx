import { useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import React from "react";

import AdminSidebar from "./components/AdminSidebar/AdminSidebar";
import AdminTopbar from "./components/AdminHeader/AdminHeader";
import VendorNavbar from "./components/VendorHeader/VendorHeader";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Loader from "./components/Loader/Loader";
import { useAuth } from "/src/Context/Context.jsx";
import ChatbotToggle from "./components/ChatBotToggle/ChatBotToggle";
import VendorChatbotToggle from "./components/VendorChatbotToggle/VendorChatbotToggle";

const Layout = () => {
  const { loading } = useAuth();
  const location = useLocation();

  // Get user and admin info from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const admin = JSON.parse(localStorage.getItem("adminInfo"));

  const role = user?.role || admin?.role;
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (loading) {
    return <Loader />;
  }

  // Admin layout
  if (isAdminRoute && role === "admin") {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col min-w-0"> 
        <AdminTopbar />
        
        <main className="flex-1 overflow-auto p-1 md:p-2 lg:p-2 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

  // Vendor layout
  if (role === "vendor") {
    return (
      <>
        <VendorNavbar />
        <main className="min-h-screen lg:md:p-4">
          <Outlet />
        </main>
        <Footer />
        <VendorChatbotToggle/>
      </>
    );
  }

  // Default user layout
  return (
    <>
      <Header /> 
      <main className="lg:md:p-4">
        <Outlet />
      </main>
      <Footer />
      <ChatbotToggle/>
    </>
  );
};

export default Layout;