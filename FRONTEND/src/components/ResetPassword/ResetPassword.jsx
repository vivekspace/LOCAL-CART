import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../Context/Context";
import { Lock, Eye, EyeOff, ShoppingBag, CheckCircle, AlertTriangle, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from 'react-helmet-async';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    score: 0
  });

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      setError("No reset token provided.");
      setIsValidatingToken(false);
      return;
    }
    validateResetToken();
  }, [token]);

  // Password strength checker
  useEffect(() => {
    const password = formData.password;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    setPasswordStrength({ ...checks, score });
  }, [formData.password]);

  const validateResetToken = async () => {
    try {
      console.log("ResetPassword.jsx: Validating token:", token);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/validate-reset-token/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log("ResetPassword.jsx: Token validation response:", data);

      if (response.ok && data.success) {
        setIsTokenValid(true);
        setUserEmail(data.email);
      } else {
        setIsTokenValid(false);
        setError(data.message || "Invalid or expired reset link.");
      }
    } catch (err) {
      console.error("ResetPassword.jsx: Token validation error:", err);
      setIsTokenValid(false);
      setError("Failed to validate reset link. Please try again.");
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score < 2) return 'text-red-500';
    if (passwordStrength.score < 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score < 2) return 'Weak';
    if (passwordStrength.score < 4) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Enhanced validation
      if (!formData.password || !formData.confirmPassword) {
        toast.error("Please fill in all fields.");
        setError("Please fill in all fields.");
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters long.");
        setError("Password must be at least 8 characters long.");
        setIsLoading(false);
        return;
      }

      if (passwordStrength.score < 3) {
        toast.error("Please create a stronger password with uppercase, lowercase, numbers, and special characters.");
        setError("Please create a stronger password.");
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match.");
        setError("Passwords do not match.");
        setIsLoading(false);
        return;
      }

      console.log("ResetPassword.jsx: Submitting password reset for token:", token);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();
      console.log("ResetPassword.jsx: Password reset response:", data);

      if (response.ok && data.success) {
        setIsPasswordReset(true);
        toast.success("Password reset successful! You are now logged in.");
        
        // Store auth data (user is automatically logged in after password reset)
        if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          setAuth({
            isAuthenticated: true,
            user: data.user,
            token: data.token
          });

          // Redirect based on user role after a short delay
          setTimeout(() => {
            if (data.user.role === 'admin') {
              navigate("/admin-panel", { replace: true });
            } else if (data.user.role === 'seller') {
              navigate("/vendor/dashboard", { replace: true });
            } else if (data.user.role === 'customer') {
              navigate("/profile", { replace: true });
            } else {
              navigate("/", { replace: true });
            }
          }, 2000);
        }
      } else {
        const errorMessage = data.message || "Failed to reset password. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("ResetPassword.jsx: Network error:", err);
      const errorMessage = "Network error. Please check your connection and try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating reset link...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reset Password - LocalCart | Create New Password</title>
        <meta name="description" content="Create a new password for your LocalCart account." />
        <meta name="keywords" content="reset password, new password, LocalCart account security" />
        <meta property="og:title" content="Reset Password - LocalCart" />
        <meta property="og:description" content="Create a new secure password for your LocalCart account." />
        <meta property="og:url" content="https://yourwebsite.com/reset-password" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center p-4">
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
                {!isTokenValid ? (
                  <AlertTriangle className="w-12 h-12 text-white" strokeWidth={1.5} />
                ) : isPasswordReset ? (
                  <CheckCircle className="w-12 h-12 text-white" strokeWidth={1.5} />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-white" strokeWidth={1.5} />
                )}
              </motion.div>
              <h2 className="text-2xl font-bold text-white">
                {!isTokenValid ? "Invalid Reset Link" : isPasswordReset ? "Password Reset!" : "Reset Your Password"}
              </h2>
              <p className="text-green-100 mt-1">
                {!isTokenValid 
                  ? "This reset link is invalid or expired" 
                  : isPasswordReset 
                    ? "You're now logged in and will be redirected" 
                    : "Enter your new password below"
                }
              </p>
            </div>

            <div className="p-8">
              {!isTokenValid ? (
                <div className="text-center">
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">
                      <strong>Reset link expired or invalid</strong><br />
                      This password reset link is either invalid or has expired. Reset links are only valid for 15 minutes.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Link
                      to="/forgot-password"
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition"
                    >
                      Request New Reset Link
                    </Link>
                    <Link
                      to="/login"
                      className="w-full flex justify-center py-3 px-4 border border-green-600 rounded-lg shadow-sm text-sm font-medium text-green-600 bg-white hover:bg-green-50 transition"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              ) : isPasswordReset ? (
                <div className="text-center">
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">
                      <strong>Password reset successful!</strong><br />
                      You are now logged in and will be redirected to your dashboard.
                    </p>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-2 bg-green-200 rounded-full mb-2">
                      <motion.div 
                        className="h-2 bg-green-500 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2 }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">Redirecting...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {userEmail && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-700 text-sm">
                        <strong>Resetting password for:</strong> {userEmail}
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      New Password
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
                        placeholder="Enter new password"
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

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Password strength:</span>
                          <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.score < 2 ? 'bg-red-500' :
                              passwordStrength.score < 4 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="flex items-center">
                            {passwordStrength.length ? 
                              <Check className="w-3 h-3 text-green-500 mr-1" /> : 
                              <X className="w-3 h-3 text-red-500 mr-1" />
                            }
                            <span className={passwordStrength.length ? 'text-green-600' : 'text-gray-500'}>
                              8+ characters
                            </span>
                          </div>
                          <div className="flex items-center">
                            {passwordStrength.uppercase ? 
                              <Check className="w-3 h-3 text-green-500 mr-1" /> : 
                              <X className="w-3 h-3 text-red-500 mr-1" />
                            }
                            <span className={passwordStrength.uppercase ? 'text-green-600' : 'text-gray-500'}>
                              Uppercase
                            </span>
                          </div>
                          <div className="flex items-center">
                            {passwordStrength.number ? 
                              <Check className="w-3 h-3 text-green-500 mr-1" /> : 
                              <X className="w-3 h-3 text-red-500 mr-1" />
                            }
                            <span className={passwordStrength.number ? 'text-green-600' : 'text-gray-500'}>
                              Number
                            </span>
                          </div>
                          <div className="flex items-center">
                            {passwordStrength.special ? 
                              <Check className="w-3 h-3 text-green-500 mr-1" /> : 
                              <X className="w-3 h-3 text-red-500 mr-1" />
                            }
                            <span className={passwordStrength.special ? 'text-green-600' : 'text-gray-500'}>
                              Special char
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm New Password
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
                        placeholder="Confirm new password"
                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? 'border-red-300'
                            : 'border-gray-200'
                        }`}
                        required
                        minLength="8"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition ${
                      isLoading || passwordStrength.score < 3 ? "opacity-80 cursor-not-allowed" : ""
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading || passwordStrength.score < 3}
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
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </motion.button>
                </form>
              )}

              {!isPasswordReset && (
                <>
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                          Remember your password?
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <Link
                      to="/login"
                      className="font-medium text-green-600 hover:text-green-500 hover:underline"
                    >
                      Back to Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}