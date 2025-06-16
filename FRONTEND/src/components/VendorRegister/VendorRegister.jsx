import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, Store, Phone, ShoppingBag } from "lucide-react"; // Import ShoppingBag for consistency with user register page header icon
import { AuthContext } from "../../Context/Context";
import { motion } from "framer-motion"; // Import motion for animations
import { toast, ToastContainer } from "react-toastify"; // For notifications

export default function VendorRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "", // Added for visual consistency with user register page
    storeName: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useContext(AuthContext);

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); // Clear previous errors

    // Client-side validation for password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/vendor/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json(); // Assuming backend sends JSON for errors
        throw new Error(errorData.message || "Registration failed.");
      }

      const data = await response.json();
      localStorage.setItem("vendorToken", data.token); // Store vendor token
      localStorage.setItem("vendorInfo", JSON.stringify(data.user)); // Store vendor user info
      setUser(data.user); // Update user context with vendor info
      toast.success("Vendor account created successfully!");
      navigate("/vendor/dashboard"); // Navigate to vendor dashboard after registration
    } catch (err) {
      console.error("Vendor registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
      toast.error(err.message || "Registration failed.");
      // Clear any stored data if registration fails
      localStorage.removeItem("vendorToken");
      localStorage.removeItem("vendorInfo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center p-4"> {/* Adjusted gradient to match user login/register */}
      {/* Decorative elements (copied from user register page style) */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-green-100 rounded-full opacity-20 mix-blend-multiply filter blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-200 rounded-full opacity-20 mix-blend-multiply filter blur-xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden"> {/* Increased shadow and rounded corners */}
          {/* Header section with gradient - Adapted from user register page image */}
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
              <ShoppingBag className="w-12 h-12 text-white" strokeWidth={1.5} /> {/* Using ShoppingBag icon */}
            </motion.div>
            <h2 className="text-2xl font-bold text-white">
              Become a LocalCart Vendor
            </h2>
            <p className="text-green-100 mt-1">Register your shop and start selling!</p> {/* Vendor-specific tagline */}
          </div>

          {/* Registration Form */}
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Create Your Vendor Account
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5"> {/* Consistent spacing */}
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Full Name
                </label> {/* Label change */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" /> {/* Icon color to match image */}
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
                  />
                </div>
              </div>

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
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.vendor@email.com" // Vendor-specific placeholder
                    required
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
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
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters" // Simplified placeholder
                    minLength="8"
                    required
                    className="block w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
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
                <p className="mt-1 text-xs text-gray-500">At least 8 characters with a number and symbol</p> {/* Helper text from image */}
              </div>

              {/* Confirm Password Field (Added for consistency with user register image) */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    minLength="8"
                    required
                    className="block w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Store Name Field */}
              <div>
                <label
                  htmlFor="storeName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Store Name
                </label> {/* Label change */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Store className="h-5 w-5 text-gray-400" /> {/* Icon color to match image */}
                  </div>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    placeholder="Your unique store name"
                    required
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label> {/* Label change */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" /> {/* Icon color to match image */}
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your contact number"
                    required
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start mt-2">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 rounded text-green-600 focus:ring-green-500 border-gray-300" // Matched checkbox styling
                />
                <span className="ml-2 text-sm text-gray-600">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="font-medium text-green-600 hover:text-green-500 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="font-medium text-green-600 hover:text-green-500 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-6 py-3 px-4 rounded-lg bg-green-600 text-white font-medium shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all ${
                  isLoading ? "opacity-80 cursor-not-allowed" : ""
                } flex items-center justify-center`} // Added flex-center for spinner
                whileHover={{ scale: 1.02 }} // Added animations
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" // Spinner size matching image
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
                    Creating account...
                  </>
                ) : (
                  "Create Vendor Account" // Updated button text
                )}
              </motion.button>
            </form>
          </div>

          {/* Footer - Already have an account? */}
          <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200"> {/* Added border-t to match design */}
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/vendor/login"
                className="font-medium text-green-600 hover:underline hover:text-green-500" // Matched link styling
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
      <ToastContainer /> {/* Ensure ToastContainer is rendered for toasts */}
    </div>
  );
}