import Notification, { NotificationType, NotificationPriority } from '../models/Notification'
import { User } from '../models/User'
import { Project } from '../models/Project'
import { Task } from '../models/Task'
import { Document } from '../models/Document'
import { logger } from '../utils/logger'
import { Op } from 'sequelize'

export interface NotificationData {
  title: string
  message: string
  type: NotificationType
  priority?: NotificationPriority
  recipientId?: string
  recipientIds?: string[]
  senderId?: string
  relatedEntityType?: string
  relatedEntityId?: string
  actionUrl?: string
  scheduledFor?: Date
  expiresAt?: Date
  metadata?: Record<string, any>
}

export class NotificationService {
  // Send a single notification
  static async sendNotification(data: NotificationData): Promise<Notification | null> {
    try {
      const notification = await Notification.create({
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || NotificationPriority.NORMAL,
        recipientId: data.recipientId!,
        senderId: data.senderId,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        actionUrl: data.actionUrl,
        scheduledFor: data.scheduledFor,
        expiresAt: data.expiresAt,
        metadata: data.metadata || {}
      })

      logger.info(`Notification sent: ${data.title} to user ${data.recipientId}`)
      return notification
    } catch (error) {
      logger.error('Failed to send notification:', error)
      return null
    }
  }

  // Send notifications to multiple recipients
  static async sendBulkNotifications(data: NotificationData): Promise<Notification[]> {
    if (!data.recipientIds || data.recipientIds.length === 0) {
      return []
    }

    const notifications: Notification[] = []
    
    for (const recipientId of data.recipientIds) {
      const notification = await this.sendNotification({
        ...data,
        recipientId
      })
      
      if (notification) {
        notifications.push(notification)
      }
    }

    return notifications
  }

  // Project-related notifications
  static async notifyProjectCreated(project: any, creatorId: string): Promise<void> {
    const recipients = [project.clientId, project.projectLeadId, project.designerId].filter(Boolean)
    
    await this.sendBulkNotifications({
      title: 'New Project Created',
      message: `A new project "${project.name}" has been created and you have been assigned to it.`,
      type: NotificationType.PROJECT_UPDATE,
      priority: NotificationPriority.NORMAL,
      recipientIds: recipients.filter(id => id !== creatorId),
      senderId: creatorId,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
      actionUrl: `/projects/${project.id}`
    })
  }

  static async notifyProjectUpdated(project: any, updaterId: string): Promise<void> {
    const recipients = [project.clientId, project.projectLeadId, project.designerId].filter(Boolean)
    
    await this.sendBulkNotifications({
      title: 'Project Updated',
      message: `Project "${project.name}" has been updated.`,
      type: NotificationType.PROJECT_UPDATE,
      priority: NotificationPriority.NORMAL,
      recipientIds: recipients.filter(id => id !== updaterId),
      senderId: updaterId,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
      actionUrl: `/projects/${project.id}`
    })
  }

  // Task-related notifications
  static async notifyTaskAssigned(task: any, assignerId: string): Promise<void> {
    if (!task.assigneeId) return

    await this.sendNotification({
      title: 'Task Assigned',
      message: `You have been assigned a new task: "${task.title}"`,
      type: NotificationType.TASK_ASSIGNED,
      priority: task.priority === 'urgent' ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      recipientId: task.assigneeId,
      senderId: assignerId,
      relatedEntityType: 'task',
      relatedEntityId: task.id,
      actionUrl: `/projects/${task.projectId}/tasks/${task.id}`
    })
  }

  static async notifyTaskCompleted(task: any, completerId: string): Promise<void> {
    // Get project details for notification
    const project = await Project.findByPk(task.projectId)
    if (!project) return

    const recipients = [project.clientId, project.projectLeadId, project.designerId, task.reporterId]
      .filter(Boolean)
      .filter(id => id !== completerId)

    await this.sendBulkNotifications({
      title: 'Task Completed',
      message: `Task "${task.title}" has been completed in project "${project.name}".`,
      type: NotificationType.TASK_COMPLETED,
      priority: NotificationPriority.NORMAL,
      recipientIds: recipients,
      senderId: completerId,
      relatedEntityType: 'task',
      relatedEntityId: task.id,
      actionUrl: `/projects/${task.projectId}/tasks/${task.id}`
    })
  }

  // Document-related notifications
  static async notifyDocumentUploaded(document: any, uploaderId: string): Promise<void> {
    if (!document.projectId) return

    const project = await Project.findByPk(document.projectId)
    if (!project) return

    const recipients = [project.clientId, project.projectLeadId, project.designerId]
      .filter(Boolean)
      .filter(id => id !== uploaderId)

    await this.sendBulkNotifications({
      title: 'Document Uploaded',
      message: `A new document "${document.name}" has been uploaded to project "${project.name}".`,
      type: NotificationType.DOCUMENT_UPLOADED,
      priority: NotificationPriority.NORMAL,
      recipientIds: recipients,
      senderId: uploaderId,
      relatedEntityType: 'document',
      relatedEntityId: document.id,
      actionUrl: `/projects/${document.projectId}/documents/${document.id}`
    })
  }

  static async notifyDocumentApproved(document: any, approverId: string): Promise<void> {
    await this.sendNotification({
      title: 'Document Approved',
      message: `Your document "${document.name}" has been approved.`,
      type: NotificationType.DOCUMENT_APPROVED,
      priority: NotificationPriority.NORMAL,
      recipientId: document.userId,
      senderId: approverId,
      relatedEntityType: 'document',
      relatedEntityId: document.id,
      actionUrl: `/projects/${document.projectId}/documents/${document.id}`
    })
  }

  // Deadline notifications
  static async notifyDeadlineApproaching(task: any): Promise<void> {
    const recipients = [task.assigneeId, task.reporterId].filter(Boolean)
    const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    await this.sendBulkNotifications({
      title: 'Deadline Approaching',
      message: `Task "${task.title}" is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`,
      type: NotificationType.DEADLINE_APPROACHING,
      priority: daysUntilDue <= 1 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      recipientIds: recipients,
      relatedEntityType: 'task',
      relatedEntityId: task.id,
      actionUrl: `/projects/${task.projectId}/tasks/${task.id}`,
      metadata: {
        daysUntilDue,
        originalDueDate: task.dueDate
      }
    })
  }

  // System notifications
  static async sendSystemAnnouncement(
    title: string, 
    message: string, 
    userIds?: string[], 
    priority: NotificationPriority = NotificationPriority.NORMAL
  ): Promise<void> {
    let recipients = userIds

    // If no specific users provided, send to all active users
    if (!recipients) {
      const users = await User.findAll({
        where: { status: 'active' },
        attributes: ['id']
      })
      recipients = users.map(user => user.id)
    }

    await this.sendBulkNotifications({
      title,
      message,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      priority,
      recipientIds: recipients,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expire in 30 days
    })
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, recipientId: userId }
      })

      if (!notification) {
        return false
      }

      await notification.markAsRead()
      return true
    } catch (error) {
      logger.error('Failed to mark notification as read:', error)
      return false
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<number> {
    try {
      const [updatedCount] = await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { recipientId: userId, isRead: false } }
      )

      return updatedCount
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error)
      return 0
    }
  }

  // Get notifications for a user
  static async getUserNotifications(
    userId: string, 
    options: {
      page?: number
      limit?: number
      unreadOnly?: boolean
      types?: NotificationType[]
      priority?: NotificationPriority
    } = {}
  ): Promise<{ notifications: Notification[], total: number, unreadCount: number }> {
    const { page = 1, limit = 20, unreadOnly = false, types, priority } = options
    const offset = (page - 1) * limit

    const where: any = { recipientId: userId }

    if (unreadOnly) {
      where.isRead = false
    }

    if (types && types.length > 0) {
      where.type = { [Op.in]: types }
    }

    if (priority) {
      where.priority = priority
    }

    // Don't show expired notifications
    where[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } }
    ]

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.findAll({
        where,
        include: [
          { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      }),
      Notification.count({ where }),
      Notification.count({ where: { recipientId: userId, isRead: false } })
    ])

    return { notifications, total, unreadCount }
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications(): Promise<number> {
    try {
      const deletedCount = await Notification.destroy({
        where: {
          expiresAt: { [Op.lt]: new Date() }
        }
      })

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} expired notifications`)
      }

      return deletedCount
    } catch (error) {
      logger.error('Failed to cleanup expired notifications:', error)
      return 0
    }
  }

  // Schedule deadline notifications
  static async scheduleDeadlineNotifications(): Promise<void> {
    try {
      // Find tasks due in 3 days, 1 day, and overdue
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      const oneDayFromNow = new Date()
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)

      const tasks = await Task.findAll({
        where: {
          dueDate: {
            [Op.lte]: threeDaysFromNow
          },
          status: { [Op.notIn]: ['completed', 'cancelled'] }
        },
        include: [{ model: Project, as: 'project' }]
      })

      for (const task of tasks) {
        // Check if we've already sent a notification for this deadline
        const existingNotification = await Notification.findOne({
          where: {
            type: NotificationType.DEADLINE_APPROACHING,
            relatedEntityType: 'task',
            relatedEntityId: task.id,
            createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
          }
        })

        if (!existingNotification) {
          await this.notifyDeadlineApproaching(task)
        }
      }
    } catch (error) {
      logger.error('Failed to schedule deadline notifications:', error)
    }
  }
}