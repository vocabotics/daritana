import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export enum NotificationType {
  PROJECT_UPDATE = 'project_update',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_APPROVED = 'document_approved',
  INVOICE_GENERATED = 'invoice_generated',
  PAYMENT_RECEIVED = 'payment_received',
  COMPLIANCE_DUE = 'compliance_due',
  DEADLINE_APPROACHING = 'deadline_approaching',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  COMMENT_ADDED = 'comment_added',
  MENTION = 'mention'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface NotificationAttributes {
  id: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  recipientId: string
  senderId?: string
  relatedEntityType?: string // 'project', 'task', 'document', 'invoice', etc.
  relatedEntityId?: string
  actionUrl?: string
  isRead: boolean
  readAt?: Date
  scheduledFor?: Date
  expiresAt?: Date
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface NotificationCreationAttributes 
  extends Optional<NotificationAttributes, 'id' | 'isRead' | 'createdAt' | 'updatedAt'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> 
  implements NotificationAttributes {
  public id!: string
  public title!: string
  public message!: string
  public type!: NotificationType
  public priority!: NotificationPriority
  public recipientId!: string
  public senderId?: string
  public relatedEntityType?: string
  public relatedEntityId?: string
  public actionUrl?: string
  public isRead!: boolean
  public readAt?: Date
  public scheduledFor?: Date
  public expiresAt?: Date
  public metadata?: Record<string, any>
  public createdAt!: Date
  public updatedAt!: Date
  public deletedAt?: Date

  // Helper methods
  public async markAsRead(): Promise<void> {
    await this.update({
      isRead: true,
      readAt: new Date()
    })
  }

  public async markAsUnread(): Promise<void> {
    await this.update({
      isRead: false,
      readAt: null
    })
  }

  public isExpired(): boolean {
    if (!this.expiresAt) return false
    return new Date() > this.expiresAt
  }

  public shouldBeSent(): boolean {
    const now = new Date()
    
    // Check if expired
    if (this.isExpired()) return false
    
    // Check if scheduled for future
    if (this.scheduledFor && now < this.scheduledFor) return false
    
    return true
  }
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Title cannot be empty' },
        len: { args: [1, 255], msg: 'Title must be between 1 and 255 characters' }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Message cannot be empty' },
        len: { args: [1, 2000], msg: 'Message must be between 1 and 2000 characters' }
      }
    },
    type: {
      type: DataTypes.ENUM(...Object.values(NotificationType)),
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(NotificationPriority)),
      allowNull: false,
      defaultValue: NotificationPriority.NORMAL
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    relatedEntityType: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    relatedEntityId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    actionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    paranoid: true, // Soft delete
    indexes: [
      { fields: ['recipientId'] },
      { fields: ['senderId'] },
      { fields: ['type'] },
      { fields: ['priority'] },
      { fields: ['isRead'] },
      { fields: ['createdAt'] },
      { fields: ['scheduledFor'] },
      { fields: ['expiresAt'] },
      { fields: ['relatedEntityType', 'relatedEntityId'] }
    ]
  }
)

export default Notification