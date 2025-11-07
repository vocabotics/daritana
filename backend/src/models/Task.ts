import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskType {
  DESIGN = 'design',
  DEVELOPMENT = 'development',
  REVIEW = 'review',
  APPROVAL = 'approval',
  DOCUMENTATION = 'documentation',
  MEETING = 'meeting',
  SITE_VISIT = 'site_visit',
  PROCUREMENT = 'procurement',
  CONSTRUCTION = 'construction',
  INSPECTION = 'inspection',
  OTHER = 'other'
}

export interface TaskAttributes {
  id: string
  projectId: string
  parentTaskId?: string
  title: string
  description?: string
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string
  reporterId: string
  dueDate?: Date
  startDate?: Date
  completedDate?: Date
  estimatedHours?: number
  actualHours?: number
  progress: number
  tags?: string[]
  attachments?: string[]
  dependencies?: string[]
  blockedBy?: string
  checklist?: Array<{
    id: string
    text: string
    completed: boolean
    completedBy?: string
    completedAt?: Date
  }>
  comments?: Array<{
    id: string
    userId: string
    text: string
    createdAt: Date
    updatedAt?: Date
  }>
  activityLog?: Array<{
    userId: string
    action: string
    details?: any
    timestamp: Date
  }>
  customFields?: Record<string, any>
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface TaskCreationAttributes extends Optional<TaskAttributes,
  'id' | 'status' | 'priority' | 'progress' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: string
  public projectId!: string
  public parentTaskId?: string
  public title!: string
  public description?: string
  public type!: TaskType
  public status!: TaskStatus
  public priority!: TaskPriority
  public assigneeId?: string
  public reporterId!: string
  public dueDate?: Date
  public startDate?: Date
  public completedDate?: Date
  public estimatedHours?: number
  public actualHours?: number
  public progress!: number
  public tags?: string[]
  public attachments?: string[]
  public dependencies?: string[]
  public blockedBy?: string
  public checklist?: Array<{
    id: string
    text: string
    completed: boolean
    completedBy?: string
    completedAt?: Date
  }>
  public comments?: Array<{
    id: string
    userId: string
    text: string
    createdAt: Date
    updatedAt?: Date
  }>
  public activityLog?: Array<{
    userId: string
    action: string
    details?: any
    timestamp: Date
  }>
  public customFields?: Record<string, any>
  public metadata?: Record<string, any>
  
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt?: Date

  // Associations
  public readonly project?: any
  public readonly assignee?: any
  public readonly reporter?: any
  public readonly parentTask?: any
  public readonly subtasks?: any[]

  // Virtual fields
  public get isOverdue(): boolean {
    return !!(this.dueDate && this.dueDate < new Date() && 
      this.status !== TaskStatus.COMPLETED && this.status !== TaskStatus.CANCELLED)
  }

  public get daysUntilDue(): number | null {
    if (!this.dueDate) return null
    const now = new Date()
    const due = new Date(this.dueDate)
    const diffTime = due.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  public get checklistProgress(): number {
    if (!this.checklist || this.checklist.length === 0) return 0
    const completed = this.checklist.filter(item => item.completed).length
    return Math.round((completed / this.checklist.length) * 100)
  }

  public get hoursVariance(): number | null {
    if (!this.estimatedHours || !this.actualHours) return null
    return this.actualHours - this.estimatedHours
  }

  // Instance methods
  public async addComment(userId: string, text: string): Promise<void> {
    const comments = this.comments || []
    comments.push({
      id: DataTypes.UUIDV4,
      userId,
      text,
      createdAt: new Date()
    })
    await this.update({ comments })
    await this.logActivity(userId, 'comment_added', { text })
  }

  public async updateChecklist(itemId: string, completed: boolean, userId: string): Promise<void> {
    if (!this.checklist) return
    
    const item = this.checklist.find(i => i.id === itemId)
    if (item) {
      item.completed = completed
      if (completed) {
        item.completedBy = userId
        item.completedAt = new Date()
      } else {
        item.completedBy = undefined
        item.completedAt = undefined
      }
      
      await this.update({ checklist: this.checklist })
      await this.updateProgressFromChecklist()
      await this.logActivity(userId, 'checklist_updated', { itemId, completed })
    }
  }

  public async updateProgressFromChecklist(): Promise<void> {
    const progress = this.checklistProgress
    await this.update({ progress })
  }

  public async logActivity(userId: string, action: string, details?: any): Promise<void> {
    const activityLog = this.activityLog || []
    activityLog.push({
      userId,
      action,
      details,
      timestamp: new Date()
    })
    await this.update({ activityLog })
  }

  public async complete(userId: string): Promise<void> {
    await this.update({
      status: TaskStatus.COMPLETED,
      completedDate: new Date(),
      progress: 100
    })
    await this.logActivity(userId, 'task_completed')
  }

  public async block(userId: string, reason: string): Promise<void> {
    await this.update({
      status: TaskStatus.BLOCKED,
      blockedBy: reason
    })
    await this.logActivity(userId, 'task_blocked', { reason })
  }

  public async unblock(userId: string): Promise<void> {
    await this.update({
      status: TaskStatus.TODO,
      blockedBy: undefined
    })
    await this.logActivity(userId, 'task_unblocked')
  }
}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    parentTaskId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tasks',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM(...Object.values(TaskType)),
      allowNull: false,
      defaultValue: TaskType.OTHER
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TaskStatus)),
      allowNull: false,
      defaultValue: TaskStatus.TODO
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(TaskPriority)),
      allowNull: false,
      defaultValue: TaskPriority.MEDIUM
    },
    assigneeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true
    },
    actualHours: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    dependencies: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      defaultValue: []
    },
    blockedBy: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    checklist: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    comments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    activityLog: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    customFields: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['projectId'] },
      { fields: ['parentTaskId'] },
      { fields: ['assigneeId'] },
      { fields: ['reporterId'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['type'] },
      { fields: ['dueDate'] },
      { fields: ['tags'], using: 'GIN' },
      { fields: ['projectId', 'status'] },
      { fields: ['assigneeId', 'status'] }
    ]
  }
)

export default Task