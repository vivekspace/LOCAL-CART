import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, ArrowLeft, ShoppingBag, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from 'react-helmet-async';

export default function OTPVerification() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  // Timer for OTP expiration
  useEffect(() => {
    if (isOtpSent && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [isOtpSent, timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!email) {
        toast.error("Please enter your email address.");
        setError("Please enter your email address.");
        setIsLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address.");
        setError("Please enter a valid email address.");
        setIsLoading(false);
        return;
      }

      console.log("Sending OTP request for email:", email);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (response.ok && data.success) {
        setIsOtpSent(true);
        setTimeLeft(600);
        setCanResend(false);
        toast.success("OTP sent to your email!");
      } else {
        const errorMessage = data.message || "Failed to send OTP. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Network error:", err);
      const errorMessage = "Network error. Please check your connection and try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
  e.preventDefault();
  const otpString = otp.join('');

  if (otpString.length !== 6) {
    toast.error("Please enter all 6 digits.");
    return;
  }

  setIsVerifying(true);
  setError("");

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otpString }),
    });

    const data = await response.json();
    console.log("Verify OTP full response:", data); // Log the full response
    console.log("Redirecting to:", `/reset-password/${data.resetToken}`); // Log the redirect URL

    if (response.ok && data.success) {
      toast.success("OTP verified successfully!");
      setTimeout(() => navigate(`/reset-password/${data.resetToken}`), 2000);
    } else {
      const errorMessage = data.message || "Invalid OTP. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      setOtp(["", "", "", "", "", ""]);
      document.getElementById('otp-0')?.focus();
    }
  } catch (err) {
    console.error("Verify OTP error:", err);
    const errorMessage = "Network error. Please try again.";
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsVerifying(false);
  }
};
  const handleResendOTP = () => {
    setIsOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setTimeLeft(600);
    setCanResend(false);
  };

  return (
    <>
      <Helmet>
        <title>OTP Verification - LocalCart | Verify Your Email</title>
        <meta name="description" content="Verify your email address with the OTP code sent to your email." />
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
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="inline-block mb-4"
              >
                {isOtpSent ? (
                  <CheckCircle className="w-12 h-12 text-white" strokeWidth={1.5} />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-white" strokeWidth={1.5} />
                )}
              </motion.div>
              <h2 className="text-2xl font-bold text-white">
                {isOtpSent ? "Enter Verification Code" : "Email Verification"}
              </h2>
              <p className="text-green-100 mt-1">
                {isOtpSent 
                  ? `Code sent to ${email}` 
                  : "We'll send you a verification code"
                }
              </p>
            </div>

            <div className="p-8">
              {!isOtpSent ? (
                <form onSubmit={handleSendOTP}>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
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
                        placeholder="Enter your email address"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition ${
                      isLoading ? "opacity-80 cursor-not-allowed" : ""
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending Code..." : "Send Verification Code"}
                  </motion.button>
                </form>
              ) : (
                <div>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOTP}>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Enter 6-digit verification code
                      </label>
                      <div className="flex justify-center space-x-3">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            autoFocus={index === 0}
                          />
                        ))}
                      </div>
                      <div className="text-center mt-3">
                        <p className="text-sm text-gray-500">
                          Code expires in <span className="font-medium text-green-600">{formatTime(timeLeft)}</span>
                        </p>
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition ${
                        isVerifying ? "opacity-80 cursor-not-allowed" : ""
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isVerifying}
                    >
                      {isVerifying ? "Verifying..." : "Verify Code"}
                    </motion.button>
                  </form>

                  {canResend && (
                    <motion.button
                      onClick={handleResendOTP}
                      className="mt-4 w-full flex justify-center py-3 px-4 border border-green-600 rounded-lg shadow-sm text-sm font-medium text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Resend Code
                    </motion.button>
                  )}
                </div>
              )}

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center font-medium text-green-600 hover:text-green-500 hover:underline"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}