import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { ApiError } from '../middleware/errorHandler'
import { NotificationService } from '../services/notificationService'
import { NotificationType, NotificationPriority } from '../models/Notification'
import { logger } from '../utils/logger'

export class NotificationController {
  // Get user notifications
  static async getUserNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        types,
        priority
      } = req.query

      const typeArray = types ? (types as string).split(',') as NotificationType[] : undefined

      const result = await NotificationService.getUserNotifications(req.user.id, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        unreadOnly: unreadOnly === 'true',
        types: typeArray,
        priority: priority as NotificationPriority
      })

      res.json({
        notifications: result.notifications,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string))
        },
        unreadCount: result.unreadCount
      })
    } catch (error) {
      next(error)
    }
  }

  // Get unread notification count
  static async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      const result = await NotificationService.getUserNotifications(req.user.id, {
        page: 1,
        limit: 1,
        unreadOnly: true
      })

      res.json({
        unreadCount: result.unreadCount
      })
    } catch (error) {
      next(error)
    }
  }

  // Mark notification as read
  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      const { id } = req.params

      const success = await NotificationService.markAsRead(id, req.user.id)

      if (!success) {
        throw new ApiError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND')
      }

      res.json({
        message: 'Notification marked as read'
      })
    } catch (error) {
      next(error)
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      const updatedCount = await NotificationService.markAllAsRead(req.user.id)

      res.json({
        message: 'All notifications marked as read',
        updatedCount
      })
    } catch (error) {
      next(error)
    }
  }

  // Send system announcement (admin only)
  static async sendSystemAnnouncement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      if (req.user.role !== 'admin') {
        throw new ApiError(403, 'Only administrators can send system announcements', 'ADMIN_REQUIRED')
      }

      const { title, message, userIds, priority = NotificationPriority.NORMAL } = req.body

      if (!title || !message) {
        throw new ApiError(400, 'Title and message are required', 'MISSING_REQUIRED_FIELDS')
      }

      await NotificationService.sendSystemAnnouncement(title, message, userIds, priority)

      logger.info(`System announcement sent by ${req.user.email}: ${title}`)

      res.json({
        message: 'System announcement sent successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  // Get notification statistics (admin only)
  static async getNotificationStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        throw new ApiError(403, 'Access denied', 'ACCESS_DENIED')
      }

      // This would be implemented with proper database queries
      // For now, returning a basic response
      res.json({
        message: 'Notification statistics - to be implemented',
        statistics: {
          totalNotifications: 0,
          unreadNotifications: 0,
          notificationsByType: {},
          recentActivity: []
        }
      })
    } catch (error) {
      next(error)
    }
  }

  // Test notification (development only)
  static async sendTestNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      // Only allow in development environment
      if (process.env.NODE_ENV === 'production') {
        throw new ApiError(403, 'Test notifications not allowed in production', 'PRODUCTION_RESTRICTION')
      }

      const { title, message, type = NotificationType.SYSTEM_ANNOUNCEMENT } = req.body

      await NotificationService.sendNotification({
        title: title || 'Test Notification',
        message: message || 'This is a test notification from the system.',
        type,
        priority: NotificationPriority.NORMAL,
        recipientId: req.user.id,
        senderId: req.user.id
      })

      res.json({
        message: 'Test notification sent successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  // Get notification types and priorities (for frontend)
  static async getNotificationTypes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({
        types: Object.values(NotificationType),
        priorities: Object.values(NotificationPriority)
      })
    } catch (error) {
      next(error)
    }
  }
}