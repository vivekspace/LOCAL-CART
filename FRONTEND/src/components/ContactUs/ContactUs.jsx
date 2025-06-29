import React, { useRef, useState } from "react";
import {
  FiShoppingBag,
  FiMail,
  FiPhone,
  FiMapPin,
  FiMessageSquare,
  FiUser,
} from "react-icons/fi";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebookF,
  FaTwitter,
} from "react-icons/fa";

const ContactUs = () => {
  const form = useRef();
  const [isSending, setIsSending] = useState(false); // State for loading
  const [message, setMessage] = useState(''); // State for success/error message
  const [isSuccess, setIsSuccess] = useState(null); // State to track if message was success or error

  const sendEmail = async (e) => {
    e.preventDefault();
    setIsSending(true); // Start loading
    setMessage(''); // Clear previous messages
    setIsSuccess(null); // Reset success state

    const formData = new FormData(form.current);
    const payload = {};
    for (let [key, value] of formData.entries()) {
      payload[key] = value;
    }

    try {
      // Replace with your actual backend URL where the contact route is exposed
      // e.g., 'http://localhost:5000/api/contact' or 'https://your-api-domain.com/api/contact'
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        form.current.reset(); // Clear the form
      } else {
        setMessage(data.message || 'An unexpected error occurred.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      setMessage('Network error. Please check your internet connection and try again.');
      setIsSuccess(false);
    } finally {
      setIsSending(false); // End loading
      setTimeout(() => {
        setMessage('');
        setIsSuccess(null);
      }, 5000); // Clear message after 5 seconds
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Vibrant Header */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center mb-4 bg-green-100 rounded-full p-3">
          <FiShoppingBag className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
          Connect with LocalCart
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-700">
          Got questions about your order? Want to sell with us? We're here to
          help!
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form - Marketplace Style */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-200 hover:shadow-xl transition-all duration-300">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-green-500 to-green-500">
            <h2 className="text-2xl font-bold text-white">Send us a message</h2>
          </div>
          <div className="p-6 sm:p-8">
            <form ref={form} onSubmit={sendEmail} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-green-500" />
                  </div>
                  <input
                    type="text"
                    name="name" // Changed from user_name to name to match backend payload
                    className="pl-10 w-full px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-300 focus:border-transparent transition-all placeholder-gray-400"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-green-500" />
                  </div>
                  <input
                    type="email"
                    name="email" // Changed from user_email to email to match backend payload
                    className="pl-10 w-full px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-300 focus:border-transparent transition-all placeholder-gray-400"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMessageSquare className="h-5 w-5 text-green-500" />
                </div>
                <input
                  type="text"
                  name="subject"
                  className="pl-10 w-full px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-300 focus:border-transparent transition-all placeholder-gray-400"
                  placeholder="Subject (Order #1234)"
                />
              </div>

              <div>
                <textarea
                  rows={5}
                  name="message"
                  className="w-full px-4 py-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-300 focus:border-transparent transition-all placeholder-gray-400"
                  placeholder="Your message... (Include order details if applicable)"
                  required
                ></textarea>
              </div>

              {message && ( // Display message
                <p className={`text-center font-medium ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSending} // Disable button when sending
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-green-500 to-green-500 hover:from-green-600 hover:to-green-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Contact Info - LocalCart Style (rest of your existing code) */}
        <div className="space-y-6">
          {/* Seller Support Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-2 rounded-lg mr-4">
                <FiShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Seller Support
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Want to sell on LocalCart? Contact our seller support team for
              onboarding and assistance.
            </p>
            <a href="mailto:localcarthelp@gmail.com" className="flex items-center text-green-700 font-medium">
              <FiMail className="mr-2" />
              localcarthelp@gmail.com
            </a>
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-200 p-6 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h3>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-green-100/50 p-2 rounded-lg mr-4">
                  <FiPhone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Customer Care
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    +91 98765 43210
                  </p>
                  <a href="https://wa.me/9372973931" target="_blank" rel="noopener noreferrer" className="flex items-center mt-1 text-green-600 hover:underline">
                    <FaWhatsapp className="mr-2" />
                    <span className="text-sm">Available on WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-green-100/50 p-2 rounded-lg mr-4">
                  <FiMail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg font-semibold text-gray-900">
                    localcarthelp@gmail.com
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Response time: 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-green-100/50 p-2 rounded-lg mr-4">
                  <FiMapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Headquarters
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    LocalCart Hub, Mumbai and Navi Mumbai
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Open 10AM-6PM, Mon-Sat
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media - Marketplace Style */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-200 p-6 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Follow Our Journey
            </h3>
            <div className="flex space-x-3">
              {[
                {
                  icon: <FaInstagram className="h-5 w-5" />,
                  color: "bg-pink-100 text-pink-600",
                  href: "https://instagram.com/yourlocalcart", // Add actual links
                },
                {
                  icon: <FaFacebookF className="h-5 w-5" />,
                  color: "bg-blue-100 text-blue-600",
                  href: "https://facebook.com/yourlocalcart", // Add actual links
                },
                {
                  icon: <FaTwitter className="h-5 w-5" />,
                  color: "bg-sky-100 text-sky-600",
                  href: "https://twitter.com/yourlocalcart", // Add actual links
                },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 flex items-center justify-center ${social.color} rounded-full hover:opacity-90 transition-all`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;