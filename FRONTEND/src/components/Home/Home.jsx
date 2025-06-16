import { Link } from "react-router-dom";
import { ShoppingBag, Truck, ShieldCheck, ArrowRight, Star, Leaf } from "lucide-react";
import {motion}  from "framer-motion";
import { ToastContainer } from "react-toastify";

export default function Home() {
  return (
    <div className="bg-white text-gray-800 overflow-hidden">
      <ToastContainer position="top-center"/>
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Leaf className="mr-2 h-4 w-4" />
            Supporting local businesses
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-900">
            <span className="text-green-600">Shop Local,</span> Shop Smart
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Discover fresh products from your neighborhood vendors, delivered fast with care. 
            Support local businesses while enjoying convenience with <span className="font-semibold text-green-600">LocalCart</span>.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/landing"
              className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-full transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-full transition-all border-2 border-gray-200"
            >
              Learn More
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-green-600">LocalCart?</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're redefining local shopping with convenience and community at heart.
            </p>
          </motion.div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <ShoppingBag className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Local Products</h3>
              <p className="text-gray-600 text-center">
                Get fresh and authentic goods straight from your neighborhood stores, harvested with care.
              </p>
              <div className="mt-6 flex justify-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((item) => (
                    <img
                      key={item}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                      src={`https://randomuser.me/api/portraits/women/${item + 20}.jpg`}
                      alt="Local farmer"
                    />
                  ))}
                </div>
                <span className="ml-3 text-sm text-gray-500 inline-flex items-center">
                  <Star className="text-yellow-400 mr-1" size={14} />
                  4.9/5
                </span>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Truck className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Fast Delivery</h3>
              <p className="text-gray-600 text-center">
                Quick delivery across your area with real-time tracking and eco-friendly packaging.
              </p>
              <div className="mt-6">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">90% deliveries under 30 mins</p>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <ShieldCheck className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Trusted Vendors</h3>
              <p className="text-gray-600 text-center">
                Verified sellers, quality products, and reliable service with satisfaction guarantee.
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">100+</div>
                  <div className="text-xs text-gray-500">Local Vendors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">99%</div>
                  <div className="text-xs text-gray-500">Positive Reviews</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Join thousands of happy customers supporting their local economy.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote: "LocalCart has transformed how I shop for groceries. The produce is fresher than the supermarket!",
                name: "Sarah Johnson",
                role: "Local Foodie"
              },
              {
                quote: "As a small business owner, LocalCart has helped me reach more customers in my community.",
                name: "Michael Chen",
                role: "Bakery Owner"
              },
              {
                quote: "The delivery is incredibly fast and the customer service is outstanding. Highly recommend!",
                name: "Emma Rodriguez",
                role: "Busy Parent"
              }
            ].map((testimonial, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 bg-white/10 rounded-2xl backdrop-blur-sm"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-300 fill-yellow-300" size={16} />
                  ))}
                </div>
                <p className="text-lg mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-green-100 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-3xl p-10 shadow-xl"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Shop Local?</h2>
            <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
              Join our community of local shoppers and vendors today. It's good for you and great for your neighborhood.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-full transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                Sign Up Free
              </Link>
              <Link
                to="/vendors"
                className="inline-flex items-center justify-center bg-transparent hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-full transition-all border-2 border-white"
              >
                Become a Vendor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}