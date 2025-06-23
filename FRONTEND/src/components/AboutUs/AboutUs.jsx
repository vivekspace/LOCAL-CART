// src/pages/AboutUsPage.jsx
import React from 'react';
import { useAuth } from '../../Context/Context';
import { motion } from 'framer-motion';
import { FaLeaf, FaCogs, FaGlobeAmericas, FaHandshake, FaQuoteLeft } from 'react-icons/fa';

const AboutUsPage = () => {
  const { selectedLocation } = useAuth();

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans leading-relaxed">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-500 to-green-700 py-28 md:py-36 overflow-hidden text-center">
        <div className="absolute inset-0 bg-black/30 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              Connecting You to <span className="text-yellow-300">Freshness</span>, Locally.
            </motion.h1>
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto mb-10"
            >
              At LocalCart, we believe in bringing the best of your local farms directly to your doorstep, making healthy eating simpler, fresher, and more sustainable.
            </motion.p>
            <motion.div 
              variants={fadeInUp}
              className="flex justify-center space-x-4"
            >
              <a href="/products" className="btn-default-primary bg-white text-green-700 hover:bg-green-50 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                Explore Our Products
              </a>
            </motion.div>
          </motion.div>
        </div>
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1606787366850-de6330128bfc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80"
            alt="Fresh vegetables background"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
              Our Story: <span className="text-yellow-500">Rooted in Community</span>
            </h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto"></div>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center lg:space-x-12">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 mb-12 lg:mb-0 relative"
            >
              <div className="relative overflow-hidden rounded-xl shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1556911220-bff31c812dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2864&q=80"
                  alt="Farmers at work"
                  className="w-full object-cover h-[400px] lg:h-[500px] transform hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-yellow-400 text-green-800 p-4 rounded-lg shadow-lg">
                <span className="block text-3xl font-bold">2025</span>
                <span className="text-sm">Founded</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 text-lg leading-relaxed text-gray-700"
            >
              <p className="mb-6 text-gray-800">
                LocalCart was born out of a simple idea: bridging the gap between local farmers and urban homes. We saw the incredible quality of produce grown right here in India and wanted to make it easily accessible to everyone. Our journey began with a passion for supporting local economies and promoting healthier, sustainable food choices.
              </p>
              <p className="mb-6 text-gray-800">
                From humble beginnings, we've grown into a trusted platform, empowering farmers and delighting customers. Every order placed through LocalCart directly supports local agriculture and ensures you receive the freshest ingredients available.
              </p>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="italic text-green-700">
                  "We don't just deliver groceries—we deliver relationships, trust, and a commitment to our community."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
              Our Mission: <span className="text-yellow-500">Freshness, Simplicity, Sustainability</span>
            </h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mission-card-default bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border-t-4 border-green-500"
            >
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaLeaf className="text-2xl text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-green-700 mb-4 text-center">Freshness Guaranteed</h3>
              <p className="text-gray-700 text-center">We handpick the freshest produce, ensuring it travels from the farm to your door with minimal delay, preserving its natural goodness and flavor.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mission-card-default bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border-t-4 border-blue-500"
            >
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaCogs className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-blue-700 mb-4 text-center">Simplified Shopping</h3>
              <p className="text-gray-700 text-center">Our user-friendly platform makes it incredibly easy to browse, select, and order. Say goodbye to crowded markets and hello to convenience.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mission-card-default bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border-t-4 border-yellow-500"
            >
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaGlobeAmericas className="text-2xl text-yellow-600" />
              </div>
              <h3 className="text-2xl font-semibold text-yellow-700 mb-4 text-center">Sustainable Choices</h3>
              <p className="text-gray-700 text-center">By prioritizing local sourcing, we reduce food miles, support eco-friendly farming practices, and contribute to a healthier planet.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mission-card-default bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border-t-4 border-orange-500"
            >
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaHandshake className="text-2xl text-orange-600" />
              </div>
              <h3 className="text-2xl font-semibold text-orange-700 mb-4 text-center">Supporting Local</h3>
              <p className="text-gray-700 text-center">Every purchase directly benefits local farmers and businesses, strengthening our communities and fostering economic growth.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-green-700 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-6"
            >
              <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
              <div className="text-green-200">Local Farms</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6"
            >
              <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
              <div className="text-green-200">Happy Customers</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6"
            >
              <div className="text-4xl md:text-5xl font-bold mb-2">100+</div>
              <div className="text-green-200">Fresh Products</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6"
            >
              <div className="text-4xl md:text-5xl font-bold mb-2">30min</div>
              <div className="text-green-200">Delivery Promise</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
              What Our <span className="text-yellow-500">Customers Say</span>
            </h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="testimonial-card-default bg-gray-50 rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-yellow-400 mb-4">
                <FaQuoteLeft className="text-3xl" />
              </div>
              <p className="text-lg italic mb-6 text-gray-700">
                "LocalCart has transformed my grocery shopping! The produce is unbelievably fresh and the convenience is unmatched. I've been using it for 6 months and won't go back to traditional shopping."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img 
                    src="https://randomuser.me/api/portraits/women/32.jpg" 
                    alt="Priya Sharma" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-green-600">
                    Duck
                  </h4>
                  <p className="text-gray-500">Mumbai</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="testimonial-card-default bg-gray-50 rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-yellow-400 mb-4">
                <FaQuoteLeft className="text-3xl" />
              </div>
              <p className="text-lg italic mb-6 text-gray-700">
                "I love supporting local farmers through LocalCart. It's easy, reliable, and the quality is always top-notch! The seasonal boxes are my favorite - always a surprise of fresh, local goodness."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img 
                    src="https://randomuser.me/api/portraits/men/45.jpg" 
                    alt="Raj Kumar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-green-600">
                     Cat
                  </h4>
                  <p className="text-gray-500">Delhi</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="testimonial-card-default bg-gray-50 rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300 md:col-span-2 lg:col-span-1"
            >
              <div className="text-yellow-400 mb-4">
                <FaQuoteLeft className="text-3xl" />
              </div>
              <p className="text-lg italic mb-6 text-gray-700">
                "As a working mom, LocalCart saves me so much time. The produce arrives fresh and lasts longer than supermarket veggies. My kids actually eat more vegetables now because they taste better!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img 
                    src="https://randomuser.me/api/portraits/women/68.jpg" 
                    alt="Ananya Patel" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-green-600">
                    Dog
                  </h4>
                  <p className="text-gray-500">Bangalore</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-r from-green-600 to-green-700 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2874&q=80')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-90"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              Ready to Taste the <span className="text-yellow-300">LocalCart Difference</span>?
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl max-w-3xl mx-auto mb-10"
            >
              Join thousands of satisfied customers who are enjoying farm-fresh produce delivered right to them.
              {selectedLocation && (
                <span className="block mt-4">
                  Your current selected location is: <strong className="text-yellow-300">{selectedLocation.name}</strong>.
                </span>
              )}
            </motion.p>
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <a href="/register" className="btn-default-secondary bg-yellow-400 text-green-800 hover:bg-yellow-300 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 px-8 py-3 font-semibold rounded-lg">
                Sign Up Today
              </a>
              <a href="/products" className="btn-default-outline-white border-2 border-white text-white hover:bg-white hover:text-green-700 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 px-8 py-3 font-semibold rounded-lg">
                Shop Now
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;