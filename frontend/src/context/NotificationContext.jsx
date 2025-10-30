import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import notificationSounds from '../utils/notificationSounds';

// Feature flag: disable in-app notifications API entirely
const IN_APP_NOTIFICATIONS_ENABLED = false;

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { api, user } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch notifications
  const fetchNotifications = async (page = 1, limit = 20) => {
    // Disabled or not authenticated: no-op
    if (!IN_APP_NOTIFICATIONS_ENABLED || !user) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/in-app-notifications/user?page=${page}&limit=${limit}`);
      const { notifications: newNotifications, pagination } = response.data.data;
      
      if (page === 1) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      
      setUnreadCount(pagination.unreadCount);
    } catch (error) {
      // Silently fail if notifications endpoint doesn't exist
      if (error.response?.status !== 404) {
        console.error('Error fetching notifications:', error);
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification count for navbar
  const fetchNotificationCount = async () => {
    // Disabled or not authenticated: no-op
    if (!IN_APP_NOTIFICATIONS_ENABLED || !user) {
      return;
    }

    try {
      const response = await api.get('/in-app-notifications/count');
      const newUnreadCount = response.data.data.unreadCount;
      
      // Play sound only if unread count actually increased and not on initial load
      if (isInitialized && newUnreadCount > unreadCount && newUnreadCount > 0 && unreadCount >= 0) {
        const soundPriority = newUnreadCount > 5 ? 'urgent' : 'high';
        notificationSounds.play(soundPriority);
      }
      
      setUnreadCount(newUnreadCount);
      if (!isInitialized) {
        setIsInitialized(true);
      }
    } catch (error) {
      // Silently fail if notifications endpoint doesn't exist
      if (error.response?.status !== 404) {
        console.error('Error fetching notification count:', error);
      }
      setUnreadCount(0);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    // Disabled or not authenticated: no-op
    if (!IN_APP_NOTIFICATIONS_ENABLED || !user) {
      return;
    }

    try {
      await api.patch(`/in-app-notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    // Disabled or not authenticated: no-op
    if (!IN_APP_NOTIFICATIONS_ENABLED || !user) {
      return;
    }

    try {
      await api.patch('/in-app-notifications/mark-all-read');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification (admin only)
  const deleteNotification = async (notificationId) => {
    // Disabled or not authenticated: no-op
    if (!IN_APP_NOTIFICATIONS_ENABLED || !user) {
      return;
    }

    try {
      await api.delete(`/in-app-notifications/${notificationId}`);
      
      // Remove from local state
      setNotifications(prev => 
        prev.filter(notification => notification._id !== notificationId)
      );
      
      // Update unread count if it was unread
      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Dismiss notification
  const dismissNotification = async (notificationId) => {
    // Disabled or not authenticated: no-op
    if (!IN_APP_NOTIFICATIONS_ENABLED || !user) {
      return;
    }

    try {
      await api.patch(`/in-app-notifications/${notificationId}/dismiss`);
      
      // Remove from local state
      setNotifications(prev => 
        prev.filter(notification => notification._id !== notificationId)
      );
      
      // Update unread count if it was unread
      const dismissedNotification = notifications.find(n => n._id === notificationId);
      if (dismissedNotification && !dismissedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Clear notifications when user logs out
  useEffect(() => {
    if (!IN_APP_NOTIFICATIONS_ENABLED || !user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsInitialized(false);
    }
  }, [user]);

  // Auto-refresh notification count every 60 seconds with visual feedback
  useEffect(() => {
    // Only start intervals if enabled and user is authenticated
    if (!IN_APP_NOTIFICATIONS_ENABLED || !user) {
      return;
    }

    fetchNotificationCount();
    
    const interval = setInterval(() => {
      fetchNotificationCount();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [user]); // Add user as dependency

  // Real-time updates for new notifications (every 20 seconds)
  useEffect(() => {
    // Only start intervals if enabled and user is authenticated
    if (!IN_APP_NOTIFICATIONS_ENABLED || !user) {
      return;
    }

    const realTimeInterval = setInterval(() => {
      fetchNotifications(1, 5); // Fetch latest 5 notifications
    }, 20000); // 20 seconds

    return () => clearInterval(realTimeInterval);
  }, [user]); // Add user as dependency

  // Enable audio on user interaction
  useEffect(() => {
    const enableAudio = () => {
      notificationSounds.enableAudio();
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);

    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchNotificationCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    dismissNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
