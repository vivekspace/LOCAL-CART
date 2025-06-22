import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify"; // Keep ToastContainer if rendered here, otherwise remove
import { useAuth } from "../../Context/Context"; // Use the custom useAuth hook
import "react-toastify/dist/ReactToastify.css";
import { Lock, Mail, Eye, EyeOff, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

const VendorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); // Local error state for form display

  const navigate = useNavigate();
  // Use the custom useAuth hook for consistency across your app
  const { vendorLogin } = useAuth(); // Destructure 'vendorLogin' from AuthContext via useAuth hook

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setError(""); // Clear previous errors on new submission

    try {
      // Client-side validation
      if (!email || !password) {
        toast.error("Please fill in all fields."); // Toast for client-side validation
        setError("Please fill in all fields.");
        setIsLoading(false);
        return;
      }

      // Call vendorLogin function from AuthContext and capture its return value
      // Normalize email: trim and convert to lowercase for consistency with other login forms
      const loginResult = await vendorLogin({
        email: email.trim().toLowerCase(),
        password,
      });

      // Check the success property from the login result returned by AuthContext
      if (loginResult.success) {
        // AuthContext's vendorLogin function already shows a success toast.
        navigate("/vendor/dashboard"); // Redirect on successful login
      } else {
        // If login was not successful, AuthContext's vendorLogin function already toasted the error.
        // Set the local error state for display under the form (optional, but good for form feedback).
        setError(loginResult.message || "Vendor login failed. Please try again.");
      }
    } catch (err) {
      // This catch block will primarily handle truly unexpected errors that
      // the AuthContext's vendorLogin function *doesn't* catch and return.
      console.error("Vendor Login (VendorLogin.jsx) unexpected error:", err);
      const errorMessage = err.message || "An unexpected error occurred during vendor login.";
      setError(errorMessage);
      // toast.error(errorMessage); // Removed duplicate toast, relying on AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-green-100 rounded-full opacity-20 mix-blend-multiply filter blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-200 rounded-full opacity-20 mix-blend-multiply filter blur-xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="inline-block mb-4"
            >
              <ShoppingBag className="w-12 h-12 text-white" strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">Welcome, Vendor!</h2>
            <p className="text-green-100 mt-1">
              Manage your shop on LocalCart
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.vendor@email.com"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="block w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 outline-none transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-green-600 hover:text-green-500 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition ${
                  isLoading ? "opacity-80 cursor-not-allowed" : ""
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </motion.button>
            </form>
          </div>

          <div className="bg-green-50 px-8 py-4 text-center border-t border-gray-200">
            <p className="text-sm text-gray-600">
              New to LocalCart?{" "}
              <Link
                to="/vendor/register"
                className="font-medium text-green-600 hover:text-green-500 hover:underline"
              >
                Create vendor account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default VendorLogin;
