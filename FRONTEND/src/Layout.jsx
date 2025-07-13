import { useLocation, Outlet, useNavigate } from "react-router-dom"; // Import useNavigate
import { useAuth } from "/src/Context/Context";
import Loader from "./components/Loader/Loader";
import AdminSidebar from "./components/AdminSidebar/AdminSidebar";
import AdminTopbar from "./components/AdminHeader/AdminHeader";
import VendorNavbar from "./components/VendorHeader/VendorHeader"; // Corrected component name if it was VendorHeader in your folder
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import ChatbotToggle from "./components/ChatBotToggle/ChatbotToggle";
import VendorChatbotToggle from "./components/VendorChatbotToggle/VendorChatbotToggle";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import { useEffect } from "react"; // Import useEffect

const Layout = () => {
  const { isAuthLoading, currentRole, isLoggedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isVendorRoute = location.pathname.startsWith("/vendor");
  const isPublicRoute = !isAdminRoute && !isVendorRoute; // A route that is neither admin nor vendor specific

  console.log("Layout.jsx: Auth state:", {
    isLoading: isAuthLoading,
    isLoggedIn,
    currentRole,
    pathname: location.pathname, // Add pathname for better debugging
    isAdminRoute,
  });

  // New useEffect for redirection
  useEffect(() => {
    // Only attempt redirection if auth is not loading, user is logged in, and it's a public route
    if (!isAuthLoading && isLoggedIn) {
      if (currentRole === "admin" && isPublicRoute) {
        console.log("Layout.jsx: Redirecting admin to /admin");
        navigate("/admin", { replace: true }); // Use replace to avoid adding to history
      } else if (currentRole === "seller" && isPublicRoute) {
        console.log("Layout.jsx: Redirecting vendor to /vendor");
        navigate("/vendor/dashboard", { replace: true });
      }
    }
  }, [isAuthLoading, isLoggedIn, currentRole, isPublicRoute, navigate]);


  if (isAuthLoading) {
    console.log("Layout.jsx: Showing Loader (Auth context loading)");
    return <Loader />;
  }

  if (isAdminRoute && isLoggedIn && currentRole === "admin") {
    console.log("Layout.jsx: Rendering Admin Layout"); // Debug log
    return (
      <>
        <ScrollToTop />
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <div className="fixed z-50 h-full">
            <AdminSidebar />
          </div>
          <div className="flex-1 flex flex-col min-w-0 ml-0 md:ml-20 lg:ml-15 transition-all duration-300">
            <div className="top-0 right-0 left-0">
              <AdminTopbar />
            </div>
            <main className="flex-1 overflow-auto pt-16 p-1 md:p-2 lg:p-2 bg-gray-50">
              <Outlet />
            </main>
          </div>
        </div>
      </>
    );
  }

  if (isVendorRoute && isLoggedIn && currentRole === "seller") {
    console.log("Layout.jsx: Rendering Vendor Layout"); // Debug log
    return (
      <>
        <ScrollToTop />
        <VendorNavbar />
        <main className="min-h-screen lg:md:p-4">
          <Outlet />
        </main>
        <Footer />
        <VendorChatbotToggle />
      </>
    );
  }

  console.log("Layout.jsx: Rendering Public/Default Layout"); // Debug log
  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="lg:md:p-4">
        <Outlet />
      </main>
      <Footer />
      <ChatbotToggle />
    </>
  );
};

export default Layout;