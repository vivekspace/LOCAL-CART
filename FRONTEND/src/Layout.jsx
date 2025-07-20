import { useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "/src/Context/Context";
import Loader from "./components/Loader/Loader";
import AdminSidebar from "./components/AdminSidebar/AdminSidebar";
import AdminTopbar from "./components/AdminHeader/AdminHeader";
import VendorNavbar from "./components/VendorHeader/VendorHeader";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import ChatbotToggle from './components/ChatBotToggle/ChatBotToggle'
import VendorChatbotToggle from "./components/VendorChatbotToggle/VendorChatbotToggle";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import { useEffect, useMemo } from "react";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

const Layout = () => {
  const { isAuthLoading, currentRole, isLoggedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Memoize route calculations to prevent unnecessary re-calculations
  const routeInfo = useMemo(() => {
    const isAdminRoute = location.pathname.startsWith("/admin");
    const isVendorRoute = location.pathname.startsWith("/vendor");
    const isPublicRoute = !isAdminRoute && !isVendorRoute;
    const isAuthRoute = ['/login', '/register', '/vendor/login', '/vendor/register', '/admin/login'].includes(location.pathname);
    
    return { isAdminRoute, isVendorRoute, isPublicRoute, isAuthRoute };
  }, [location.pathname]);

  // Optimized redirection logic - only redirect when necessary
  useEffect(() => {
    if (isAuthLoading) return; // Don't do anything while loading

    const { isAdminRoute, isVendorRoute, isPublicRoute, isAuthRoute } = routeInfo;

    // Only redirect if user is logged in and on incompatible route
    if (isLoggedIn && !isAuthRoute) {
      if (currentRole === "admin" && !isAdminRoute) {
        console.log("Layout.jsx: Redirecting admin to admin panel");
        navigate("/admin/panel", { replace: true });
        return;
      }
      
      if (currentRole === "seller" && !isVendorRoute) {
        console.log("Layout.jsx: Redirecting vendor to dashboard");
        navigate("/vendor/dashboard", { replace: true });
        return;
      }
    }

    // Redirect if accessing protected routes without proper auth
    if (!isLoggedIn) {
      if (isAdminRoute) {
        navigate("/admin/login", { replace: true });
        return;
      }
      if (isVendorRoute) {
        navigate("/vendor/login", { replace: true });
        return;
      }
    }
  }, [isAuthLoading, isLoggedIn, currentRole, location.pathname, navigate]);

  // Show loader only during initial auth check
  if (isAuthLoading) {
    return <Loader />;
  }

  const { isAdminRoute, isVendorRoute } = routeInfo;

  // Admin Layout
  if (isAdminRoute && isLoggedIn && currentRole === "admin") {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <ScrollToTop />
        <div className="fixed z-50 h-full">
          <AdminSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 ml-0 md:ml-20 lg:ml-15 transition-all duration-300">
          <div className="top-0 right-0 left-0">
            <AdminTopbar />
          </div>
          <main className="flex-1 overflow-auto p-1 md:p-2 lg:p-2 bg-gray-50">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    );
  }

  // Vendor Layout
  if (isVendorRoute && isLoggedIn && currentRole === "seller") {
    return (
      <div className="min-h-screen flex flex-col">
        <ScrollToTop />
        <VendorNavbar />
        <main className="flex-1 min-h-screen lg:md:p-4">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <Footer />
        <VendorChatbotToggle />
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1 pt-16">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <ChatbotToggle />
    </div>
  );
};

export default Layout;