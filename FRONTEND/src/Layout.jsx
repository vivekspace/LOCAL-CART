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
     <div className="flex h-screen overflow-hidden overflow-x-scroll"> {/* Add h-screen and overflow-hidden here */}
      <AdminSidebar />
      <div className="flex-1 flex flex-col"> {/* Use flex-col for column layout */}
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto lg:md:p-4"> {/* Make main content scrollable */}
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
