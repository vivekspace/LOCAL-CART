import React, { useState } from 'react';

// Dummy Data for the Vendor Profile
const vendorData = {
  id: 'vendor123',
  name: 'Fresh Harvest Farms',
  profilePicture: 'https://placehold.co/150x150/6366f1/ffffff?text=Vendor', // Placeholder image with indigo background
  bannerImage: 'https://placehold.co/1200x300/4f46e5/ffffff?text=Farm+Fresh+Produce', // Placeholder banner
  rating: 4.8,
  reviewsCount: 120,
  description: 'Fresh Harvest Farms is dedicated to providing the freshest organic produce directly from our fields to your table. We believe in sustainable farming practices and supporting local communities.',
  location: 'Green Valley, CA',
  contactEmail: 'info@freshharvestfarms.com',
  contactPhone: '+1 (555) 123-4567',
  products: [
    {
      id: 'prod001',
      name: 'Organic Tomatoes',
      price: 3.99,
      unit: 'lb',
      image: 'https://placehold.co/300x200/6366f1/ffffff?text=Tomatoes',
      description: 'Juicy, ripe organic tomatoes, perfect for salads and sauces.',
      category: 'Vegetables',
      stock: 50
    },
    {
      id: 'prod002',
      name: 'Farm Fresh Eggs',
      price: 5.00,
      unit: 'dozen',
      image: 'https://placehold.co/300x200/4f46e5/ffffff?text=Eggs',
      description: 'Pasture-raised eggs from happy hens.',
      category: 'Dairy & Eggs',
      stock: 30
    },
    {
      id: 'prod003',
      name: 'Artisan Bread',
      price: 4.50,
      unit: 'loaf',
      image: 'https://placehold.co/300x200/6366f1/ffffff?text=Bread',
      description: 'Hand-kneaded sourdough, baked fresh daily.',
      category: 'Bakery',
      stock: 20
    },
    {
      id: 'prod004',
      name: 'Local Honey',
      price: 12.00,
      unit: 'jar',
      image: 'https://placehold.co/300x200/4f46e5/ffffff?text=Honey',
      description: 'Pure, unfiltered honey from our own beehives.',
      category: 'Pantry',
      stock: 15
    },
    {
      id: 'prod005',
      name: 'Organic Apples',
      price: 2.50,
      unit: 'lb',
      image: 'https://placehold.co/300x200/6366f1/ffffff?text=Apples',
      description: 'Crisp and sweet organic apples, perfect for snacking.',
      category: 'Fruits',
      stock: 40
    },
  ],
  reviews: [
    {
      id: 'rev001',
      customerName: 'Alice Johnson',
      rating: 5,
      comment: 'Absolutely love the fresh produce! The tomatoes are incredible.',
      date: '2024-07-20'
    },
    {
      id: 'rev002',
      customerName: 'Bob Williams',
      rating: 4,
      comment: 'Good quality eggs, delivery was a bit slow but worth it.',
      date: '2024-07-18'
    },
    {
      id: 'rev003',
      customerName: 'Charlie Brown',
      rating: 5,
      comment: 'The artisan bread is a must-try! So delicious.',
      date: '2024-07-15'
    },
  ]
};

// Product Card Component
const ProductCard = ({ product }) => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
    <img
      src={product.image}
      alt={product.name}
      className="w-full h-48 object-cover object-center"
      onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/300x200/6366f1/ffffff?text=${product.name.replace(/\s/g, '+')}`; }}
    />
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
      <p className="text-indigo-600 text-xl font-bold mt-1">${product.price.toFixed(2)} / {product.unit}</p>
      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
      <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 ease-in-out transform hover:-translate-y-0.5">
        Add to Cart
      </button>
    </div>
  </div>
);

// Review Card Component
const ReviewCard = ({ review }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
    <div className="flex items-center mb-3">
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className={`w-5 h-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="ml-2 text-sm font-medium text-gray-700">{review.customerName}</p>
    </div>
    <p className="text-gray-700 text-base">{review.comment}</p>
    <p className="text-sm text-gray-500 mt-3 text-right">{review.date}</p>
  </div>
);

// Main Vendor Profile Page Component
const VendorProfilePage = () => {
  const [activeTab, setActiveTab] = useState('products');

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {vendorData.products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        );
      case 'reviews':
        return (
          <div className="space-y-6">
            {vendorData.reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {vendorData.reviews.length === 0 && (
              <p className="text-center text-gray-600">No reviews yet.</p>
            )}
          </div>
        );
      case 'about':
        return (
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">About {vendorData.name}</h3>
            <p className="text-gray-700 leading-relaxed mb-4">{vendorData.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
              <p><span className="font-semibold">Location:</span> {vendorData.location}</p>
              <p><span className="font-semibold">Email:</span> <a href={`mailto:${vendorData.contactEmail}`} className="text-indigo-600 hover:underline">{vendorData.contactEmail}</a></p>
              <p><span className="font-semibold">Phone:</span> <a href={`tel:${vendorData.contactPhone}`} className="text-indigo-600 hover:underline">{vendorData.contactPhone}</a></p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
      {/* Tailwind CSS CDN for Inter font and basic styles */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        body {
          font-family: 'Inter', sans-serif;
        }
        /* Custom scrollbar for better aesthetics */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      {/* Header Section */}
      <div className="relative bg-indigo-600 h-64 overflow-hidden">
        <img
          src={vendorData.bannerImage}
          alt="Vendor Banner"
          className="w-full h-full object-cover object-center opacity-70"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/1200x300/4f46e5/ffffff?text=Farm+Fresh+Produce'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-800 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col sm:flex-row items-center sm:items-end z-10">
          <img
            src={vendorData.profilePicture}
            alt={`${vendorData.name} Profile`}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg -mb-16 sm:-mb-0 sm:mr-6 object-cover transform transition-transform duration-300 hover:scale-105"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150/6366f1/ffffff?text=Vendor'; }}
          />
          <div className="mt-4 sm:mt-0 text-center sm:text-left">
            <h1 className="text-4xl font-extrabold text-white leading-tight drop-shadow-lg">{vendorData.name}</h1>
            <div className="flex items-center justify-center sm:justify-start mt-2 text-white text-lg">
              <span className="flex text-yellow-300 mr-1">
                {[...Array(Math.floor(vendorData.rating))].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                ))}
                {vendorData.rating % 1 !== 0 && (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20" fill="currentColor">
                    <defs>
                      <linearGradient id="half-star">
                        <stop offset="50%" stopColor="currentColor" />
                        <stop offset="50%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" fill="url(#half-star)" />
                  </svg>
                )}
              </span>
              <span>{vendorData.rating.toFixed(1)} ({vendorData.reviewsCount} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-8 relative z-20">
        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-2 flex justify-around sm:justify-start gap-2 mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 sm:flex-none py-3 px-6 rounded-lg text-lg font-medium transition-all duration-300 ease-in-out ${
              activeTab === 'products' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 sm:flex-none py-3 px-6 rounded-lg text-lg font-medium transition-all duration-300 ease-in-out ${
              activeTab === 'reviews' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
            }`}
          >
            Reviews
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 sm:flex-none py-3 px-6 rounded-lg text-lg font-medium transition-all duration-300 ease-in-out ${
              activeTab === 'about' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
            }`}
          >
            About
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-6 transition-opacity duration-500 ease-in-out">
          {renderContent()}
        </div>
      </div>

      {/* Footer (Optional) */}
      <footer className="bg-gray-100 mt-12 py-8 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} LocalCart. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default VendorProfilePage;
