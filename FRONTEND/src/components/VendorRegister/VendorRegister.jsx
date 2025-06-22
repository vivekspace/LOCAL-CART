import { useState, useContext, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Store,
  Phone,
  ShoppingBag, // Used for header icon consistency
} from "lucide-react";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../../Context/Context"; // Ensure correct path

export default function VendorRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({}); // State for field-specific validation errors

  // Destructure vendorRegister from AuthContext
  const { vendorRegister } = useContext(AuthContext); // Assuming you'll add vendorRegister to AuthContext

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "", // Added confirmPassword to formData state
    storeName: "",
    phone: "",
    role: "vendor", // Explicitly set role for vendor registration
    acceptTerms: false, // Added acceptTerms for consistency
  });

  // Client-side validation function
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/[0-9]/.test(formData.password) || !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
        newErrors.password = "Password must include a number and a symbol";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.storeName.trim()) {
      newErrors.storeName = "Store Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone Number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) { // Basic 10-digit phone number validation
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms to register";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  }, [formData]); // Dependencies for useCallback

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear specific error message when user starts typing in the field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Form is invalid, stop submission and display errors
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsLoading(true);
    setErrors({}); // Clear any lingering errors before new submission

    try {
      // Use the vendorRegister function from AuthContext
      const response = await vendorRegister(formData);

      if (response && response.success) {
        toast.success("Vendor account created successfully!");
        navigate("/vendor/dashboard"); // Redirect to vendor dashboard on success
      } else {
        // If vendorRegister returns success: false or no response, show error
        toast.error(response?.message || "Vendor registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Vendor Registration error:", err);
      // Display error from caught exception or generic message
      toast.error(err.message || "An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center p-4">
      <ToastContainer />
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
                y: [0, -5, 0], // Subtle bounce animation for the icon
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
              Become a LocalCart Vendor
            </h2>
            <p className="text-green-100 mt-1">
              Register your shop and start selling!
            </p>
          </div>
          {/* Registration Form */}
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Create Your Vendor Account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition`}
                    required
                  />
                </div>
                {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Vendor Email Address
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
                    placeholder="your.vendor@email.com"
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition`}
                    required
                  />
                </div>
                {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
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
                    placeholder="At least 8 characters"
                    required
                    className={`block w-full pl-10 pr-10 py-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition`}
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
                {errors.password ? (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      At least 8 characters with a number and symbol
                    </p>
                )}
              </div>
              {/* Confirm Password Field */}
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
                    required
                    className={`block w-full pl-10 pr-10 py-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition`}
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
                {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
              {/* Store Name Field */}
              <div>
                <label
                  htmlFor="storeName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Store Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Store className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    placeholder="Your unique store name"
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${errors.storeName ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-500 transition`}
                    required
                  />
                </div>
                {errors.storeName && (
                    <p className="mt-1 text-sm text-red-600">{errors.storeName}</p>
                )}
              </div>
              {/* Phone Field */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your contact number"
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition`}
                    required
                  />
                </div>
                {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              {/* Terms Checkbox */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input
                        id="acceptTerms"
                        name="acceptTerms"
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={handleChange}
                        className={`h-4 w-4 text-green-600 focus:ring-green-500 ${errors.acceptTerms ? 'border-red-500' : 'border-gray-300'} rounded`}
                        required
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="acceptTerms" className="font-medium text-gray-700">
                        I agree to the{" "}
                        <Link to="/terms" className="text-green-600 hover:underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-green-600 hover:underline">
                            Privacy Policy
                        </Link>
                    </label>
                    {errors.acceptTerms && (
                        <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>
                    )}
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-6 py-3 px-4 rounded-lg bg-green-600 text-white font-medium shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all ${
                  isLoading ? "opacity-80 cursor-not-allowed" : ""
                } flex items-center justify-center`}
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
                  "Create Vendor Account"
                )}
              </motion.button>
            </form>
          </div>
          {/* Footer - Already have an account? */}
          <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/vendor/login"
                className="font-medium text-green-600 hover:underline hover:text-green-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}
