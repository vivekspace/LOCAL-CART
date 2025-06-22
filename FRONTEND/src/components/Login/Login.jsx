import React, { useState } from "react"; // Removed useContext as useAuth handles it
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useAuth } from "../../Context/Context"; // Correct import for useAuth hook
import "react-toastify/dist/ReactToastify.css";
import { Lock, Mail, Eye, EyeOff, ShoppingBag } from "lucide-react"; // Using lucide-react for icons
import { motion } from "framer-motion";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  // Use the custom useAuth hook for consistency across your app
  const { login } = useAuth(); // Destructure 'login' from AuthContext via useAuth
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); // Change error state to hold a string

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); // Clear previous errors on new submission

    try {
      // Client-side validation: Check if fields are filled
      if (!formData.email || !formData.password) {
        toast.error("Please fill in all fields."); // Toast for client-side validation
        setError("Please fill in all fields.");
        setIsLoading(false); // Stop loading if validation fails
        return; // Stop execution
      }

      // Call login function from AuthContext and capture its return value
      // The login function in AuthContext already handles its own API calls,
      // localStorage updates, state updates, and toasts for API-related errors/success.
      const loginResult = await login({
        email: formData.email.trim().toLowerCase(), // Normalize email: trim and convert to lowercase
        password: formData.password,
      });

      // Check the success property from the login result returned by AuthContext
      if (loginResult.success) {
        // Handle "remember me" functionality only on successful login
        if (formData.remember) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }

        // AuthContext's login function already shows a success toast.
        // Redirect on successful login
        navigate("/");
      } else {
        // If login was not successful, AuthContext's login function already toasted the error.
        // Set the local error state for display under the form (optional, but good for form feedback).
        setError(loginResult.message || "Login failed. Please try again.");
      }
    } catch (err) {
      // This catch block will primarily handle truly unexpected errors that
      // the AuthContext's login function *doesn't* catch and return.
      console.error("Login (Login.jsx) unexpected error:", err);
      // Ensure a message is displayed even for unexpected errors
      const errorMessage = err.message || "An unexpected error occurred during login.";
      setError(errorMessage);
      toast.error(errorMessage); // Show toast for truly unexpected errors if any
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
          {/* Header section with gradient */}
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
              <ShoppingBag className="w-12 h-12 text-white" strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">
              Welcome to LocalCart
            </h2>
            <p className="text-green-100 mt-1">Your local marketplace</p>
          </div>

          {/* Form section */}
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              {/* Error display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              {/* Email field */}
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
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
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-green-600 hover:text-green-500 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit button */}
              <motion.button
                type="submit"
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition ${
                  isLoading ? "opacity-80 cursor-not-allowed" : ""
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Don't have an account?
                  </span>
                </div>
              </div>
            </div>

            {/* Sign up link */}
            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="font-medium text-green-600 hover:text-green-500 hover:underline"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Ensure ToastContainer is rendered somewhere in your app, often in App.jsx.
          Removed the commented out ToastContainer here to avoid rendering multiple if it's already in App.jsx. */}
       <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}
