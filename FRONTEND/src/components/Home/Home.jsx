import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowRight,
  Star,
  Leaf,
  Heart,
  Clock,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";
import { ToastContainer } from "react-toastify";
import {Helmet} from "react-helmet-async";

export default function Home() {
  return (
    <div className="bg-white text-gray-800 overflow-hidden">
      <Helmet>
        <title>
          Shop Local, Shop Smart | LocalCart - Fresh Products, Fast Delivery
        </title>
        <meta
          name="description"
          content="Discover fresh, authentic products from your neighborhood local vendors and get fast, reliable delivery with LocalCart. Support local businesses and shop smart for groceries and more."
        />
        <link rel="canonical" href={window.location.href} />
        <meta
          property="og:title"
          content="Shop Local, Shop Smart | LocalCart - Fresh Products, Fast Delivery"
        />
        <meta
          property="og:description"
          content="Discover fresh, authentic products from your neighborhood local vendors and get fast, reliable delivery with LocalCart. Support local businesses and shop smart for groceries and more."
        />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />{" "}
        {/* Use summary_large_image if your og:image is large */}
        <meta
          name="twitter:title"
          content="Shop Local, Shop Smart | LocalCart - Fresh Products, Fast Delivery"
        />
        <meta
          name="twitter:description"
          content="Discover fresh, authentic products from your neighborhood local vendors and get fast, reliable delivery with LocalCart. Support local businesses and shop smart for groceries and more."
        />
      </Helmet>
      <ToastContainer position="top-center" />

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center h-screen">
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
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <Leaf className="mr-2 h-4 w-4" />
            Supporting local businesses since 2025
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-900"
          >
            <span className="text-green-600">Shop Local,</span> Shop Smart
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Discover fresh products from your neighborhood vendors, delivered
            fast with care. Support local businesses while enjoying convenience
            with <span className="font-semibold text-green-600">LocalCart</span>
            .
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              to="/landing"
              className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-full transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-full transition-all border-2 border-gray-200 hover:border-green-200"
            >
              Learn More
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              {
                value: "10,000+",
                label: "Happy Customers",
                icon: <Heart className="mx-auto h-6 w-6 text-green-600" />,
              },
              {
                value: "500+",
                label: "Local Vendors",
                icon: (
                  <ShoppingBag className="mx-auto h-6 w-6 text-green-600" />
                ),
              },
              {
                value: "30 min",
                label: "Avg. Delivery",
                icon: <Clock className="mx-auto h-6 w-6 text-green-600" />,
              },
              {
                value: "4.9/5",
                label: "Customer Rating",
                icon: <Star className="mx-auto h-6 w-6 text-green-600" />,
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                {stat.icon}
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
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
              We're redefining local shopping with convenience and community at
              heart.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <ShoppingBag className="text-green-600" size={32} />,
                title: "Local Products",
                description:
                  "Get fresh and authentic goods straight from your neighborhood stores, harvested with care.",
                stats: (
                  <div className="mt-6 flex justify-center">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((item) => (
                        <img
                          key={item}
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                          src={`https://randomuser.me/api/portraits/women/${
                            item + 20
                          }.jpg`}
                          alt="Local farmer"
                        />
                      ))}
                    </div>
                    <span className="ml-3 text-sm text-gray-500 inline-flex items-center">
                      <Star className="text-yellow-400 mr-1" size={14} />
                      4.9/5
                    </span>
                  </div>
                ),
              },
              {
                icon: <Truck className="text-green-600" size={32} />,
                title: "Fast Delivery",
                description:
                  "Quick delivery across your area with real-time tracking and eco-friendly packaging.",
                stats: (
                  <div className="mt-6">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: "90%" }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      90% deliveries under 30 mins
                    </p>
                  </div>
                ),
              },
              {
                icon: <ShieldCheck className="text-green-600" size={32} />,
                title: "Trusted Vendors",
                description:
                  "Verified sellers, quality products, and reliable service with satisfaction guarantee.",
                stats: (
                  <div className="mt-6 flex justify-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        100+
                      </div>
                      <div className="text-xs text-gray-500">Local Vendors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        99%
                      </div>
                      <div className="text-xs text-gray-500">
                        Positive Reviews
                      </div>
                    </div>
                  </div>
                ),
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-transparent hover:border-green-100"
              >
                <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center">
                  {feature.description}
                </p>
                {feature.stats}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How <span className="text-green-600">LocalCart</span> Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to support your local community
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Browse Local Vendors",
                description:
                  "Explore shops and farmers in your neighborhood offering fresh products",
                icon: <ShoppingBag className="text-green-600" size={24} />,
              },
              {
                step: "2",
                title: "Add to Cart",
                description: "Select your favorite items and build your order",
                icon: <Heart className="text-green-600" size={24} />,
              },
              {
                step: "3",
                title: "Fast Delivery",
                description:
                  "Get your order delivered quickly by local couriers",
                icon: <Truck className="text-green-600" size={24} />,
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 bg-gray-50 rounded-2xl hover:bg-white transition-all"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl mb-4 mx-auto">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {step.description}
                </p>
                <div className="flex justify-center">{step.icon}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              What Our Community Says
            </motion.h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Join thousands of happy customers supporting their local economy.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote:
                  "LocalCart has transformed how I shop for groceries. The produce is fresher than the supermarket!",
                name: "Sarah Johnson",
                role: "Local Foodie",
                rating: 5,
              },
              {
                quote:
                  "As a small business owner, LocalCart has helped me reach more customers in my community.",
                name: "Michael Chen",
                role: "Bakery Owner",
                rating: 5,
              },
              {
                quote:
                  "The delivery is incredibly fast and the customer service is outstanding. Highly recommend!",
                name: "Emma Rodriguez",
                role: "Busy Parent",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 bg-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/20 transition-all"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="text-yellow-300 fill-yellow-300"
                      size={16}
                    />
                  ))}
                </div>
                <p className="text-lg mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-green-100 text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured <span className="text-green-600">Local Vendors</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Meet some of our amazing community partners
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                name: "Green Valley Farms",
                category: "Organic Produce",
                image:
                  "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                rating: 4.9,
              },
              {
                name: "Baker's Dozen",
                category: "Artisan Bakery",
                image:
                  "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                rating: 4.8,
              },
              {
                name: "Fresh Catch",
                category: "Seafood Market",
                image:
                  "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                rating: 4.7,
              },
            ].map((vendor, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={vendor.image}
                    alt={vendor.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>
                <div className="p-6 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{vendor.name}</h3>
                      <p className="text-gray-600">{vendor.category}</p>
                    </div>
                    <div className="flex items-center bg-green-50 text-green-600 px-2 py-1 rounded">
                      <Star
                        className="fill-current text-yellow-400 mr-1"
                        size={14}
                      />
                      {vendor.rating}
                    </div>
                  </div>
                  <Link
                    to={`/vendors/${vendor.name
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                    className="mt-4 inline-flex items-center text-green-600 font-medium hover:text-green-700"
                  >
                    Visit Shop <ArrowRight className="ml-1" size={16} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/vendors"
              className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-full transition-all"
            >
              View All Vendors
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-3xl p-10 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2"></div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">
              Ready to Shop Local?
            </h2>
            <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto relative z-10">
              Join our community of local shoppers and vendors today. It's good
              for you and great for your neighborhood.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-full transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                Sign Up Free
              </Link>
              <Link
                to="/vendors"
                className="inline-flex items-center justify-center bg-transparent hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-full transition-all border-2 border-white hover:border-white/80"
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
