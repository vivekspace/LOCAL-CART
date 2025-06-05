import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPackage, 
  FiShoppingBag, 
  FiHeart, 
  FiUser,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiStar
} from 'react-icons/fi';

const UserDashboard = () => {
  // Mock data - replace with real user data from API
  const userData = {
    name: "Alex Johnson",
    membership: "Gold Member",
    points: 1250,
    orders: [
      { id: '#1001', date: '2023-06-15', status: 'Delivered', total: 89.99, items: 3 },
      { id: '#1002', date: '2023-06-10', status: 'Shipped', total: 42.50, items: 2 },
      { id: '#1003', date: '2023-06-05', status: 'Processing', total: 120.75, items: 5 }
    ],
    wishlist: [
      { id: 1, name: 'Wireless Headphones', price: 99.99 },
      { id: 2, name: 'Smart Watch', price: 199.99 }
    ],
    recentActivity: [
      { type: 'review', product: 'Organic Coffee', date: '2 days ago', rating: 5 },
      { type: 'purchase', product: 'Yoga Mat', date: '1 week ago' }
    ]
  };

  // Status badges
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      Delivered: 'bg-green-100 text-green-800',
      Shipped: 'bg-blue-100 text-blue-800',
      Processing: 'bg-yellow-100 text-yellow-800',
      Cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
    

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg text-white p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back, {userData.name.split(' ')[0]}!</h2>
              <p className="mb-4">{userData.membership} • {userData.points} Reward Points</p>
              <Link 
                to="/rewards" 
                className="inline-flex items-center px-4 py-2 bg-[#ffffff4e] rounded-md hover:bg-opacity-30 transition"
              >
                Redeem Points <FiStar className="ml-2" />
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <FiUser className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            icon={<FiPackage className="w-6 h-6" />}
            title="My Orders"
            value="5"
            link="/orders"
            linkText="View All"
          />
          <StatCard 
            icon={<FiHeart className="w-6 h-6" />}
            title="Wishlist"
            value={userData.wishlist.length}
            link="/wishlist"
            linkText="See Items"
          />
          <StatCard 
            icon={<FiCheckCircle className="w-6 h-6" />}
            title="Completed Orders"
            value="12"
            link="/orders?status=completed"
            linkText="See History"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
                <Link to="/orders" className="text-green-600 hover:text-green-800 text-sm font-medium">
                  View All Orders
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {userData.orders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-4 sm:mb-0">
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900 mr-3">{order.id}</h3>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.date).toLocaleDateString()} • {order.items} items
                      </p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-lg font-semibold mr-6">${order.total}</p>
                      <Link 
                        to={`/orders/${order.id}`} 
                        className="text-green-600 hover:text-green-800 font-medium text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Wishlist */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Wishlist</h2>
              </div>
              <div className="p-6">
                {userData.wishlist.length > 0 ? (
                  <div className="space-y-4">
                    {userData.wishlist.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg mr-4"></div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-green-600 font-semibold">${item.price}</p>
                        </div>
                        <button className="text-gray-400 hover:text-red-500 transition">
                          <FiHeart className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                    ))}
                    {userData.wishlist.length > 3 && (
                      <Link 
                        to="/wishlist" 
                        className="block text-center text-green-600 hover:text-green-800 font-medium text-sm mt-4"
                      >
                        View all {userData.wishlist.length} items
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiHeart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Your wishlist is empty</h3>
                    <p className="mt-1 text-sm text-gray-500">Save items you love for later</p>
                    <Link
                      to="/products"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                      Start Shopping
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {userData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        {activity.type === 'review' ? (
                          <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                            <FiStar className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="bg-green-100 p-2 rounded-full text-green-600">
                            <FiShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-800">
                          {activity.type === 'review' 
                            ? `You reviewed ${activity.product}`
                            : `You purchased ${activity.product}`}
                          {activity.rating && (
                            <span className="ml-2">
                              {[...Array(5)].map((_, i) => (
                                <FiStar 
                                  key={i} 
                                  className={`inline w-4 h-4 ${i < activity.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link 
                  to="/activity" 
                  className="block text-center text-green-600 hover:text-green-800 font-medium text-sm mt-4"
                >
                  View All Activity
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, link, linkText }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
        <Link 
          to={link} 
          className="mt-4 inline-block text-green-600 hover:text-green-800 text-sm font-medium"
        >
          {linkText} →
        </Link>
      </div>
    </div>
  );
};

export default UserDashboard;