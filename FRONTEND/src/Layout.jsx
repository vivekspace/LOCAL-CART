import { useLocation, Outlet } from "react-router-dom";
import { useAuth } from "/src/Context/Context";
import Loader from "./components/Loader/Loader";
import AdminSidebar from "./components/AdminSidebar/AdminSidebar";
import AdminTopbar from "./components/AdminHeader/AdminHeader";
import VendorNavbar from "./components/VendorHeader/VendorHeader";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import ChatbotToggle from "./components/ChatBotToggle/ChatBotToggle";
import VendorChatbotToggle from "./components/VendorChatbotToggle/VendorChatbotToggle";

const Layout = () => {
  const { loading, currentRole, isLoggedIn } = useAuth();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");

  if (loading) {
    return <Loader />;
  }

  // Admin layout
if (isAdminRoute && currentRole === "admin") {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      <div className="fixed z-50 h-full">
        <AdminSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 ml-0 md:ml-20 lg:ml-15 transition-all duration-300">
        
        <div className=" top-0 right-0 left-0">
          <AdminTopbar />
        </div>

        <main className="flex-1 overflow-auto pt-16 p-1 md:p-2 lg:p-2 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
  // Vendor layout
  if (currentRole === "vendor") {
    return (
      <>
        <VendorNavbar />
        <main className="min-h-screen lg:md:p-4">
          <Outlet />
        </main>
        <Footer />
        <VendorChatbotToggle />
      </>
    );
  }

  // Default layout (for users/guests)
  return (
    <>
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