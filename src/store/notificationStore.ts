import { create } from 'zustand';
import { notificationsApi } from '@/lib/api';
import { socketManager } from '@/lib/socket';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    types?: string[];
    priority?: string;
  }) => Promise<void>;
  getUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (params = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await notificationsApi.getAll(params);
      
      set({
        notifications: response.data.data || [],
        unreadCount: response.data.unreadCount || 0,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      set({
        error: error.message || 'Failed to fetch notifications',
        isLoading: false
      });
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      // Add comprehensive null/undefined checks
      if (!response) {
        set({ unreadCount: 0 });
        return;
      }
      // Handle multiple possible response formats safely
      const count = response?.data?.unreadCount ??
                   response?.data?.data?.unreadCount ??
                   response?.unreadCount ??
                   0;
      set({ unreadCount: typeof count === 'number' ? count : 0 });
    } catch (error: any) {
      // Silently handle error - API might not be available yet
      // Don't log to console in production
      if (import.meta.env.DEV) {
        console.warn('Notification API not available:', error.message);
      }
      // Set unreadCount to 0 on error to prevent undefined state
      set({ unreadCount: 0 });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      
      set(state => ({
        notifications: state.notifications.map(notification =>
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAllAsRead();
      
      set(state => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0
      }));
    } catch (error: any) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1
    }));
  },

  clearError: () => {
    set({ error: null });
  }
}));

// Initialize socket listeners for real-time notifications
if (typeof window !== 'undefined') {
  window.addEventListener('socket:notification', (event: any) => {
    const notification = event.detail;
    useNotificationStore.getState().addNotification(notification);
  });
}