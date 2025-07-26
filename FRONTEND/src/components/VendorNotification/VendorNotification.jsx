// frontend/src/components/VendorNotifications/VendorNotifications.jsx
import React, { useContext, useEffect } from 'react';
import { NotificationContext } from '../../NotificationContext/NotificationContext.jsx'; // Adjust this path if needed
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, Clock, Package, MessageSquare, Star } from 'lucide-react'; // Example icons


const VendorNotifications = () => {
    // Consume the NotificationContext to access notifications and actions
    const { 
        notifications, 
        unreadCount, 
        markNotificationAsRead, 
        markAllNotificationsAsRead, 
        simulateNotification // For development/testing
    } = useContext(NotificationContext);

    // Update document title to show unread count
    useEffect(() => {
        document.title = `Notifications (${unreadCount > 0 ? unreadCount : '0'}) | Vendor Dashboard`;
    }, [unreadCount]);

    // Function to get an appropriate icon based on notification type (you can expand this)
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order':
                return <Package className="text-blue-500" size={20} />;
            case 'message':
                return <MessageSquare className="text-purple-500" size={20} />;
            case 'review':
                return <Star className="text-yellow-500" size={20} />;
            default:
                return <Bell className="text-gray-500" size={20} />;
        }
    };

    return (
        <div className="vendor-notifications-page min-h-screen bg-gray-50 p-6 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white flex items-center justify-between">
                    <h1 className="text-3xl font-bold flex items-center">
                        <Bell size={28} className="mr-3" />
                        Your Notifications
                    </h1>
                    {unreadCount > 0 && (
                        <span className="bg-white text-indigo-700 px-4 py-1 rounded-full text-lg font-semibold shadow">
                            {unreadCount} Unread
                        </span>
                    )}
                </div>

                {/* Actions Section */}
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {unreadCount > 0 ? (
                        <button 
                            onClick={markAllNotificationsAsRead} 
                            className="btn-primary-outline w-full sm:w-auto px-6 py-2 rounded-lg text-indigo-700 border border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center"
                        >
                            <CheckCircle size={18} className="mr-2" />
                            Mark All as Read
                        </button>
                    ) : (
                        <p className="text-gray-600 font-medium">No unread notifications.</p>
                    )}

                    {/* Simulation buttons (for development only) */}
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                            onClick={() => simulateNotification('order', 'New Order! #XYZ received.')} 
                            className="btn-secondary w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                        >
                            Simulate Order
                        </button>
                        <button 
                            onClick={() => simulateNotification('message', 'New message from customer ABC.')} 
                            className="btn-secondary w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                        >
                            Simulate Message
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                {notifications.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 text-lg">
                        <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>You currently have no notifications.</p>
                        <p className="text-sm mt-2">We'll let you know when something new happens!</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {/* Sort notifications by most recent first */}
                        {[...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((notif) => (
                            <li 
                                key={notif._id} 
                                className={`flex items-start p-5 transition-all duration-200 ${notif.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'}`}
                            >
                                {/* Unread Indicator / Icon */}
                                <div className="flex-shrink-0 mr-4 mt-1">
                                    {notif.isRead ? (
                                        <CheckCircle size={20} className="text-gray-400" />
                                    ) : (
                                        getNotificationIcon(notif.type) // Use specific icon for unread
                                    )}
                                </div>

                                {/* Notification Content */}
                                <div className="flex-grow">
                                    <h3 className={`font-semibold text-lg ${notif.isRead ? 'text-gray-700' : 'text-indigo-800'}`}>
                                        {notif.title}
                                    </h3>
                                    <p className={`text-sm mt-1 ${notif.isRead ? 'text-gray-600' : 'text-gray-700'}`}>
                                        {notif.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                                        <Clock size={14} className="mr-1" />
                                        {new Date(notif.createdAt).toLocaleString()}
                                    </p>
                                    {notif.link && (
                                        <Link 
                                            to={notif.link} 
                                            onClick={() => markNotificationAsRead(notif._id)} // Mark read when clicked
                                            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2 transition-colors"
                                        >
                                            View Details
                                            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                        </Link>
                                    )}
                                </div>

                                {/* Mark Read Button for individual notification */}
                                {!notif.isRead && (
                                    <button 
                                        onClick={() => markNotificationAsRead(notif._id)} 
                                        className="flex-shrink-0 ml-4 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                                    >
                                        Mark Read
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default VendorNotifications;