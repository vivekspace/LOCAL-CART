import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Store, Truck, Shield, CreditCard, ArrowRight, Star, Leaf, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const VendorApplicationPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
    address: '',
    description: '',
    acceptsTerms: false,
  });

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.businessType) newErrors.businessType = 'Business type is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.acceptsTerms) newErrors.acceptsTerms = 'You must accept the terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would send this data to your backend
      /*
      const response = await fetch('/api/vendors/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Application submission failed');
      }
      */

      toast.success('Application submitted successfully! Our team will review your information and contact you shortly.');
      setFormData({
        businessName: '',
        contactName: '',
        email: '',
        phone: '',
        businessType: '',
        address: '',
        description: '',
        acceptsTerms: false,
      });
      
      // Navigate to confirmation page or vendor dashboard
      // navigate('/vendor/confirmation');
    } catch (err) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center bg-white/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Store className="mr-2 h-4 w-4" />
              For Local Businesses
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Grow Your Business with <span className="text-yellow-300">LocalCart</span>
            </h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto mb-10">
              Join our marketplace to reach thousands of local customers, increase sales, and simplify your delivery process.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="#apply"
                className="inline-flex items-center bg-white text-green-700 hover:bg-gray-100 font-semibold px-6 py-3 rounded-full transition"
              >
                Apply Now <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <Link
                to="/vendor-benefits"
                className="inline-flex items-center border-2 border-white text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-full transition"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "2,500+", label: "Local Vendors" },
              { number: "85%", label: "See Growth" },
              { number: "24h", label: "Avg. Response Time" },
              { number: "4.9", label: "Avg. Vendor Rating" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6"
              >
                <p className="text-3xl font-bold text-green-600 mb-2">{stat.number}</p>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Sell on <span className="text-green-600">LocalCart?</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide everything you need to grow your local business online.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                icon: <Truck className="text-green-600" size={32} />,
                title: "Easy Delivery Network",
                description: "Access our reliable delivery system without the hassle of managing logistics yourself."
              },
              {
                icon: <Store className="text-green-600" size={32} />,
                title: "Increased Visibility",
                description: "Get discovered by thousands of local customers actively looking for products like yours."
              },
              {
                icon: <CreditCard className="text-green-600" size={32} />,
                title: "Simple Payments",
                description: "Get paid quickly and securely with our automated payment system."
              },
              {
                icon: <Leaf className="text-green-600" size={32} />,
                title: "Sustainable Growth",
                description: "Join a platform committed to supporting local economies and sustainable practices."
              },
              {
                icon: <Shield className="text-green-600" size={32} />,
                title: "Trust & Security",
                description: "Our platform handles payments securely so you can focus on your business."
              },
              {
                icon: <Star className="text-green-600" size={32} />,
                title: "Marketing Support",
                description: "We promote your products through our marketing channels at no extra cost."
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition"
              >
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6 mx-auto">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">{benefit.title}</h3>
                <p className="text-gray-600 text-center">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="apply" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
          >
            <div className="md:flex">
              {/* Form Side */}
              <div className="md:w-1/2 p-8 sm:p-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Apply to Sell</h2>
                <p className="text-gray-600 mb-8">Fill out the form to get started.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.businessName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                      required
                    />
                    {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        id="contactName"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${errors.contactName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                        required
                      />
                      {errors.contactName && <p className="mt-1 text-sm text-red-600">{errors.contactName}</p>}
                    </div>
                    <div>
                      <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
                        Business Type *
                      </label>
                      <select
                        id="businessType"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${errors.businessType ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                        required
                      >
                        <option value="">Select...</option>
                        <option value="grocery">Grocery Store</option>
                        <option value="bakery">Bakery</option>
                        <option value="produce">Farmers Market</option>
                        <option value="dairy">Dairy Farm</option>
                        <option value="butcher">Butcher Shop</option>
                        <option value="specialty">Specialty Food</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.businessType && <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                        required
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                        required
                        placeholder="123-456-7890"
                      />
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Business Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                      required
                      placeholder="Street, City, State, ZIP"
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Tell us about your business *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                      required
                      placeholder="What products do you offer? What makes your business unique?"
                    ></textarea>
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="acceptsTerms"
                        name="acceptsTerms"
                        type="checkbox"
                        checked={formData.acceptsTerms}
                        onChange={handleChange}
                        className={`w-4 h-4 ${errors.acceptsTerms ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-green-500 text-green-600`}
                        required
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="acceptsTerms" className="font-medium text-gray-700">
                        I agree to the <Link to="/terms" className="text-green-600 hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link> *
                      </label>
                      {errors.acceptsTerms && <p className="mt-1 text-sm text-red-600">{errors.acceptsTerms}</p>}
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Submit Application <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Info Side */}
              <div className="md:w-1/2 bg-gradient-to-b from-green-600 to-green-700 text-white p-8 sm:p-10 flex flex-col justify-center">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center mb-6">
                    <Shield className="mr-3 text-green-300" size={24} />
                    <h3 className="text-xl font-semibold">Secure Application</h3>
                  </div>
                  <h2 className="text-3xl font-bold mb-6">What Happens Next?</h2>
                  
                  <div className="space-y-6 mb-10">
                    {[
                      "We review your application within 2 business days",
                      "Our team contacts you to verify details",
                      "You complete a quick onboarding process",
                      "We help you set up your online store",
                      "You start receiving local orders!"
                    ].map((step, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="flex items-start"
                      >
                        <div className="flex-shrink-0 bg-green-500 rounded-full p-1 mr-4 mt-1">
                          <Check className="h-4 w-4" />
                        </div>
                        <p className="text-green-100">{step}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-auto bg-white/10 p-6 rounded-xl">
                    <h4 className="font-semibold mb-3">Have questions?</h4>
                    <p className="text-green-100 mb-4">
                      Contact our vendor support team at <span className="font-semibold">vendors@localcart.com</span>
                    </p>
                    <Link
                      to="/vendor-faq"
                      className="inline-flex items-center text-green-200 hover:text-white font-medium"
                    >
                      Visit Vendor FAQ <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Success Stories from <span className="text-green-600">Our Vendors</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hear from local businesses who grew with LocalCart.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                quote: "Since joining LocalCart, our sales have increased by 40% without any extra marketing effort. The platform is incredibly easy to use and the support team is always helpful.",
                name: "Maria's Fresh Produce",
                type: "Farmers Market",
                location: "Portland, OR"
              },
              {
                quote: "The delivery system saves us so much time. We can focus on making great bread while LocalCart handles the rest. Our customers love the convenience!",
                name: "Rise & Shine Bakery",
                type: "Artisan Bakery",
                location: "Seattle, WA"
              },
              {
                quote: "We've connected with so many new customers in our neighborhood we never would have reached otherwise. The commission rates are fair and the payments always come on time.",
                name: "Green Valley Dairy",
                type: "Dairy Farm",
                location: "Denver, CO"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 bg-white rounded-xl border border-gray-200 hover:border-green-300 transition shadow-sm hover:shadow-md"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-yellow-400" size={16} />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">{testimonial.name}</div>
                    <div className="text-green-600 text-sm">{testimonial.type}</div>
                    <div className="text-gray-500 text-xs mt-1">{testimonial.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              to="/vendor-stories"
              className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold px-6 py-3 border border-green-600 rounded-full transition hover:bg-green-50"
            >
              Read More Success Stories <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Join hundreds of local businesses already thriving on LocalCart.
            </p>
            <a
              href="#apply"
              className="inline-flex items-center bg-white text-green-700 hover:bg-gray-100 font-semibold px-8 py-4 rounded-full transition text-lg"
            >
              Apply Now - It's Free <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <p className="mt-4 text-green-200 text-sm">
              No upfront costs. Pay only when you make sales.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default VendorApplicationPage;