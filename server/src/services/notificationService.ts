import { query } from '../database/connection';
import { NotificationType } from '../types';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

// Initialize Socket.IO server
export const initializeSocketServer = (socketServer: SocketServer) => {
  io = socketServer;
};

interface NotificationData {
  user_id: string;
  type: NotificationType | string;
  title: string;
  message?: string;
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
  metadata?: any;
}

// Create and send notification
export const sendNotification = async (data: NotificationData): Promise<void> => {
  try {
    // Save notification to database
    const result = await query(
      `INSERT INTO notifications (
        user_id, type, title, message, entity_type, entity_id, action_url, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.user_id,
        data.type,
        data.title,
        data.message || null,
        data.entity_type || null,
        data.entity_id || null,
        data.action_url || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]
    );

    const notification = result.rows[0];

    // Send real-time notification via WebSocket if available
    if (io) {
      io.to(`user-${data.user_id}`).emit('notification', notification);
    }

    console.log(`📬 Notification sent to user ${data.user_id}: ${data.title}`);
  } catch (error) {
    console.error('Failed to send notification:', error);
    // Don't throw - notifications should not break the main operation
  }
};

// Send bulk notifications
export const sendBulkNotifications = async (
  userIds: string[],
  notificationData: Omit<NotificationData, 'user_id'>
): Promise<void> => {
  try {
    const promises = userIds.map(userId =>
      sendNotification({ ...notificationData, user_id: userId })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to send bulk notifications:', error);
  }
};

// Get user notifications
export const getUserNotifications = async (
  userId: string,
  options?: {
    unread_only?: boolean;
    limit?: number;
    offset?: number;
    type?: NotificationType;
  }
): Promise<any[]> => {
  try {
    let queryText = 'SELECT * FROM notifications WHERE user_id = $1';
    const params: any[] = [userId];
    let paramCount = 1;

    if (options?.unread_only) {
      queryText += ' AND is_read = false';
    }

    if (options?.type) {
      paramCount++;
      queryText += ` AND type = $${paramCount}`;
      params.push(options.type);
    }

    queryText += ' ORDER BY created_at DESC';

    if (options?.limit) {
      paramCount++;
      queryText += ` LIMIT $${paramCount}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      paramCount++;
      queryText += ` OFFSET $${paramCount}`;
      params.push(options.offset);
    }

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Failed to get user notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationRead = async (
  notificationId: string,
  userId: string
): Promise<boolean> => {
  try {
    const result = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (userId: string): Promise<number> => {
  try {
    const result = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false
       RETURNING id`,
      [userId]
    );

    return result.rowCount || 0;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<boolean> => {
  try {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error('Failed to delete notification:', error);
    throw error;
  }
};

// Get unread notification count
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Failed to get unread notification count:', error);
    throw error;
  }
};

// Notification templates
export const notificationTemplates = {
  taskAssigned: (taskTitle: string, assignerName: string) => ({
    type: 'task' as NotificationType,
    title: 'New Task Assigned',
    message: `${assignerName} assigned you to "${taskTitle}"`
  }),

  taskCompleted: (taskTitle: string, completerName: string) => ({
    type: 'task' as NotificationType,
    title: 'Task Completed',
    message: `${completerName} completed "${taskTitle}"`
  }),

  taskCommented: (taskTitle: string, commenterName: string) => ({
    type: 'task' as NotificationType,
    title: 'New Comment on Task',
    message: `${commenterName} commented on "${taskTitle}"`
  }),

  projectInvite: (projectName: string, inviterName: string) => ({
    type: 'project' as NotificationType,
    title: 'Project Invitation',
    message: `${inviterName} invited you to join "${projectName}"`
  }),

  projectUpdate: (projectName: string, updaterName: string) => ({
    type: 'project' as NotificationType,
    title: 'Project Updated',
    message: `${updaterName} updated "${projectName}"`
  }),

  paymentReceived: (amount: number, clientName: string) => ({
    type: 'payment' as NotificationType,
    title: 'Payment Received',
    message: `Payment of RM ${amount.toFixed(2)} received from ${clientName}`
  }),

  invoiceSent: (invoiceNumber: string, clientName: string) => ({
    type: 'payment' as NotificationType,
    title: 'Invoice Sent',
    message: `Invoice ${invoiceNumber} sent to ${clientName}`
  }),

  systemUpdate: (updateTitle: string) => ({
    type: 'system' as NotificationType,
    title: 'System Update',
    message: updateTitle
  }),

  mention: (entityType: string, entityTitle: string, mentionerName: string) => ({
    type: 'info' as NotificationType,
    title: 'You were mentioned',
    message: `${mentionerName} mentioned you in ${entityType}: "${entityTitle}"`
  })
};

// Clean up old notifications
export const cleanupOldNotifications = async (daysToKeep: number = 30): Promise<number> => {
  try {
    const result = await query(
      `DELETE FROM notifications 
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
       AND is_read = true
       RETURNING id`
    );

    console.log(`Cleaned up ${result.rowCount} old notifications`);
    return result.rowCount || 0;
  } catch (error) {
    console.error('Failed to cleanup old notifications:', error);
    throw error;
  }
};