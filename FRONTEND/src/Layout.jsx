import { Outlet } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import VendorNavbar from "./components/VendorNavbar/VendorNavbar";
import { AuthProvider, useAuth } from "/src/Context/Context.jsx";
import { useEffect, useState } from "react";
import Loader from "./components/Loader/Loader";

const Layout = () => {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      {initialLoading ? <Loader /> : <LayoutContent />}
    </AuthProvider>
  );
};

const LayoutContent = () => {
  const { loading } = useAuth();
  const user = JSON.parse(localStorage.getItem("user"));


  if (loading) {
    return <Loader />;
  }

  return (
    <>
      {user?.role === "vendor" ? <VendorNavbar /> : <Header />}
      <main className="min-h-screen lg:md:p-4">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default Layout;
