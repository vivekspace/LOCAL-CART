import { Link } from "react-router-dom";
import { ShoppingCart, Heart, User, Star, MapPin, Truck, ChevronRight, Leaf, Gem, Coffee, PieChart } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

const Landing = () => {
  return (
    <div className="bg-gradient-to-b from-green-50/20 to-white min-h-screen flex flex-col items-center py-16 px-4 overflow-hidden relative">
      <Helmet>
        <title>LocalCart - Discover Fresh, Local Products Delivered to Your Door</title>
        <meta
          name="description"
          content="Connect with local farmers and artisans. Shop fresh produce, handmade goods, and unique local treasures with convenient delivery to your home."
        />
        <link rel="canonical" href={window.location.href} />
        <meta property="og:title" content="LocalCart - Discover Fresh, Local Products Delivered to Your Door" />
        <meta
          property="og:description"
          content="Connect with local farmers and artisans. Shop fresh produce, handmade goods, and unique local treasures with convenient delivery to your home."
        />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LocalCart - Discover Fresh, Local Products Delivered to Your Door" />
        <meta
          name="twitter:description"
          content="Connect with local farmers and artisans. Shop fresh produce, handmade goods, and unique local treasures with convenient delivery to your home."
        />
      </Helmet>

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-80 h-80 rounded-full bg-green-100/30 blur-3xl -z-10 animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-green-100/20 blur-3xl -z-10 animate-float-slow-delay"></div>
        <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-amber-100/30 blur-2xl -z-10 animate-float"></div>
      </div>

      {/* Floating decorative elements */}
      <Leaf className="absolute top-1/4 left-20 text-green-200/80 w-16 h-16 animate-float -z-10" />
      <Coffee className="absolute bottom-1/3 right-24 text-amber-200/60 w-14 h-14 animate-float-delay -z-10" />
      <PieChart className="absolute top-1/2 left-1/4 text-emerald-200/70 w-12 h-12 animate-float-slow -z-10" />

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto text-center mb-16 relative"
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="inline-flex items-center bg-green-100/80 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-green-200/50"
        >
          <Star className="mr-2" size={16} />
          Welcome to LocalCart!
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
        >
          Discover <span className="text-emerald-600">Local Treasures</span> <br className="hidden md:block" />
          Delivered with{' '}
          <span className="relative inline-block">
            <span className="relative z-10">Care</span>
            <span className="absolute bottom-1 left-0 w-full h-3 bg-green-200/60 -z-0"></span>
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-gray-600 max-w-2xl mx-auto mb-8"
        >
          Connect directly with farmers, artisans, and makers in your community. 
          Enjoy farm-fresh produce, handcrafted goods, and unique finds—all delivered 
          with the personal touch of your neighborhood.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex gap-4 justify-center"
        >
          <Link
            to="/shopping"
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg hover:shadow-green-200/50 hover:scale-[1.02] flex items-center group"
          >
            Start Shopping
            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/about"
            className="px-6 py-3 bg-white/80 text-gray-700 font-medium rounded-lg border border-gray-200 hover:border-green-300 hover:text-green-700 transition-all shadow-sm hover:shadow-md backdrop-blur-sm flex items-center group"
          >
            Learn More
            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Value Propositions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto w-full px-4">
        {[
          {
            icon: <MapPin className="text-green-600" size={24} />,
            title: "Hyperlocal",
            description: "Products sourced from within 20 miles of your location",
            bg: "bg-green-100/50"
          },
          {
            icon: <Truck className="text-green-600" size={24} />,
            title: "Lightning Delivery",
            description: "90% of orders delivered same or next day",
            bg: "bg-amber-100/50"
          },
          {
            icon: <Gem className="text-green-600" size={24} />,
            title: "Curated Quality",
            description: "Every seller is vetted for quality and sustainability",
            bg: "bg-emerald-100/50"
          }
        ].map((item, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            className={`bg-white/80 p-6 rounded-2xl shadow-sm border border-gray-100/70 hover:border-green-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group backdrop-blur-sm ${item.bg}`}
          >
            <div className="bg-white p-3 rounded-lg mr-4 inline-flex group-hover:bg-green-100 transition-colors shadow-sm border border-gray-100">
              {item.icon}
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-xl mb-2 text-gray-900">{item.title}</h3>
              <p className="text-gray-600">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full px-4 mb-20">
        {[
          {
            icon: <ShoppingCart className="text-green-600" size={24} />,
            title: "Farmers Market",
            description: "Seasonal produce, dairy, meats and more from local farms",
            linkText: "Browse farms",
            url: "/shopping",
            color: "from-green-100/40 to-green-200/30"
          },
          {
            icon: <Heart className="text-green-600" size={24} />,
            title: "Artisan Goods",
            description: "Handcrafted items from your neighborhood makers",
            linkText: "Discover artisans",
            url: "/artisans",
            color: "from-amber-100/40 to-amber-200/30"
          },
          {
            icon: <User className="text-green-600" size={24} />,
            title: "Personal Shoppers",
            description: "Need help? Our locals will handpick items for you",
            linkText: "Meet shoppers",
            url: "/shoppers",
            color: "from-emerald-100/40 to-emerald-200/30"
          }
        ].map((feature, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            className="group relative overflow-hidden bg-white/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 h-full border border-gray-100/70 hover:border-green-200 backdrop-blur-sm"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
            
            <div className="p-8 h-full flex flex-col">
              <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors shadow-sm border border-gray-100">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-6 flex-grow">
                {feature.description}
              </p>
              
              <Link
                to={feature.url}
                className="mt-auto inline-flex items-center text-green-600 font-medium hover:text-green-700 transition-colors group/link"
              >
                {feature.linkText}
                <ChevronRight className="h-5 w-5 ml-1 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Testimonial Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-10 max-w-4xl mx-auto w-full px-4"
      >
        <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 p-8 rounded-2xl border border-green-100/50 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-green-200/30 blur-xl animate-pulse-slow"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-emerald-200/30 blur-xl animate-pulse-slow-delay"></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="text-amber-400 fill-amber-400" size={18} />
              ))}
              <span className="ml-2 text-sm text-gray-500">4.9/5 from 1,200+ reviews</span>
            </div>
            <blockquote className="text-xl font-medium text-gray-800 mb-6">
              "LocalCart has completely changed how I shop. I get the freshest produce from farms down the road, and discovered an amazing ceramicist in my neighborhood. It feels good knowing my money stays local."
            </blockquote>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-green-700 font-bold mr-4 shadow-sm border border-green-200">
                JD
              </div>
              <div>
                <p className="font-medium text-gray-900">Jamie D.</p>
                <p className="text-sm text-gray-600">LocalCart Customer • 1 month</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-20 w-full max-w-6xl mx-auto px-4"
      >
        <div className="bg-white/80 rounded-2xl p-8 border border-gray-100/70 shadow-sm backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Your Local Impact
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "$4.2M+", label: "to local businesses" },
              { value: "1,200+", label: "local sellers" },
              { value: "95%", label: "happy customers" },
              { value: "30min", label: "avg. delivery time" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl font-bold text-green-600 mb-2">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="mt-20 text-center px-4"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Ready to shop like a local?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Join thousands supporting their community while enjoying the best products around.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg hover:shadow-green-200/50 hover:scale-[1.02] text-lg flex items-center justify-center group"
          >
            Join LocalCart
            <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/shopping"
            className="px-8 py-4 bg-white/80 text-gray-700 font-medium rounded-lg border border-gray-200 hover:border-green-300 hover:text-green-700 transition-all shadow-sm hover:shadow-md text-lg flex items-center justify-center group backdrop-blur-sm"
          >
            Browse Local Products
            <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none -z-10">
        <div className="flex space-x-8 opacity-70">
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-green-500"
          >
            <Leaf size={24} />
          </motion.div>
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="text-amber-500"
          >
            <Coffee size={24} />
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="text-emerald-500"
          >
            <Gem size={24} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Landing;