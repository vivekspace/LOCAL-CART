import React, { useState } from 'react';
import { FiStar, FiGift, FiCreditCard, FiShoppingCart, FiCoffee, FiAward } from 'react-icons/fi';

const RewardsPage = () => {
  // User data - replace with real data from your API
  const [userData, setUserData] = useState({
    coins: 1250,
    redeemedCoupons: [
      { id: 'CUP20', value: '20% Off', expires: '2023-12-31', used: false },
      { id: 'FREESHP', value: 'Free Shipping', expires: '2023-11-15', used: true }
    ]
  });

  // Available rewards
  const rewards = [
    {
      id: 'discount10',
      title: "10% Off Coupon",
      description: "Get 10% off your next purchase",
      icon: <FiShoppingCart className="w-6 h-6" />,
      cost: 500,
      couponCode: "SAVE10"
    },
    {
      id: 'discount20',
      title: "20% Off Coupon",
      description: "Get 20% off your next purchase",
      icon: <FiCreditCard className="w-6 h-6" />,
      cost: 1000,
      couponCode: "SAVE20"
    },
    {
      id: 'freeship',
      title: "Free Shipping",
      description: "Free shipping on your next order",
      icon: <FiGift className="w-6 h-6" />,
      cost: 750,
      couponCode: "FREESHIP"
    },
    {
      id: 'coffee',
      title: "Free Coffee",
      description: "Redeem at any of our cafe locations",
      icon: <FiCoffee className="w-6 h-6" />,
      cost: 300,
      couponCode: "FREEJOE"
    },
    {
      id: 'vip',
      title: "VIP Discount",
      description: "Exclusive 30% off for VIP members",
      icon: <FiAward className="w-6 h-6" />,
      cost: 1500,
      couponCode: "VIP30"
    },
    {
      id: 'birthday',
      title: "Birthday Gift",
      description: "Special birthday reward",
      icon: <FiGift className="w-6 h-6" />,
      cost: 0,
      couponCode: "BDAYGIFT"
    }
  ];

  const [activeTab, setActiveTab] = useState('available');
  const [redeemedCoupon, setRedeemedCoupon] = useState(null);
  const [showCopied, setShowCopied] = useState(false);

  const handleRedeem = (reward) => {
    if (userData.coins >= reward.cost) {
      // In a real app, you would call your API here
      const newCoupon = {
        id: reward.couponCode,
        value: reward.title,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        used: false
      };

      setUserData({
        ...userData,
        coins: userData.coins - reward.cost,
        redeemedCoupons: [...userData.redeemedCoupons, newCoupon]
      });

      setRedeemedCoupon(newCoupon);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rewards Center</h1>
          <div className="flex items-center justify-center space-x-2">
            <FiStar className="w-6 h-6 text-yellow-500 fill-current" />
            <p className="text-xl font-semibold text-gray-700">
              You have <span className="text-green-600">{userData.coins}</span> coins
            </p>
          </div>
        </div>

        {/* Redeemed Coupon Modal */}
        {redeemedCoupon && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-bounce-in">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <FiGift className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reward Redeemed!</h3>
                <p className="text-sm text-gray-500 mb-4">
                  You've unlocked: <span className="font-semibold">{redeemedCoupon.value}</span>
                </p>
                <div className="bg-gray-100 p-4 rounded-lg mb-6">
                  <p className="text-xs text-gray-500 mb-1">YOUR COUPON CODE</p>
                  <div className="flex items-center justify-between bg-white p-3 rounded border border-green-300">
                    <span className="font-mono font-bold text-lg">{redeemedCoupon.id}</span>
                    <button
                      onClick={() => copyToClipboard(redeemedCoupon.id)}
                      className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center"
                    >
                      {showCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Expires: {new Date(redeemedCoupon.expires).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setRedeemedCoupon(null)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'available' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Available Rewards
            </button>
            <button
              onClick={() => setActiveTab('redeemed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'redeemed' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              My Coupons ({userData.redeemedCoupons.length})
            </button>
          </nav>
        </div>

        {/* Available Rewards */}
        {activeTab === 'available' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <div key={reward.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
                      {reward.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{reward.title}</h3>
                      <p className="text-sm text-gray-500">{reward.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center">
                      <FiStar className="w-5 h-5 text-yellow-500 fill-current mr-1" />
                      <span className="font-medium">{reward.cost} coins</span>
                    </div>
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={userData.coins < reward.cost}
                      className={`px-4 py-2 rounded-md font-medium text-sm ${userData.coins >= reward.cost
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Redeemed Coupons */}
        {activeTab === 'redeemed' && (
          <div>
            {userData.redeemedCoupons.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {userData.redeemedCoupons.map((coupon) => (
                    <li key={coupon.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`p-3 rounded-lg mr-4 ${coupon.used ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600'}`}>
                            <FiCreditCard className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{coupon.value}</h3>
                            <p className="text-sm text-gray-500">
                              Code: <span className="font-mono">{coupon.id}</span> • 
                              Expires: {new Date(coupon.expires).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            coupon.used 
                              ? 'bg-gray-100 text-gray-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {coupon.used ? 'Used' : 'Active'}
                          </span>
                        </div>
                      </div>
                      {!coupon.used && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => copyToClipboard(coupon.id)}
                            className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center"
                          >
                            {showCopied && coupon.id === redeemedCoupon?.id ? 'Copied!' : 'Copy Code'}
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <FiGift className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No coupons yet</h3>
                <p className="mt-1 text-sm text-gray-500">Redeem your coins for awesome rewards!</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  Browse Rewards
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;