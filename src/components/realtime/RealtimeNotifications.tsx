import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { wsService } from '@/services/websocket.service';
import { Bell, X, Circle, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
  userName?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function RealtimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Listen for real-time updates
    wsService.on('update', (update: any) => {
      const notification: Notification = {
        id: `notif-${Date.now()}-${Math.random()}`,
        type: 'info',
        title: getUpdateTitle(update),
        message: getUpdateMessage(update),
        timestamp: new Date(),
        read: false,
        userId: update.userId,
        userName: update.userName,
      };

      setNotifications(prev => [notification, ...prev].slice(0, 20)); // Keep last 20
      setUnreadCount(prev => prev + 1);
    });

    // Listen for direct notifications
    wsService.on('notification', (notif: any) => {
      const notification: Notification = {
        id: `notif-${Date.now()}-${Math.random()}`,
        type: notif.priority === 'high' ? 'error' : 'info',
        title: notif.title || 'Notification',
        message: notif.message,
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [notification, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      wsService.off('update', () => {});
      wsService.off('notification', () => {});
    };
  }, []);

  const getUpdateTitle = (update: any): string => {
    const titles: Record<string, string> = {
      'project:create': 'New Project Created',
      'project:update': 'Project Updated',
      'task:create': 'New Task Added',
      'task:update': 'Task Updated',
      'task:complete': 'Task Completed',
      'file:upload': 'File Uploaded',
      'comment:add': 'New Comment',
    };
    return titles[`${update.type}:${update.action}`] || 'Update';
  };

  const getUpdateMessage = (update: any): string => {
    const userName = update.userName || 'Someone';
    const messages: Record<string, string> = {
      'project:create': `${userName} created a new project`,
      'project:update': `${userName} updated project details`,
      'task:create': `${userName} added a new task`,
      'task:update': `${userName} updated a task`,
      'task:complete': `${userName} completed a task`,
      'file:upload': `${userName} uploaded a new file`,
      'comment:add': `${userName} added a comment`,
    };
    return messages[`${update.type}:${update.action}`] || `${userName} made an update`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          "hover:bg-gray-100",
          isOpen && "bg-gray-100"
        )}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center"
          >
            <span className="text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.div>
        )}
      </button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    You'll see updates here when they happen
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    className={cn(
                      "px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-colors",
                      !notification.read && "bg-blue-50/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>

                          {/* Unread indicator */}
                          {!notification.read && (
                            <Circle className="h-2 w-2 fill-blue-500 text-blue-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>

                        {/* Action button */}
                        {notification.action && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.action?.onClick();
                              setIsOpen(false);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                          >
                            {notification.action.label}
                          </button>
                        )}
                      </div>

                      {/* Close button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t">
                <button
                  onClick={() => {
                    setNotifications([]);
                    setUnreadCount(0);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}