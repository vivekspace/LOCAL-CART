// frontend/src/context/NotificationContext.js
import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../Context/Context'; // Import your custom useAuth hook
import { toast } from 'react-toastify';

export const NotificationContext = createContext();

const API_URL = `${import.meta.env.VITE_API_URL}/api/notifications`;
const SOCKET_URL = import.meta.env.VITE_API_URL;

export const NotificationProvider = ({ children }) => {
    const { user, isLoggedIn, isSeller, jwtToken, authAxios, isAuthLoading } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null); // Use useRef to hold the socket instance

    // 1. Socket.IO Connection and Room Joining
    useEffect(() => {
        // Only connect if user is logged in, is a seller, user ID is available, and not already connected
        if (isLoggedIn && isSeller && user?._id && jwtToken && !socketRef.current) {
            console.log('Attempting to connect Socket.IO...');
            const newSocket = io(SOCKET_URL, {
                extraHeaders: {
                    Authorization: `Bearer ${jwtToken}`
                },
                withCredentials: true,
                // Add explicit transports to prefer websocket
                transports: ['websocket', 'polling']
            });

            socketRef.current = newSocket; // Store the socket instance in ref

            newSocket.on('connect', () => {
                console.log('✅ Socket.IO Connected on Frontend for Seller');
                newSocket.emit('joinSellerRoom', user._id);
            });

            newSocket.on('connect_error', (err) => {
                console.error('❌ Socket.IO Connection Error:', err.message, err.data);
                // Optionally show a toast for connection issues
                // toast.error("Real-time connection failed. Notifications might be delayed.");
            });

            newSocket.on('newNotification', (newNotif) => {
                console.log('🔔 New real-time notification received:', newNotif);
                setNotifications((prevNotifs) => [newNotif, ...prevNotifs]);
                setUnreadCount((prevCount) => prevCount + 1);
                toast.info(newNotif.title, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            });

            newSocket.on('disconnect', (reason) => {
                console.log('🔴 Socket.IO Disconnected on Frontend. Reason:', reason);
                // Handle potential re-connection logic here if needed (Socket.IO tries by default)
            });

            // Cleanup function for useEffect
            return () => {
                if (socketRef.current) {
                    console.log('Closing Socket.IO connection...');
                    socketRef.current.off('connect');
                    socketRef.current.off('connect_error');
                    socketRef.current.off('newNotification');
                    socketRef.current.off('disconnect');
                    socketRef.current.close();
                    socketRef.current = null; // Clear the ref
                }
            };
        } else if ((!isLoggedIn || !isSeller || !user?._id || !jwtToken) && socketRef.current) {
            // Disconnect and clean up if user logs out, is no longer a seller, or token is gone
            console.log('Auth state changed, closing Socket.IO connection and clearing notifications.');
            socketRef.current.off('connect');
            socketRef.current.off('connect_error');
            socketRef.current.off('newNotification');
            socketRef.current.off('disconnect');
            socketRef.current.close();
            socketRef.current = null; // Clear the ref
            setNotifications([]);
            setUnreadCount(0);
        }
        // Dependencies: Re-run if auth state or user ID changes
    }, [isLoggedIn, isSeller, user?._id, jwtToken]);


    // 2. Fetch Initial Notifications
    const fetchNotifications = useCallback(async () => {
        // Ensure user is logged in, is a seller, and auth loading is complete before fetching
        if (!isLoggedIn || !isSeller || isAuthLoading || !user?._id) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        try {
            console.log('Fetching initial notifications...');
            const res = await authAxios.get(`${API_URL}/all`);

            // Always check for success status first, then data structure
            if (res.data.status === 'success' && Array.isArray(res.data.data.notifications)) {
                const fetchedNotifs = res.data.data.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotifications(fetchedNotifs);
                const unread = fetchedNotifs.filter(n => !n.isRead).length;
                setUnreadCount(unread);
            } else if (Array.isArray(res.data)) { // Fallback if backend directly returns array
                console.warn("Backend returned a direct array for notifications, consider wrapping it in { status: 'success', data: { notifications: [...] } } for consistency.");
                const fetchedNotifs = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotifications(fetchedNotifs);
                const unread = fetchedNotifs.filter(n => !n.isRead).length;
                setUnreadCount(unread);
            } else {
                console.error("Unexpected notification response format:", res.data);
                toast.error("Failed to load notifications: Unexpected data format from server.");
                setNotifications([]);
                setUnreadCount(0);
            }

        } catch (err) {
            console.error('Error fetching notifications:', err.response?.data?.message || err.message, err);
            // The authAxios interceptor will handle 401s (auto-logout)
            if (err.response?.status !== 401) {
                toast.error("Failed to load notifications. Please try again.");
            }
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isLoggedIn, isSeller, isAuthLoading, user?._id, authAxios]);

    useEffect(() => {
        // Only fetch if auth loading is done
        if (!isAuthLoading) {
            fetchNotifications();
        }
    }, [isAuthLoading, fetchNotifications]);


    // 3. Mark Notification Methods
    const markNotificationAsRead = useCallback(async (id) => {
        if (!isLoggedIn || !isSeller || !id) {
            toast.error("Authentication required or invalid notification ID.");
            return;
        }
        // Optimistic UI update
        setNotifications(prevNotifs => {
            const updatedNotifs = prevNotifs.map(notif =>
                notif._id === id ? { ...notif, isRead: true } : notif
            );
            // Only decrement unread count if it was truly unread
            const wasUnread = prevNotifs.find(n => n._id === id && !n.isRead);
            if (wasUnread) {
                setUnreadCount(prevCount => Math.max(0, prevCount - 1));
            }
            return updatedNotifs;
        });

        try {
            await authAxios.put(`${API_URL}/${id}/read`);
            // If successful, UI already updated
        } catch (err) {
            console.error('Error marking notification as read:', err.response?.data?.message || err.message, err);
            // Revert UI on error (pessimistic update for error case)
            setNotifications(prevNotifs => prevNotifs.map(notif =>
                notif._id === id ? { ...notif, isRead: false } : notif // Revert to unread
            ));
            setUnreadCount(prevCount => prevCount + 1); // Increment count back
            if (err.response?.status !== 401) {
                toast.error("Failed to mark notification as read. Please try again.");
            }
        }
    }, [isLoggedIn, isSeller, authAxios]);

    const markAllNotificationsAsRead = useCallback(async () => {
        if (!isLoggedIn || !isSeller || unreadCount === 0) {
            return;
        }
        // Optimistic UI update
        setNotifications(prevNotifs => prevNotifs.map(notif => ({ ...notif, isRead: true })));
        setUnreadCount(0);

        try {
            await authAxios.put(`${API_URL}/mark-all-read`);
            toast.success("All notifications marked as read.");
        } catch (err) {
            console.error('Error marking all notifications as read:', err.response?.data?.message || err.message, err);
            // Revert UI on error (pessimistic update for error case)
            // This is trickier for markAll, might need to re-fetch or find original unread states
            // For simplicity, we just show error and user can re-try
            // A full revert would require storing previous state or re-fetching
            fetchNotifications(); // Re-fetch to synchronize state
            if (err.response?.status !== 401) {
                toast.error("Failed to mark all notifications as read. Please try again.");
            }
        }
    }, [isLoggedIn, isSeller, unreadCount, authAxios, fetchNotifications]); // Added fetchNotifications here

    // 4. Simulation Functions (for dev/testing)
    const simulateNotification = useCallback(async (type, message = "Simulated message") => {
        if (!isLoggedIn || !isSeller || !user?._id) {
            toast.error("Please log in as a seller to simulate notifications.");
            return;
        }
        try {
            // Ensure this endpoint on backend uses `io.to(userId).emit(...)`
            const res = await authAxios.post(`${API_URL}/simulate-${type}/${user._id}`, { message, title: `Simulated ${type}` });
            console.log(`Simulated ${type} notification via API:`, res.data);
            // The actual 'newNotification' event will be received via Socket.IO
            toast.success(`Successfully triggered a new ${type} notification (check real-time).`);
        } catch (err) {
            console.error(`Error simulating ${type} notification:`, err.response?.data?.message || err.message, err);
            toast.error(`Failed to simulate ${type} notification.`);
        }
    }, [isLoggedIn, isSeller, user?._id, authAxios]);


    const contextValue = useMemo(() => ({
        notifications,
        unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        simulateNotification,
        // If you need the socket instance for advanced uses, you could expose it:
        // socket: socketRef.current
    }), [
        notifications,
        unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        simulateNotification,
        // socketRef.current // Only if you expose it in contextValue
    ]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};