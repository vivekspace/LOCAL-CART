import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300 relative overflow-hidden border-t border-gray-800">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80')] bg-cover bg-center opacity-5"></div>
      
      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <div className="space-y-7">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-white tracking-tight">Local</span>
              <span className="text-3xl font-bold text-emerald-400 tracking-tight">Cart</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-base">
              Connecting communities through local commerce. Supporting small businesses one purchase at a time.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 bg-gray-800/50 p-3 rounded-full hover:bg-emerald-500/20 group">
                <FaFacebookF className="text-lg group-hover:text-emerald-400"/>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 bg-gray-800/50 p-3 rounded-full hover:bg-emerald-500/20 group">
                <FaTwitter className="text-lg group-hover:text-emerald-400"/>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 bg-gray-800/50 p-3 rounded-full hover:bg-emerald-500/20 group">
                <FaInstagram className="text-lg group-hover:text-emerald-400"/>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 bg-gray-800/50 p-3 rounded-full hover:bg-emerald-500/20 group">
                <FaLinkedinIn className="text-lg group-hover:text-emerald-400"/>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-medium mb-6 text-white uppercase tracking-wider">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-emerald-400 transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Home</span>
                </Link>
              </li>
              <li>
                <Link to="/shopping" className="text-gray-400 hover:text-emerald-400 transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Products</span>
                </Link>
              </li>
              <li>
                <Link to="/vendors" className="text-gray-400 hover:text-emerald-400 transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Vendors</span>
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="text-gray-400 hover:text-emerald-400 transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">About Us</span>
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="text-gray-400 hover:text-emerald-400 transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Contact Us</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="text-lg font-medium mb-6 text-white uppercase tracking-wider">Account</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-gray-400 hover:text-emerald-400 transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Login</span>
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-emerald-400 transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Register</span>
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-400 hover:text-emerald-400 transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Dashboard</span>
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="text-gray-400 hover:text-emerald-400 transition-all duration-300 flex items-center group">
                  <span className="mr-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Wishlist</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-medium mb-6 text-white uppercase tracking-wider">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-start group">
                <div className="bg-gray-800/50 p-2 rounded-full group-hover:bg-emerald-500/20 transition-colors duration-300 mr-3">
                  <FaEnvelope className="text-gray-400 text-base group-hover:text-emerald-400 transition-colors"/>
                </div>
                <a href="mailto:localcarthelp@gmail.com" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  localcarthelp@gmail.com
                </a>
              </div>
              <div className="flex items-start group">
                <div className="bg-gray-800/50 p-2 rounded-full group-hover:bg-emerald-500/20 transition-colors duration-300 mr-3">
                  <FaPhoneAlt className="text-gray-400 text-base group-hover:text-emerald-400 transition-colors"/>
                </div>
                <a href="tel:+919876543210" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  +91 98765 43210
                </a>
              </div>
              <div className="flex items-start group">
                <div className="bg-gray-800/50 p-2 rounded-full group-hover:bg-emerald-500/20 transition-colors duration-300 mr-3">
                  <FaMapMarkerAlt className="text-gray-400 text-base group-hover:text-emerald-400 transition-colors"/>
                </div>
                <p className="text-gray-400 hover:text-emerald-400 transition-colors">
                  123 Main Street,<br/>
                  City, Country - 123456
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="relative bg-gray-900/80 py-6 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-xs mb-3 md:mb-0 tracking-wider">
            © {new Date().getFullYear()} LOCALCART. ALL RIGHTS RESERVED.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-emerald-400 text-xs tracking-wider transition-colors">
              PRIVACY POLICY
            </a>
            <a href="#" className="text-gray-500 hover:text-emerald-400 text-xs tracking-wider transition-colors">
              TERMS OF SERVICE
            </a>
            <a href="#" className="text-gray-500 hover:text-emerald-400 text-xs tracking-wider transition-colors">
              COOKIE POLICY
            </a>
          </div>
        </div>
      </div>

      {/* Floating decoration */}
      <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl"></div>
      <div className="absolute -bottom-40 left-1/4 w-48 h-48 rounded-full bg-emerald-400/5 blur-3xl"></div>
    </footer>
  );
};

export default Footer;