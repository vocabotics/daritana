import cron from 'node-cron'
import { NotificationService } from '../services/notificationService'
import { logger } from './logger'

export class Scheduler {
  private static tasks: cron.ScheduledTask[] = []

  static start(): void {
    logger.info('Starting scheduled tasks...')

    // Clean up expired notifications - runs every hour
    const cleanupTask = cron.schedule('0 * * * *', async () => {
      try {
        const deletedCount = await NotificationService.cleanupExpiredNotifications()
        if (deletedCount > 0) {
          logger.info(`Cleaned up ${deletedCount} expired notifications`)
        }
      } catch (error) {
        logger.error('Failed to cleanup expired notifications:', error)
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kuala_Lumpur'
    })

    // Check for upcoming deadlines - runs every 6 hours
    const deadlineTask = cron.schedule('0 */6 * * *', async () => {
      try {
        await NotificationService.scheduleDeadlineNotifications()
        logger.info('Deadline notifications check completed')
      } catch (error) {
        logger.error('Failed to schedule deadline notifications:', error)
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kuala_Lumpur'
    })

    // Health check - runs every 30 minutes
    const healthTask = cron.schedule('*/30 * * * *', async () => {
      try {
        // This could include checking database connections, external API status, etc.
        logger.info('System health check completed')
      } catch (error) {
        logger.error('Health check failed:', error)
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kuala_Lumpur'
    })

    // Start all tasks
    cleanupTask.start()
    deadlineTask.start()
    healthTask.start()

    // Store references for potential cleanup
    this.tasks.push(cleanupTask, deadlineTask, healthTask)

    logger.info('All scheduled tasks started successfully')
  }

  static stop(): void {
    logger.info('Stopping scheduled tasks...')
    
    this.tasks.forEach(task => {
      task.stop()
    })
    
    this.tasks = []
    logger.info('All scheduled tasks stopped')
  }

  // Method to manually trigger deadline notifications (for testing/admin use)
  static async triggerDeadlineCheck(): Promise<void> {
    try {
      await NotificationService.scheduleDeadlineNotifications()
      logger.info('Manual deadline check completed')
    } catch (error) {
      logger.error('Manual deadline check failed:', error)
      throw error
    }
  }

  // Method to manually trigger cleanup (for testing/admin use)
  static async triggerCleanup(): Promise<number> {
    try {
      const deletedCount = await NotificationService.cleanupExpiredNotifications()
      logger.info(`Manual cleanup completed: ${deletedCount} notifications deleted`)
      return deletedCount
    } catch (error) {
      logger.error('Manual cleanup failed:', error)
      throw error
    }
  }
}