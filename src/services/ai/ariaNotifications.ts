/**
 * ARIA Notification System
 * Intelligent notification delivery and management
 */

import { toast } from 'sonner'
import { aria } from './ariaAssistant'

export interface ARIANotification {
  id: string
  type: 'task-reminder' | 'deadline-warning' | 'escalation' | 'achievement' | 'insight' | 'standup'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  targetUserId: string
  taskId?: string
  projectId?: string
  actions?: Array<{
    label: string
    action: () => void
  }>
  deliveryChannels: Array<'in-app' | 'email' | 'slack' | 'whatsapp'>
  scheduledTime?: Date
  expiresAt?: Date
  metadata?: Record<string, any>
  read: boolean
  createdAt: Date
}

export interface NotificationTemplate {
  id: string
  name: string
  type: ARIANotification['type']
  template: string
  variables: string[]
  tone: 'friendly' | 'professional' | 'urgent' | 'celebratory'
  channels: ARIANotification['deliveryChannels']
}

class ARIANotificationService {
  private notifications: Map<string, ARIANotification> = new Map()
  private templates: Map<string, NotificationTemplate> = new Map()
  private userPreferences: Map<string, UserNotificationPreferences> = new Map()

  constructor() {
    this.initializeTemplates()
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates() {
    const templates: NotificationTemplate[] = [
      {
        id: 'task_reminder_friendly',
        name: 'Friendly Task Reminder',
        type: 'task-reminder',
        template: `Hi {{userName}}! 👋 Just a friendly reminder about "{{taskName}}". It's due {{dueTime}}. Need any help getting it done?`,
        variables: ['userName', 'taskName', 'dueTime'],
        tone: 'friendly',
        channels: ['in-app', 'slack'],
      },
      {
        id: 'deadline_warning',
        name: 'Deadline Warning',
        type: 'deadline-warning',
        template: `⚠️ Attention: "{{taskName}}" is due in {{hoursRemaining}} hours. This is a {{priority}} priority task for {{projectName}}. Please update the status or request an extension if needed.`,
        variables: ['taskName', 'hoursRemaining', 'priority', 'projectName'],
        tone: 'urgent',
        channels: ['in-app', 'email', 'slack'],
      },
      {
        id: 'escalation_manager',
        name: 'Manager Escalation',
        type: 'escalation',
        template: `{{managerName}}, this requires your attention: {{teamMemberName}}'s task "{{taskName}}" is {{daysOverdue}} days overdue. The task is critical for {{projectName}}. Suggested actions: {{suggestedActions}}`,
        variables: ['managerName', 'teamMemberName', 'taskName', 'daysOverdue', 'projectName', 'suggestedActions'],
        tone: 'professional',
        channels: ['email', 'slack'],
      },
      {
        id: 'achievement_celebration',
        name: 'Achievement Celebration',
        type: 'achievement',
        template: `🎉 Fantastic work, {{userName}}! You've completed {{taskCount}} tasks this week, {{percentageAhead}}% ahead of schedule! Your dedication to {{projectName}} is making a real difference. Keep up the excellent work!`,
        variables: ['userName', 'taskCount', 'percentageAhead', 'projectName'],
        tone: 'celebratory',
        channels: ['in-app', 'slack'],
      },
      {
        id: 'daily_standup',
        name: 'Daily Standup Request',
        type: 'standup',
        template: `Good morning {{userName}}! 🌅 Time for your daily standup. What are your top 3 priorities today? Any blockers I can help with?`,
        variables: ['userName'],
        tone: 'friendly',
        channels: ['in-app', 'slack'],
      },
    ]

    templates.forEach(t => this.templates.set(t.id, t))
  }

  /**
   * Send a notification
   */
  async sendNotification(params: {
    type: ARIANotification['type']
    priority: ARIANotification['priority']
    targetUserId: string
    taskId?: string
    projectId?: string
    variables?: Record<string, any>
    customMessage?: string
  }): Promise<void> {
    const { type, priority, targetUserId, taskId, projectId, variables, customMessage } = params

    // Get user preferences
    const userPrefs = this.getUserPreferences(targetUserId)

    // Check if user wants this type of notification
    if (!this.shouldSendNotification(type, priority, userPrefs)) {
      return
    }

    // Generate message if not provided
    const message = customMessage || await this.generateMessage(type, variables || {})

    // Create notification
    const notification: ARIANotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type,
      priority,
      title: this.getNotificationTitle(type),
      message,
      targetUserId,
      taskId,
      projectId,
      deliveryChannels: this.getDeliveryChannels(type, priority, userPrefs),
      read: false,
      createdAt: new Date(),
    }

    // Store notification
    this.notifications.set(notification.id, notification)

    // Deliver via appropriate channels
    await this.deliver(notification)
  }

  /**
   * Generate intelligent notification message
   */
  private async generateMessage(
    type: ARIANotification['type'],
    variables: Record<string, any>
  ): Promise<string> {
    // Find appropriate template
    const template = Array.from(this.templates.values()).find(t => t.type === type)
    
    if (template) {
      let message = template.template
      for (const [key, value] of Object.entries(variables)) {
        message = message.replace(`{{${key}}}`, String(value))
      }
      return message
    }

    // Fallback to AI generation
    const prompt = `Generate a ${type} notification message with these details: ${JSON.stringify(variables)}. Keep it brief and actionable.`
    const response = await aria.chat(prompt, {
      preferences: { tone: 'professional', responseLength: 'brief' },
    })
    
    return response.message
  }

  /**
   * Deliver notification through appropriate channels
   */
  private async deliver(notification: ARIANotification) {
    for (const channel of notification.deliveryChannels) {
      switch (channel) {
        case 'in-app':
          this.deliverInApp(notification)
          break
        case 'email':
          await this.deliverEmail(notification)
          break
        case 'slack':
          await this.deliverSlack(notification)
          break
        case 'whatsapp':
          await this.deliverWhatsApp(notification)
          break
      }
    }
  }

  /**
   * Deliver in-app notification
   */
  private deliverInApp(notification: ARIANotification) {
    // Show toast notification
    const toastType = this.getToastType(notification.priority)
    
    toast[toastType](notification.message, {
      description: notification.title,
      duration: notification.priority === 'urgent' ? 10000 : 5000,
      action: notification.actions?.[0] ? {
        label: notification.actions[0].label,
        onClick: notification.actions[0].action,
      } : undefined,
    })

    // Trigger UI update
    window.dispatchEvent(new CustomEvent('aria-notification', {
      detail: notification,
    }))
  }

  /**
   * Deliver email notification
   */
  private async deliverEmail(notification: ARIANotification) {
    try {
      const { ariaEmail } = await import('./ariaEmailIntegration')
      
      // Get user email from user store or profile
      const userEmail = await this.getUserEmail(notification.targetUserId)
      if (!userEmail) {
        console.warn(`No email found for user ${notification.targetUserId}`)
        return
      }

      // Determine appropriate email template based on notification type
      let templateData: Record<string, any> = {
        firstName: await this.getUserFirstName(notification.targetUserId),
        message: notification.message,
        title: notification.title,
        platformUrl: 'https://daritana.com',
        unsubscribeUrl: `https://daritana.com/unsubscribe?token=${notification.targetUserId}`,
      }

      if (notification.type === 'task-reminder' && notification.taskId) {
        await ariaEmail.sendTemplateEmail(userEmail, 'task_reminder', {
          ...templateData,
          taskName: await this.getTaskName(notification.taskId),
          dueDate: await this.getTaskDueDate(notification.taskId),
          priority: notification.priority,
          projectName: await this.getProjectName(notification.projectId),
          taskId: notification.taskId,
        }, {
          priority: notification.priority === 'urgent' ? 'urgent' : 'normal'
        })
      } else if (notification.type === 'escalation') {
        await ariaEmail.sendTemplateEmail(userEmail, 'compliance_alert', {
          ...templateData,
          alertTitle: notification.title,
          severity: notification.priority,
          projectName: await this.getProjectName(notification.projectId),
          detectedAt: new Date().toLocaleString(),
          issueDescription: notification.message,
          requiredActions: ['Review and take action immediately'],
          potentialImpact: 'Project delays and compliance issues',
          resolutionDeadline: 'Within 24 hours',
          alertId: notification.id,
          projectId: notification.projectId || '',
        }, {
          priority: 'urgent'
        })
      } else {
        // Send generic notification email
        await ariaEmail.sendEmail({
          to: userEmail,
          subject: notification.title,
          textContent: notification.message,
          htmlContent: this.generateHTMLEmail(notification),
          priority: notification.priority === 'urgent' ? 'urgent' : 'normal',
        })
      }

      console.log(`Email notification sent to ${userEmail}`)
    } catch (error) {
      console.error('Failed to send email notification:', error)
    }
  }

  /**
   * Deliver Slack notification
   */
  private async deliverSlack(notification: ARIANotification) {
    try {
      const { ariaSlack } = await import('./ariaSlackIntegration')
      
      // Get user Slack ID
      const userSlackId = await this.getUserSlackId(notification.targetUserId)
      if (!userSlackId) {
        console.warn(`No Slack ID found for user ${notification.targetUserId}`)
        return
      }

      const config = {
        user: userSlackId,
        priority: notification.priority,
        format: 'rich' as const,
        includeActions: notification.actions && notification.actions.length > 0,
      }

      if (notification.type === 'task-reminder' && notification.taskId) {
        await ariaSlack.sendTaskReminder(config, {
          taskName: await this.getTaskName(notification.taskId),
          assignee: userSlackId,
          dueDate: await this.getTaskDueDate(notification.taskId),
          priority: notification.priority,
          projectName: await this.getProjectName(notification.projectId),
          taskId: notification.taskId,
        })
      } else if (notification.type === 'escalation') {
        await ariaSlack.sendComplianceAlert(config, {
          title: notification.title,
          severity: notification.priority as any,
          description: notification.message,
          projectName: await this.getProjectName(notification.projectId),
          requiredActions: ['Review and take action immediately'],
          deadline: 'Within 24 hours',
          alertId: notification.id,
          responsibleUsers: [userSlackId],
        })
      } else {
        // Send generic Slack message
        await ariaSlack.sendMessage(config, notification.message)
      }

      console.log(`Slack notification sent to user ${userSlackId}`)
    } catch (error) {
      console.error('Failed to send Slack notification:', error)
    }
  }

  /**
   * Deliver WhatsApp notification
   */
  private async deliverWhatsApp(notification: ARIANotification) {
    try {
      const { ariaWhatsApp } = await import('./ariaWhatsAppIntegration')
      
      // Get user WhatsApp number
      const phoneNumber = await this.getUserWhatsApp(notification.targetUserId)
      if (!phoneNumber) {
        console.warn(`No WhatsApp number found for user ${notification.targetUserId}`)
        return
      }

      const firstName = await this.getUserFirstName(notification.targetUserId)

      if (notification.type === 'task-reminder' && notification.taskId) {
        await ariaWhatsApp.sendTaskReminder(phoneNumber, {
          userFirstName: firstName,
          taskName: await this.getTaskName(notification.taskId),
          dueDate: await this.getTaskDueDate(notification.taskId),
          priority: notification.priority,
        })
      } else if (notification.type === 'escalation') {
        await ariaWhatsApp.sendComplianceAlert(phoneNumber, {
          alertTitle: notification.title,
          issue: notification.message,
          severity: notification.priority,
        })
      } else {
        // Send simple text message
        await ariaWhatsApp.sendMessage(phoneNumber, `${notification.title}\n\n${notification.message}`)
      }

      console.log(`WhatsApp notification sent to ${phoneNumber}`)
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error)
    }
  }

  /**
   * Get appropriate toast type based on priority
   */
  private getToastType(priority: ARIANotification['priority']): 'info' | 'success' | 'warning' | 'error' {
    switch (priority) {
      case 'low':
        return 'info'
      case 'medium':
        return 'info'
      case 'high':
        return 'warning'
      case 'urgent':
        return 'error'
    }
  }

  /**
   * Get notification title based on type
   */
  private getNotificationTitle(type: ARIANotification['type']): string {
    const titles: Record<ARIANotification['type'], string> = {
      'task-reminder': '📋 Task Reminder',
      'deadline-warning': '⚠️ Deadline Alert',
      'escalation': '🚨 Escalation Required',
      'achievement': '🎉 Achievement Unlocked',
      'insight': '💡 ARIA Insight',
      'standup': '🌅 Daily Standup',
    }
    return titles[type] || 'ARIA Notification'
  }

  /**
   * Get delivery channels based on type and priority
   */
  private getDeliveryChannels(
    type: ARIANotification['type'],
    priority: ARIANotification['priority'],
    userPrefs: UserNotificationPreferences
  ): ARIANotification['deliveryChannels'] {
    const channels: ARIANotification['deliveryChannels'] = ['in-app']
    
    // Add channels based on priority
    if (priority === 'urgent') {
      channels.push('email', 'slack')
      if (userPrefs.allowWhatsApp) {
        channels.push('whatsapp')
      }
    } else if (priority === 'high') {
      channels.push('slack')
    }
    
    // Filter based on user preferences
    return channels.filter(c => userPrefs.enabledChannels.includes(c))
  }

  /**
   * Check if notification should be sent
   */
  private shouldSendNotification(
    type: ARIANotification['type'],
    priority: ARIANotification['priority'],
    userPrefs: UserNotificationPreferences
  ): boolean {
    // Check quiet hours
    if (userPrefs.quietHours.enabled) {
      const now = new Date()
      const hour = now.getHours()
      if (hour >= userPrefs.quietHours.start || hour < userPrefs.quietHours.end) {
        // Only allow urgent notifications during quiet hours
        if (priority !== 'urgent') {
          return false
        }
      }
    }
    
    // Check notification frequency
    const recentNotifications = this.getRecentNotificationsForUser(userPrefs.userId)
    if (recentNotifications.length > userPrefs.maxNotificationsPerHour) {
      return priority === 'urgent' // Only urgent can bypass rate limit
    }
    
    return true
  }

  /**
   * Get user notification preferences
   */
  private getUserPreferences(userId: string): UserNotificationPreferences {
    return this.userPreferences.get(userId) || {
      userId,
      enabledChannels: ['in-app', 'email', 'slack'],
      allowWhatsApp: false,
      quietHours: {
        enabled: true,
        start: 22, // 10 PM
        end: 8, // 8 AM
      },
      maxNotificationsPerHour: 10,
      notificationTypes: {
        'task-reminder': true,
        'deadline-warning': true,
        'escalation': true,
        'achievement': true,
        'insight': true,
        'standup': true,
      },
    }
  }

  /**
   * Get recent notifications for rate limiting
   */
  private getRecentNotificationsForUser(userId: string): ARIANotification[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return Array.from(this.notifications.values()).filter(n => 
      n.targetUserId === userId && n.createdAt > oneHourAgo
    )
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(userId: string, preferences: Partial<UserNotificationPreferences>) {
    const current = this.getUserPreferences(userId)
    this.userPreferences.set(userId, { ...current, ...preferences })
  }

  /**
   * Get unread notifications for user
   */
  getUnreadNotifications(userId: string): ARIANotification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.targetUserId === userId && !n.read)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string) {
    const notification = this.notifications.get(notificationId)
    if (notification) {
      notification.read = true
    }
  }

  /**
   * Schedule a notification
   */
  scheduleNotification(notification: Partial<ARIANotification>, scheduledTime: Date) {
    setTimeout(() => {
      this.sendNotification({
        type: notification.type!,
        priority: notification.priority || 'medium',
        targetUserId: notification.targetUserId!,
        taskId: notification.taskId,
        projectId: notification.projectId,
        customMessage: notification.message,
      })
    }, scheduledTime.getTime() - Date.now())
  }

  /**
   * Helper methods to get user information
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    // Integration with user store/database
    // For now, return mock data
    return `user.${userId}@daritana.com`
  }

  private async getUserWhatsApp(userId: string): Promise<string | null> {
    // Integration with user store/database
    // For now, return mock data
    return `+601234567${userId.slice(-2)}`
  }

  private async getUserSlackId(userId: string): Promise<string | null> {
    // Integration with Slack user mapping
    // For now, return mock data
    return `U${userId.toUpperCase().slice(0, 8)}`
  }

  private async getUserFirstName(userId: string): Promise<string> {
    // Integration with user store/database
    // For now, return mock data
    return `User ${userId.slice(0, 3)}`
  }

  private async getTaskName(taskId: string): Promise<string> {
    // Integration with task store/database
    // For now, return mock data
    return `Task ${taskId.slice(0, 8)}`
  }

  private async getTaskDueDate(taskId: string): Promise<string> {
    // Integration with task store/database
    // For now, return mock data
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toLocaleDateString()
  }

  private async getProjectName(projectId?: string): Promise<string> {
    if (!projectId) return 'Unknown Project'
    // Integration with project store/database
    // For now, return mock data
    return `Project ${projectId.slice(0, 8)}`
  }

  private generateHTMLEmail(notification: ARIANotification): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${notification.title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">${notification.title}</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p>${notification.message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This notification was sent by your ARIA Assistant<br>
            Powered by <strong>Daritana Architecture Platform</strong>
          </p>
        </div>
      </body>
      </html>
    `
  }
}

interface UserNotificationPreferences {
  userId: string
  enabledChannels: ARIANotification['deliveryChannels']
  allowWhatsApp: boolean
  quietHours: {
    enabled: boolean
    start: number // Hour (0-23)
    end: number
  }
  maxNotificationsPerHour: number
  notificationTypes: Record<ARIANotification['type'], boolean>
}

// Export singleton instance
export const ariaNotifications = new ARIANotificationService()

// Helper functions
export function sendARIANotification(
  type: ARIANotification['type'],
  targetUserId: string,
  variables?: Record<string, any>
) {
  return ariaNotifications.sendNotification({
    type,
    priority: 'medium',
    targetUserId,
    variables,
  })
}

export function sendUrgentNotification(
  message: string,
  targetUserId: string,
  taskId?: string
) {
  return ariaNotifications.sendNotification({
    type: 'deadline-warning',
    priority: 'urgent',
    targetUserId,
    taskId,
    customMessage: message,
  })
}