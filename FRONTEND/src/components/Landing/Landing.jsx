import { Link } from "react-router-dom";
import { ShoppingCart, Heart, User, Star, MapPin, Truck, ChevronRight } from "lucide-react";

const Landing = () => {
  return (
    <div className="bg-gradient-to-b from-green-50/50 to-white min-h-screen flex flex-col items-center py-16 px-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-80 h-80 rounded-full bg-green-100/30 blur-3xl -z-10"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-green-100/20 blur-3xl -z-10"></div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto text-center mb-16 relative">
        <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
          <Star className="mr-2" size={16} />
          Welcome to LocalCart!
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up">
          Discover Local Treasures <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
            Delivered to Your Door
          </span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 animate-fade-in-up delay-100">
          Connect with local producers and artisans in your community. Fresh
          products, unique finds, and special offers - all just a click away.
        </p>
        <div className="flex gap-4 justify-center animate-fade-in-up delay-200">
          <Link
            to="/shopping"
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg hover:shadow-green-200 hover:scale-[1.02]"
          >
            Start Shopping
          </Link>
          <Link
            to="/about"
            className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:border-green-300 hover:text-green-700 transition-all shadow-sm hover:shadow-md"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Value Propositions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-6xl mx-auto w-full animate-fade-in-up delay-300">
        {[
          {
            icon: <MapPin className="text-green-600" size={24} />,
            title: "Local First",
            description: "Support your community's economy with every purchase"
          },
          {
            icon: <Truck className="text-green-600" size={24} />,
            title: "Fast Delivery",
            description: "Get your orders delivered same day from nearby sellers"
          },
          {
            icon: <Star className="text-green-600" size={24} />,
            title: "Curated Quality",
            description: "Only the best local products selected for you"
          }
        ].map((item, index) => (
          <div 
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-green-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group"
          >
            <div className="bg-green-100 p-3 rounded-lg mr-4 inline-flex group-hover:bg-green-200 transition-colors">
              {item.icon}
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-xl mb-2 text-gray-900">{item.title}</h3>
              <p className="text-gray-600">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full animate-fade-in-up delay-500">
        {[
          {
            icon: <ShoppingCart className="text-green-600" size={24} />,
            title: "Shop Local Products",
            description: "Explore fresh produce, handmade goods, and unique finds from sellers in your neighborhood.",
            linkText: "Start browsing",
            url: "/shopping"
          },
          {
            icon: <Heart className="text-green-600" size={24} />,
            title: "Exclusive Offers",
            description: "Unlock special deals and discounts available only to LocalCart members.",
            linkText: "View offers",
            url: "/offers"
          },
          {
            icon: <User className="text-green-600" size={24} />,
            title: "Your Account",
            description: "Manage your profile, payment methods, delivery addresses, and order history.",
            linkText: "Account settings",
            url: "/account"
          }
        ].map((feature, index) => (
          <div 
            key={index} 
            className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 h-full border border-gray-100 hover:border-green-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-green-500/10 transition-all duration-300 pointer-events-none"></div>

            <div className="p-8 h-full flex flex-col">
              <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors">
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
          </div>
        ))}
      </div>

      {/* Testimonial Section */}
      <div className="mt-20 max-w-4xl mx-auto w-full animate-fade-in-up delay-700">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-green-200/30 blur-xl"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-emerald-200/30 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="text-yellow-400 fill-yellow-400" size={18} />
              ))}
            </div>
            <blockquote className="text-xl font-medium text-gray-800 mb-6">
              "LocalCart has completely changed how I shop locally. The quality of products and convenience is unmatched. I've discovered so many amazing local businesses I never knew existed!"
            </blockquote>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold mr-4">
                JD
              </div>
              <div>
                <p className="font-medium text-gray-900">Jamie D.</p>
                <p className="text-sm text-gray-600">LocalCart Customer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-20 text-center animate-fade-in-up delay-1000">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Ready to explore your local marketplace?
        </h2>
        <div className="flex gap-4 justify-center">
          <Link
            to="/register"
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg hover:shadow-green-200 hover:scale-[1.02] text-lg"
          >
            Join LocalCart Now
          </Link>
          <Link
            to="/shopping"
            className="px-8 py-4 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:border-green-300 hover:text-green-700 transition-all shadow-sm hover:shadow-md text-lg"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;