import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { FaBell, FaTimes, FaCheck, FaTrash, FaEye, FaCog } from 'react-icons/fa';
import { usePermission } from './PermissionGuard';
import { useSystemColors } from '../hooks/useSystemColors';
import NotificationSettings from './NotificationSettings';

const NotificationDropdown = () => {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, dismissNotification } = useNotifications();
  const { colors } = useSystemColors();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const canDeleteNotifications = usePermission(['admin']);

  // Fallback colors
  const fallbackColors = {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const currentColors = colors || fallbackColors;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setIsRefreshing(true);
      fetchNotifications(1, showAll ? 50 : 10).finally(() => {
        setIsRefreshing(false);
      });
    }
  }, [isOpen, showAll]);

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }

    setIsOpen(false);
  };

  const handleQuickAction = async (action, notification) => {
    try {
      // Mark as read first
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }

      // Handle different quick actions
      switch (action) {
        case 'approve':
          if (notification.relatedLoan) {
            navigate(`/loans/${notification.relatedLoan}/approve`);
          }
          break;
        case 'view':
          if (notification.actionUrl) {
            navigate(notification.actionUrl);
          }
          break;
        case 'dismiss':
          // Dismiss the notification
          await dismissNotification(notification._id);
          break;
        default:
          break;
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Quick action error:', error);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'customer_added':
        return '👤';
      case 'loan_added':
        return '💰';
      case 'loan_approved':
        return '✅';
      case 'loan_rejected':
        return '❌';
      case 'loan_disbursed':
        return '💳';
      case 'loan_completed':
        return '🎉';
      case 'loan_overdue':
        return '⚠️';
      case 'attendance_alert':
        return '⏰';
      case 'system_alert':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-blue-500';
      case 'low':
        return 'border-l-gray-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 10);
  const hasMoreNotifications = notifications.length > 10;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[9999] max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
              {isRefreshing && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                title="Notification Settings"
              >
                <FaCog size={16} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto bg-white dark:bg-gray-800 py-1">
            {displayedNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                <div className="text-2xl mb-2">🔔</div>
                <p className="font-medium">No notifications</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
              </div>
            ) : (
              displayedNotifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 border-t border-r border-b border-gray-100 dark:border-gray-700 mx-1 mb-1 rounded-sm ${
                    notification.isRead ? 'opacity-75' : ''
                  } ${getPriorityColor(notification.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          {canDeleteNotifications && (
                            <button
                              onClick={(e) => handleDeleteNotification(e, notification._id)}
                              className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1"
                            >
                              <FaTrash size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          {notification.actionText && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction('view', notification);
                              }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              {notification.actionText}
                            </button>
                          )}
                          {notification.type === 'loan_added' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction('approve', notification);
                              }}
                              className="text-xs text-white px-2 py-1 rounded"
                              style={{
                                backgroundColor: currentColors.success
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = `${currentColors.success}dd`;
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = currentColors.success;
                              }}
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction('dismiss', notification);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors font-medium"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {hasMoreNotifications && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-semibold py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {showAll ? 'Show less' : `Show all ${notifications.length} notifications`}
              </button>
            </div>
          )}
        </div>
        </>
      )}

      {/* Notification Settings Modal */}
      {showSettings && (
        <NotificationSettings 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

export default NotificationDropdown;
