import { useState, useContext } from "react";
import { AuthContext } from "../../Context/Context.jsx";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, ShoppingBag } from "lucide-react"; // Changed icon to ShoppingBag for consistency with user login style, keeping theme relevant for vendor
import { motion } from "framer-motion"; // Import motion for animations
import { toast, ToastContainer } from "react-toastify"; // Ensure ToastContainer is available globally or rendered here

const VendorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext); // Assuming setUser is for the authenticated vendor user

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); // Clear previous errors on new submission

    try {
      if (!email || !password) {
        throw new Error("Please fill in all fields.");
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/vendor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Vendor login failed.");
      }

      const data = await response.json();

      // Check for success data from backend
      if (!data.token || !data.user) {
        throw new Error(data.message || "Authentication data missing from response.");
      }

      localStorage.setItem("vendorToken", data.token);
      localStorage.setItem("vendorInfo", JSON.stringify(data.user)); // Changed key to vendorInfo for clarity
      setUser(data.user); // Set the user (vendor) in context

      toast.success("Vendor Login successful!");
      navigate("/vendor/dashboard"); // Navigate to vendor dashboard
    } catch (err) {
      console.error("Vendor Login error:", err);
      // Ensure the error message displayed is user-friendly
      const errorMessage =
        err.message || "An unexpected error occurred during login.";
      setError(errorMessage);
      toast.error(errorMessage);
      // Clear any stored data if login fails
      localStorage.removeItem("vendorToken");
      localStorage.removeItem("vendorInfo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center p-4">
      {/* Decorative elements (replicating the image's design) */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-green-100 rounded-full opacity-20 mix-blend-multiply filter blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-200 rounded-full opacity-20 mix-blend-multiply filter blur-xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header section with gradient - Direct copy from user login image */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
            <motion.div
              animate={{
                y: [0, -5, 0], // Subtle bounce animation for the icon
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut",
              }}
              className="inline-block mb-4"
            >
              {/* Changed to ShoppingBag, similar to the user login icon but still relevant for commerce */}
              <ShoppingBag className="w-12 h-12 text-white" strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">
              Welcome, Vendor!
            </h2>
            <p className="text-green-100 mt-1">Manage your shop on LocalCart</p> {/* Vendor-specific tagline */}
          </div>

          {/* Form section */}
          <div className="p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6"> {/* Changed spacing to match user login form */}
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Vendor Email Address
                </label> {/* Label change */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" /> {/* Adjusted icon color to match image */}
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.vendor@email.com" // Vendor-specific placeholder
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition" // Matched input styling
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" /> {/* Adjusted icon color to match image */}
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="block w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 outline-none transition text-sm" // Matched input styling, added pr-10 for eye icon
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> // Matched eye icon colors
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between mb-6"> {/* Adjusted margin-bottom to match image */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" // Matched checkbox styling
                  />
                  <span className="ml-2 block text-sm text-gray-700">Remember me</span> {/* Matched text styling */}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-green-600 hover:text-green-500 hover:underline" // Matched link styling
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button // Added motion for consistency
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition ${ // Matched button styling
                  isLoading ? "opacity-80 cursor-not-allowed" : ""
                }`}
                whileHover={{ scale: 1.02 }} // Added animations
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" // Matched spinner size and color
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
                  "Login" // Matched button text
                )}
              </motion.button>
            </form>
          </div>

          {/* Footer - Replicating the "Don't have an account?" section */}
          <div className="bg-green-50 px-8 py-4 text-center border-t border-gray-200"> {/* Adjusted background and border to match image */}
            <p className="text-sm text-gray-600">
              New to LocalCart?{" "}
              <Link
                to="/vendor/register"
                className="font-medium text-green-600 hover:text-green-500 hover:underline" // Matched link styling
              >
                Create vendor account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
      <ToastContainer />
    </div>
  );
};

export default VendorLogin;