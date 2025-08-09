// frontend/src/NotificationContext/NotificationContext.jsx
import React, {
    createContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from "react";
import io from "socket.io-client";
import { useAuth } from "../Context/Context"; // Import your custom useAuth hook
import { toast } from "react-toastify";

export const NotificationContext = createContext();

// API_URL will now point to the generic '/api/notifications/my'
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/notifications`;
const SOCKET_URL = import.meta.env.VITE_API_URL;

export const NotificationProvider = ({ children }) => {
    // We now depend on isLoggedIn and user._id, not specifically isSeller
    const { user, isLoggedIn, jwtToken, authAxios, isAuthLoading } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null); // Use useRef to hold the socket instance

    // 1. Socket.IO Connection and Room Joining
    useEffect(() => {
        // Only connect if user is logged in, user ID is available, and not already connected
        // isAuthLoading ensures user object is fully loaded
        if (isLoggedIn && user?._id && jwtToken && !isAuthLoading && !socketRef.current) {
            console.log("Attempting to connect Socket.IO...");
            const newSocket = io(SOCKET_URL, {
                query: { userId: user._id }, // Pass userId for server-side room joining
                extraHeaders: {
                    Authorization: `Bearer ${jwtToken}`, // Pass JWT for potential authentication on socket connection if needed
                },
                withCredentials: true,
                transports: ["websocket", "polling"], // Add explicit transports to prefer websocket
            });

            socketRef.current = newSocket; // Store the socket instance in ref

            newSocket.on("connect", () => {
                console.log("✅ Socket.IO Connected on Frontend.");
                // For generic notifications, the server usually joins the room based on the 'userId' query param
                // upon connection. No need to explicitly 'emit("joinRoom")' unless your server expects it.
                // However, your server.js uses 'joinRoom' event, so let's keep it.
                newSocket.emit("joinRoom", user._id); // Join the user's specific room
            });

            newSocket.on("connect_error", (err) => {
                console.error("❌ Socket.IO Connection Error:", err.message, err.data);
                // Optionally show a toast for connection issues
                // toast.error("Real-time connection failed. Notifications might be delayed.");
            });

            newSocket.on("newNotification", (newNotif) => {
                console.log("🔔 New real-time notification received:", newNotif);
                setNotifications((prevNotifs) => [newNotif, ...prevNotifs]);
                if (!newNotif.isRead) { // Only increment if the new notification is unread
                    setUnreadCount((prevCount) => prevCount + 1);
                }
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

            newSocket.on("updateNotification", (updatedNotif) => {
                console.log("🔄 Real-time notification update received:", updatedNotif);
                setNotifications(prev => {
                    const oldNotif = prev.find(n => n._id === updatedNotif._id);
                    // Update the specific notification
                    const updatedNotifsArray = prev.map(notif =>
                        notif._id === updatedNotif._id ? { ...notif, ...updatedNotif } : notif
                    );

                    // Re-calculate unread count for accuracy
                    const newUnreadCount = updatedNotifsArray.filter(n => !n.isRead).length;
                    setUnreadCount(newUnreadCount);

                    return updatedNotifsArray;
                });
            });


            newSocket.on("disconnect", (reason) => {
                console.log("🔴 Socket.IO Disconnected on Frontend. Reason:", reason);
            });

            // Cleanup function for useEffect
            return () => {
                if (socketRef.current) {
                    console.log("Closing Socket.IO connection...");
                    socketRef.current.off("connect");
                    socketRef.current.off("connect_error");
                    socketRef.current.off("newNotification");
                    socketRef.current.off("updateNotification"); // Cleanup for update event
                    socketRef.current.off("disconnect");
                    socketRef.current.close();
                    socketRef.current = null; // Clear the ref
                }
            };
        } else if (
            // Disconnect and clean up if user logs out or auth state is no longer valid
            (!isLoggedIn || !user?._id || isAuthLoading) && // Added isAuthLoading to avoid premature disconnect
            socketRef.current
        ) {
            console.log(
                "Auth state changed (not logged in or user ID gone), closing Socket.IO connection and clearing notifications."
            );
            socketRef.current.off("connect");
            socketRef.current.off("connect_error");
            socketRef.current.off("newNotification");
            socketRef.current.off("updateNotification");
            socketRef.current.off("disconnect");
            socketRef.current.close();
            socketRef.current = null; // Clear the ref
            setNotifications([]);
            setUnreadCount(0);
        }
        // Dependencies: Re-run if auth state or user ID changes
    }, [isLoggedIn, user?._id, jwtToken, isAuthLoading]); // Removed isSeller from dependencies


    // 2. Fetch Initial Notifications
    const fetchNotifications = useCallback(async () => {
        // Ensure user is logged in and auth loading is complete before fetching
        if (!isLoggedIn || isAuthLoading || !user?._id) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        try {
            console.log("Fetching initial notifications...");
            // Changed API endpoint to the generic '/my'
            const res = await authAxios.get(`${API_BASE_URL}/my`);

            if (res.data.success && Array.isArray(res.data.notifications)) { // Adjusted to expect 'notifications' and 'unreadCount' directly
                const fetchedNotifs = res.data.notifications.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setNotifications(fetchedNotifs);
                setUnreadCount(res.data.unreadCount); // Directly use unreadCount from backend
            } else {
                console.error("Unexpected notification response format:", res.data);
                toast.error(
                    "Failed to load notifications: Unexpected data format from server."
                );
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (err) {
            console.error(
                "Error fetching notifications:",
                err.response?.data?.message || err.message,
                err
            );
            // The authAxios interceptor will handle 401s (auto-logout)
            if (err.response?.status !== 401) {
                toast.error("Failed to load notifications. Please try again.");
            }
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isLoggedIn, isAuthLoading, user?._id, authAxios]); // Removed isSeller from dependencies

    useEffect(() => {
        // Only fetch if auth loading is done
        if (!isAuthLoading) {
            fetchNotifications();
        }
    }, [isAuthLoading, fetchNotifications]);

    // 3. Mark Notification Methods
    const markNotificationAsRead = useCallback(
        async (id) => {
            // Check only for isLoggedIn, not isSeller
            if (!isLoggedIn || !id) {
                toast.error("Authentication required or invalid notification ID.");
                return;
            }
            // Optimistic UI update
            setNotifications((prevNotifs) => {
                const updatedNotifs = prevNotifs.map((notif) =>
                    notif._id === id ? { ...notif, isRead: true } : notif
                );
                // Only decrement unread count if it was truly unread
                const wasUnread = prevNotifs.find((n) => n._id === id && !n.isRead);
                if (wasUnread) {
                    setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
                }
                return updatedNotifs;
            });

            try {
                // Changed PUT to PATCH
                await authAxios.patch(`${API_BASE_URL}/${id}/read`);
                // If successful, UI already updated
            } catch (err) {
                console.error(
                    "Error marking notification as read:",
                    err.response?.data?.message || err.message,
                    err
                );
                // Revert UI on error (pessimistic update for error case)
                setNotifications((prevNotifs) =>
                    prevNotifs.map(
                        (notif) => (notif._id === id ? { ...notif, isRead: false } : notif) // Revert to unread
                    )
                );
                setUnreadCount((prevCount) => prevCount + 1); // Increment count back
                if (err.response?.status !== 401) {
                    toast.error("Failed to mark notification as read. Please try again.");
                }
            }
        },
        [isLoggedIn, authAxios] // Removed isSeller from dependencies
    );

    const markAllNotificationsAsRead = useCallback(async () => {
        // Check only for isLoggedIn, not isSeller
        if (!isLoggedIn || unreadCount === 0) {
            return;
        }
        // Optimistic UI update
        setNotifications((prevNotifs) =>
            prevNotifs.map((notif) => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);

        try {
            // Changed PUT to PATCH
            await authAxios.patch(`${API_BASE_URL}/mark-all-read`);
            toast.success("All notifications marked as read.");
        } catch (err) {
            console.error(
                "Error marking all notifications as read:",
                err.response?.data?.message || err.message,
                err
            );
            // For markAll, re-fetching is the most robust way to revert on error
            fetchNotifications();
            if (err.response?.status !== 401) {
                toast.error(
                    "Failed to mark all notifications as read. Please try again."
                );
            }
        }
    }, [isLoggedIn, unreadCount, authAxios, fetchNotifications]); // Removed isSeller from dependencies

    // 4. Simulation Functions (commented out as they are for dev/testing and
    // the backend simulation routes were removed from generic notificationRoutes.js)
    /*
    const simulateNotification = useCallback(
        async (type, message = "Simulated message") => {
            if (!isLoggedIn || !user?._id) { // Removed isSeller
                toast.error("Please log in to simulate notifications.");
                return;
            }
            try {
                // This would now require a generic simulation endpoint that accepts userId and type
                // or specific endpoints for admin/customer/vendor.
                // As per our refactor, these specific simulation routes were removed from the generic notificationRoutes.js
                // so this call will likely fail unless you re-add simulation routes elsewhere.
                const res = await authAxios.post(
                    `${API_BASE_URL}/simulate-${type}/${user._id}`, // This path would no longer exist
                    { message, title: `Simulated ${type}` }
                );
                console.log(`Simulated ${type} notification via API:`, res.data);
                toast.success(
                    `Successfully triggered a new ${type} notification (check real-time).`
                );
            } catch (err) {
                console.error(
                    `Error simulating ${type} notification:`,
                    err.response?.data?.message || err.message,
                    err
                );
                toast.error(`Failed to simulate ${type} notification.`);
            }
        },
        [isLoggedIn, user?._id, authAxios] // Removed isSeller
    );
    */

    const contextValue = useMemo(
        () => ({
            notifications,
            unreadCount,
            markNotificationAsRead,
            markAllNotificationsAsRead,
            // simulateNotification, // Commented out as function is commented out
        }),
        [
            notifications,
            unreadCount,
            markNotificationAsRead,
            markAllNotificationsAsRead,
            // simulateNotification, // Commented out
        ]
    );

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};
