import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Filter, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationStore } from '@/store/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    // Fetch notifications when component mounts
    fetchNotifications();
    getUnreadCount();
    
    // Set up polling for new notifications every 60 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      getUnreadCount();
    }, 60000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array to run only once

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    await getUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    await getUnreadCount();
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_update':
        return '🏗️';
      case 'task_assigned':
        return '📋';
      case 'task_completed':
        return '✅';
      case 'document_uploaded':
        return '📄';
      case 'document_approved':
        return '✔️';
      case 'deadline_approaching':
        return '⏰';
      case 'system_announcement':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300 bg-white';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
              <TabsList className="grid grid-cols-2 mx-4 mb-3" style={{ width: 'calc(100% - 2rem)' }}>
                <TabsTrigger value="all" className="text-sm">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread" className="text-sm">Unread ({unreadCount})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={filter} className="mt-0">
                <ScrollArea className="h-96">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                      <Bell className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">
                        {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'p-4 border-l-4 hover:bg-gray-50 cursor-pointer transition-colors',
                            getPriorityColor(notification.priority),
                            !notification.isRead && 'font-medium'
                          )}
                          onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className={cn(
                                  'text-sm truncate',
                                  !notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                                )}>
                                  {notification.title}
                                </h4>
                                
                                <div className="flex items-center space-x-1 ml-2">
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  )}
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              {notification.actionUrl && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto text-xs mt-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle action URL navigation
                                    window.location.href = notification.actionUrl!;
                                  }}
                                >
                                  View Details →
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          {notifications.length > 0 && (
            <div className="border-t p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                  window.location.href = '/notifications';
                }}
              >
                View All Notifications
              </Button>
            </div>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
}

// Notification toast component for real-time notifications
export function NotificationToast({ 
  notification, 
  onDismiss 
}: { 
  notification: any; 
  onDismiss: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Allow animation to complete
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full">
      <Card className={cn(
        'w-80 shadow-lg border-l-4',
        getPriorityColor(notification.priority)
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-lg">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {notification.actionUrl && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  window.location.href = notification.actionUrl;
                  setIsVisible(false);
                }}
              >
                View Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'border-l-red-500 bg-red-50';
    case 'high':
      return 'border-l-orange-500 bg-orange-50';
    case 'normal':
      return 'border-l-blue-500 bg-blue-50';
    case 'low':
      return 'border-l-gray-500 bg-gray-50';
    default:
      return 'border-l-gray-300 bg-white';
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'project_update':
      return '🏗️';
    case 'task_assigned':
      return '📋';
    case 'task_completed':
      return '✅';
    case 'document_uploaded':
      return '📄';
    case 'document_approved':
      return '✔️';
    case 'deadline_approaching':
      return '⏰';
    case 'system_announcement':
      return '📢';
    default:
      return '🔔';
  }
}