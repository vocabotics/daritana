import { Router } from 'express';

const router = Router();

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    title: 'Welcome to Daritana',
    message: 'Start managing your architecture projects efficiently',
    type: 'system_announcement',
    priority: 'normal',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'New Project Assignment',
    message: 'You have been assigned to KLCC Tower 3 project',
    type: 'project_update',
    priority: 'high',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    title: 'Meeting Reminder',
    message: 'Design review meeting in 30 minutes',
    type: 'meeting_reminder',
    priority: 'urgent',
    isRead: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  }
];

// Get all notifications
router.get('/', (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  
  let filteredNotifications = [...mockNotifications];
  
  if (unreadOnly === 'true') {
    filteredNotifications = filteredNotifications.filter(n => !n.isRead);
  }
  
  res.json({
    success: true,
    data: filteredNotifications,
    unreadCount: mockNotifications.filter(n => !n.isRead).length,
    pagination: {
      total: filteredNotifications.length,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(filteredNotifications.length / Number(limit))
    }
  });
});

// Get unread count
router.get('/unread-count', (req, res) => {
  const unreadCount = mockNotifications.filter(n => !n.isRead).length;
  res.json({
    success: true,
    data: {
      unreadCount: unreadCount
    }
  });
});

// Get notification types
router.get('/types', (req, res) => {
  res.json({
    success: true,
    data: {
      types: ['system_announcement', 'project_update', 'meeting_reminder', 'task_assignment', 'document_review'],
      priorities: ['low', 'normal', 'high', 'urgent']
    }
  });
});

// Mark notification as read
router.patch('/:id/read', (req, res) => {
  const { id } = req.params;
  const notification = mockNotifications.find(n => n.id === id);
  
  if (notification) {
    notification.isRead = true;
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Notification not found'
    });
  }
});

// Mark all as read
router.patch('/mark-all-read', (req, res) => {
  const updatedCount = mockNotifications.filter(n => !n.isRead).length;
  mockNotifications.forEach(n => n.isRead = true);
  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: {
      updatedCount: updatedCount
    }
  });
});

// Send test notification (for testing)
router.post('/test', (req, res) => {
  const { title = 'Test Notification', message = 'This is a test notification', type = 'system_announcement' } = req.body;
  
  const newNotification = {
    id: String(mockNotifications.length + 1),
    title,
    message,
    type,
    priority: 'normal',
    isRead: false,
    createdAt: new Date().toISOString()
  };
  
  mockNotifications.unshift(newNotification);
  
  res.json({
    success: true,
    message: 'Test notification sent',
    data: newNotification
  });
});

export default router;