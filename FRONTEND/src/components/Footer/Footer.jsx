import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-green-400 mix-blend-overlay blur-xl"></div>
        <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-green-500 mix-blend-overlay blur-xl"></div>
      </div>
      
      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center">
              <span className="text-4xl font-bold text-white">Local</span>
              <span className="text-4xl font-bold text-green-300 animate-pulse">Cart</span>
            </div>
            <p className="text-green-100 leading-relaxed text-lg opacity-90">
              Connecting communities through local commerce. Supporting small businesses one purchase at a time.
            </p>
            <div className="flex space-x-5 pt-2">
              <a href="#" className="text-green-100 hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 bg-green-800/50 p-2 rounded-full">
                <FaFacebook className="text-2xl"/>
              </a>
              <a href="#" className="text-green-100 hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 bg-green-800/50 p-2 rounded-full">
                <FaTwitter className="text-2xl"/>
              </a>
              <a href="#" className="text-green-100 hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 bg-green-800/50 p-2 rounded-full">
                <FaInstagram className="text-2xl"/>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white border-b-2 border-green-400 pb-2 inline-block">Explore</h3>
            <ul className="space-y-4">
              <li>
                <a href="/" className="text-green-100 hover:text-white transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-green-300 group-hover:text-white transition-colors">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:underline">Home</span>
                </a>
              </li>
              <li>
                <a href="/products" className="text-green-100 hover:text-white transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-green-300 group-hover:text-white transition-colors">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:underline">Products</span>
                </a>
              </li>
              <li>
                <a href="/vendors" className="text-green-100 hover:text-white transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-green-300 group-hover:text-white transition-colors">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:underline">Vendors</span>
                </a>
              </li>
              <li>
                <a href="/about" className="text-green-100 hover:text-white transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-green-300 group-hover:text-white transition-colors">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:underline">About Us</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white border-b-2 border-green-400 pb-2 inline-block">Account</h3>
            <ul className="space-y-4">
              <li>
                <a href="/login" className="text-green-100 hover:text-white transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-green-300 group-hover:text-white transition-colors">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:underline">Login</span>
                </a>
              </li>
              <li>
                <a href="/register" className="text-green-100 hover:text-white transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-green-300 group-hover:text-white transition-colors">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:underline">Register</span>
                </a>
              </li>
              <li>
                <a href="/account" className="text-green-100 hover:text-white transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-green-300 group-hover:text-white transition-colors">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:underline">Dashboard</span>
                </a>
              </li>
              <li>
                <a href="/wishlist" className="text-green-100 hover:text-white transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-green-300 group-hover:text-white transition-colors">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:underline">Wishlist</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white border-b-2 border-green-400 pb-2 inline-block">Contact Us</h3>
            <div className="space-y-5">
              <div className="flex items-start group">
                <div className="bg-green-800/50 p-2 rounded-full group-hover:bg-green-700 transition-colors duration-300 mr-3">
                  <FaEnvelope className="text-green-300 text-lg group-hover:text-white"/>
                </div>
                <a href="mailto:support@localcart.com" className="text-green-100 hover:text-white transition-colors hover:underline">
                  support@localcart.com
                </a>
              </div>
              <div className="flex items-start group">
                <div className="bg-green-800/50 p-2 rounded-full group-hover:bg-green-700 transition-colors duration-300 mr-3">
                  <FaPhoneAlt className="text-green-300 text-lg group-hover:text-white"/>
                </div>
                <a href="tel:+919876543210" className="text-green-100 hover:text-white transition-colors hover:underline">
                  +91 98765 43210
                </a>
              </div>
              <div className="flex items-start group">
                <div className="bg-green-800/50 p-2 rounded-full group-hover:bg-green-700 transition-colors duration-300 mr-3">
                  <FaMapMarkerAlt className="text-green-300 text-lg group-hover:text-white"/>
                </div>
                <p className="text-green-100 hover:text-white transition-colors">
                  123 Main Street,<br/>
                  City, Country - 123456
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="relative bg-green-900/70 py-6 border-t border-green-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-green-100 text-sm mb-3 md:mb-0">
            © {new Date().getFullYear()} LocalCart. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-green-100 hover:text-white text-sm transition-colors hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="text-green-100 hover:text-white text-sm transition-colors hover:underline">
              Terms of Service
            </a>
            <a href="#" className="text-green-100 hover:text-white text-sm transition-colors hover:underline">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;