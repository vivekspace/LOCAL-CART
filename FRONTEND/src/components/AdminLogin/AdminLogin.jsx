// src/pages/AdminLogin.js
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../../Context/Context";
import "react-toastify/dist/ReactToastify.css";
import { LockClosedIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'; // For show/hide password
import { ShieldCheckIcon } from '@heroicons/react/24/outline'; // New icon for Admin branding

import axios from "axios";
import { motion } from "framer-motion"; // Add framer-motion for animations

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAdmin } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
          timeout: 10000,
        }
      );

      // Check for backend success indicator within the response data
      if (
        !response.data.success ||
        !response.data.token ||
        !response.data.user
      ) {
        throw new Error(response.data.message || "Authentication failed.");
      }

      // ✅ Store token and user info
      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminInfo", JSON.stringify(response.data.user));
      setAdmin(response.data.user); // Update admin state in context

      toast.success("Admin Login successful!");

      // ✅ Navigate to admin panel
      navigate("/admin-panel", { replace: true });
    } catch (err) {
      let errorMessage = "Login failed. Please try again.";

      if (err.response) {
        // Server responded with a status other than 2xx
        errorMessage =
          err.response.data.message ||
          (err.response.status === 401
            ? "Invalid admin credentials."
            : `Server error: ${err.response.status}`);
      } else if (err.request) {
        // Request was made but no response was received
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err.code === "ECONNABORTED") {
        // Request timeout
        errorMessage = "Request timed out. Please try again.";
      } else {
        // Something else happened in setting up the request that triggered an Error
        errorMessage = err.message || "An unexpected error occurred.";
      }

      setError(errorMessage);
      toast.error(errorMessage);
      localStorage.removeItem("adminToken"); // Clear token on failure
      localStorage.removeItem("adminInfo"); // Clear user info on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center p-4">
      {/* Decorative elements (adjust colors if desired for admin theme) */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-green-100 rounded-full opacity-20 mix-blend-multiply filter blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-200 rounded-full opacity-20 mix-blend-multiply filter blur-xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header section with gradient - Adapted from user login page image */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut",
              }}
              className="inline-block mb-4"
            >
              {/* Using a different icon for admin */}
              <ShieldCheckIcon className="w-12 h-12 text-white" strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">
              LocalCart Admin Panel
            </h2>
            <p className="text-green-100 mt-1">Administrator Access</p>
          </div>

          {/* Form section */}
          <div className="p-8">
            {/* Error display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {/* Email field */}
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
                    placeholder="admin@localcart.com" // Admin-specific placeholder
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6" // Minimum length for security
                  />
                  {/* Toggle password visibility button */}
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password - kept structure, removed Forgot Password link */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    // You might want to manage this state if "remember me" is desired for admin
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>
                {/* Removed Forgot Password link for admin login as typically not exposed publicly */}
                {/* <div className="text-sm">
                  <a
                    href="/admin/forgot-password" // If you *must* have one, make it specific to admin
                    className="font-medium text-green-600 hover:text-green-500"
                  >
                    Forgot password?
                  </a>
                </div> */}
              </div>

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Login to Admin Panel" // Updated button text
                  )}
                </button>
              </div>
            </form>

            {/* "Don't have an account?" section removed, replaced with "Need help?" */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div> {/* Lighter border */}
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Need help?</span>
                </div>
              </div>

              <div className="mt-4 text-center text-sm text-gray-600">
                <p>
                  Contact support at{" "}
                  <a
                    href="mailto:localcarthelp@gmail.com"
                    className="font-medium text-green-600 hover:text-green-500"
                  >
                    localcarthelp@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <ToastContainer />
    </div>
  );
};

export default AdminLogin;