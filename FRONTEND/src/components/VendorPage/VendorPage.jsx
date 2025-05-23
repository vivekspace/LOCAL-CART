import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Store, Truck, Shield, CreditCard, ArrowRight, Star, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';


const VendorPage =() =>{

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  console.log(isLoading)

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

  console.log('Form Data:', formData);
  

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      
      // Append each image file
      formData.images.forEach(image => {
        formDataToSend.append('productImages', image);
      });

      const response = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vendorToken')}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add product');
      }

      toast.success('Product added successfully!');
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err.message);
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
              <Link
                to="/vendor-benefits"
                className="inline-flex items-center bg-white text-green-700 hover:bg-gray-100 font-semibold px-6 py-3 rounded-full transition"
              >
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
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
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 bg-gray-50 rounded-xl hover:bg-green-50 transition"
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="md:flex">
              {/* Form Side */}
              <div className="md:w-1/2 p-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Apply to Sell</h2>
                <p className="text-gray-600 mb-8">Fill out the form to get started.</p>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        />
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        >
                          <option value="">Select...</option>
                          <option value="grocery">Grocery</option>
                          <option value="bakery">Bakery</option>
                          <option value="produce">Produce</option>
                          <option value="dairy">Dairy</option>
                          <option value="butcher">Butcher</option>
                          <option value="other">Other</option>
                        </select>
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        />
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        />
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      ></textarea>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="acceptsTerms"
                          name="acceptsTerms"
                          type="checkbox"
                          checked={formData.acceptsTerms}
                          onChange={handleChange}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          required
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="acceptsTerms" className="font-medium text-gray-700">
                          I agree to the <Link to="/terms" className="text-green-600 hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link> *
                        </label>
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center"
                      >
                        Submit Application <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Info Side */}
              <div className="md:w-1/2 bg-green-600 text-white p-10 flex flex-col justify-center">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center mb-6">
                    <Shield className="mr-3 text-green-300" size={24} />
                    <h3 className="text-xl font-semibold">Secure Application</h3>
                  </div>
                  <h2 className="text-3xl font-bold mb-6">What Happens Next?</h2>
                  
                  <div className="space-y-6">
                    {[
                      "We review your application within 2 business days",
                      "Our team contacts you to verify details",
                      "You complete a quick onboarding process",
                      "We help you set up your online store",
                      "You start receiving local orders!"
                    ].map((step, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 bg-green-500 rounded-full p-1 mr-4">
                          <Check className="h-4 w-4" />
                        </div>
                        <p className="text-green-100">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 bg-white/10 p-6 rounded-xl">
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
      <section className="py-20 bg-white">
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
                quote: "Since joining LocalCart, our sales have increased by 40% without any extra marketing effort.",
                name: "Maria's Fresh Produce",
                type: "Farmers Market"
              },
              {
                quote: "The delivery system saves us so much time. We can focus on making great bread while LocalCart handles the rest.",
                name: "Rise & Shine Bakery",
                type: "Artisan Bakery"
              },
              {
                quote: "We've connected with so many new customers in our neighborhood we never would have reached otherwise.",
                name: "Green Valley Dairy",
                type: "Dairy Farm"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 bg-gray-50 rounded-xl border border-gray-200 hover:border-green-300 transition"
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
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default VendorPage;