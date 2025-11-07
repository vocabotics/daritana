import { Router } from 'express'
import { body, query, param } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler'
import { NotificationController } from '../controllers/notification.controller'
import { authenticate, authorize } from '../middleware/auth'
import { ApiError } from '../middleware/errorHandler'
import { UserRole } from '../models/User'
import { NotificationType, NotificationPriority } from '../models/Notification'
import { validationResult } from 'express-validator'

const router = Router()

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation error', 'VALIDATION_ERROR', errors.array()))
  }
  next()
}

// All routes require authentication
router.use(authenticate)

// Get notification types and priorities
router.get('/types', asyncHandler(NotificationController.getNotificationTypes))

// Get user notifications
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('unreadOnly').optional().isBoolean(),
  query('types').optional().isString(),
  query('priority').optional().isIn(Object.values(NotificationPriority)),
  validate
], asyncHandler(NotificationController.getUserNotifications))

// Get unread notification count
router.get('/unread-count', asyncHandler(NotificationController.getUnreadCount))

// Mark notification as read
router.patch('/:id/read', [
  param('id').isUUID().withMessage('Notification ID must be a valid UUID'),
  validate
], asyncHandler(NotificationController.markAsRead))

// Mark all notifications as read
router.patch('/mark-all-read', asyncHandler(NotificationController.markAllAsRead))

// Send system announcement (admin only)
router.post('/system-announcement', [
  authorize(UserRole.ADMIN),
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('message').notEmpty().withMessage('Message is required').isLength({ max: 2000 }),
  body('userIds').optional().isArray(),
  body('userIds.*').optional().isUUID(),
  body('priority').optional().isIn(Object.values(NotificationPriority)),
  validate
], asyncHandler(NotificationController.sendSystemAnnouncement))

// Get notification statistics (admin/staff only)
router.get('/statistics', [
  authorize(UserRole.ADMIN, UserRole.STAFF),
], asyncHandler(NotificationController.getNotificationStatistics))

// Send test notification (development only)
router.post('/test', [
  body('title').optional().isLength({ max: 255 }),
  body('message').optional().isLength({ max: 2000 }),
  body('type').optional().isIn(Object.values(NotificationType)),
  validate
], asyncHandler(NotificationController.sendTestNotification))

export default router