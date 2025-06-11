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
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          <AdminTopbar />
          <main className="min-h-screen  lg:md:p-4">
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
      </>
    );
  }

  // Default user layout
  return (
    <>
      <Header /> {/* or AdminTopbar / VendorNavbar */}
      <main className="lg:md:p-4">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default Layout;
