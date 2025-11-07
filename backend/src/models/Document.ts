import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export enum DocumentType {
  DRAWING = 'drawing',
  SPECIFICATION = 'specification',
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  QUOTATION = 'quotation',
  REPORT = 'report',
  PERMIT = 'permit',
  CERTIFICATE = 'certificate',
  PHOTO = 'photo',
  VIDEO = 'video',
  PRESENTATION = 'presentation',
  SPREADSHEET = 'spreadsheet',
  OTHER = 'other'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived'
}

export enum DocumentCategory {
  DESIGN = 'design',
  CONSTRUCTION = 'construction',
  LEGAL = 'legal',
  FINANCIAL = 'financial',
  COMPLIANCE = 'compliance',
  MARKETING = 'marketing',
  ADMINISTRATIVE = 'administrative',
  TECHNICAL = 'technical'
}

export interface DocumentAttributes {
  id: string
  projectId?: string
  userId: string
  parentId?: string
  name: string
  description?: string
  type: DocumentType
  category: DocumentCategory
  status: DocumentStatus
  fileUrl: string
  thumbnailUrl?: string
  mimeType: string
  fileSize: number
  extension: string
  version: string
  versionHistory?: Array<{
    version: string
    fileUrl: string
    changedBy: string
    changedAt: Date
    changeNotes?: string
  }>
  tags?: string[]
  isPublic: boolean
  isTemplate: boolean
  permissions?: {
    view: string[]
    edit: string[]
    delete: string[]
    download: string[]
  }
  metadata?: {
    width?: number
    height?: number
    pages?: number
    duration?: number
    encoding?: string
    compression?: string
    checksum?: string
    exifData?: Record<string, any>
  }
  reviewers?: Array<{
    userId: string
    status: 'pending' | 'approved' | 'rejected'
    comments?: string
    reviewedAt?: Date
  }>
  relatedDocuments?: string[]
  expiryDate?: Date
  retentionPeriod?: number
  isConfidential: boolean
  accessLog?: Array<{
    userId: string
    action: string
    timestamp: Date
    ipAddress?: string
  }>
  customFields?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface DocumentCreationAttributes extends Optional<DocumentAttributes,
  'id' | 'status' | 'category' | 'version' | 'isPublic' | 'isTemplate' | 
  'isConfidential' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

export class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
  public id!: string
  public projectId?: string
  public userId!: string
  public parentId?: string
  public name!: string
  public description?: string
  public type!: DocumentType
  public category!: DocumentCategory
  public status!: DocumentStatus
  public fileUrl!: string
  public thumbnailUrl?: string
  public mimeType!: string
  public fileSize!: number
  public extension!: string
  public version!: string
  public versionHistory?: Array<{
    version: string
    fileUrl: string
    changedBy: string
    changedAt: Date
    changeNotes?: string
  }>
  public tags?: string[]
  public isPublic!: boolean
  public isTemplate!: boolean
  public permissions?: {
    view: string[]
    edit: string[]
    delete: string[]
    download: string[]
  }
  public metadata?: {
    width?: number
    height?: number
    pages?: number
    duration?: number
    encoding?: string
    compression?: string
    checksum?: string
    exifData?: Record<string, any>
  }
  public reviewers?: Array<{
    userId: string
    status: 'pending' | 'approved' | 'rejected'
    comments?: string
    reviewedAt?: Date
  }>
  public relatedDocuments?: string[]
  public expiryDate?: Date
  public retentionPeriod?: number
  public isConfidential!: boolean
  public accessLog?: Array<{
    userId: string
    action: string
    timestamp: Date
    ipAddress?: string
  }>
  public customFields?: Record<string, any>
  
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt?: Date

  // Associations
  public readonly project?: any
  public readonly user?: any
  public readonly parent?: any
  public readonly children?: any[]

  // Virtual fields
  public get isExpired(): boolean {
    return !!(this.expiryDate && this.expiryDate < new Date())
  }

  public get fileSizeInMB(): number {
    return this.fileSize / (1024 * 1024)
  }

  public get isImage(): boolean {
    return this.mimeType.startsWith('image/')
  }

  public get isVideo(): boolean {
    return this.mimeType.startsWith('video/')
  }

  public get isPDF(): boolean {
    return this.mimeType === 'application/pdf'
  }

  public get isCAD(): boolean {
    const cadExtensions = ['.dwg', '.dxf', '.dwf', '.dgn', '.rvt', '.skp']
    return cadExtensions.includes(this.extension.toLowerCase())
  }

  // Instance methods
  public async createNewVersion(fileUrl: string, userId: string, changeNotes?: string): Promise<void> {
    const versionHistory = this.versionHistory || []
    
    // Save current version to history
    versionHistory.push({
      version: this.version,
      fileUrl: this.fileUrl,
      changedBy: userId,
      changedAt: new Date(),
      changeNotes
    })

    // Update to new version
    const versionParts = this.version.split('.')
    const minorVersion = parseInt(versionParts[versionParts.length - 1]) + 1
    versionParts[versionParts.length - 1] = minorVersion.toString()
    const newVersion = versionParts.join('.')

    await this.update({
      fileUrl,
      version: newVersion,
      versionHistory
    })
    
    await this.logAccess(userId, 'version_created')
  }

  public async addReviewer(userId: string): Promise<void> {
    const reviewers = this.reviewers || []
    
    if (!reviewers.find(r => r.userId === userId)) {
      reviewers.push({
        userId,
        status: 'pending'
      })
      await this.update({ reviewers })
      await this.logAccess(userId, 'reviewer_added')
    }
  }

  public async submitReview(userId: string, status: 'approved' | 'rejected', comments?: string): Promise<void> {
    const reviewers = this.reviewers || []
    const reviewer = reviewers.find(r => r.userId === userId)
    
    if (reviewer) {
      reviewer.status = status
      reviewer.comments = comments
      reviewer.reviewedAt = new Date()
      
      await this.update({ reviewers })
      
      // Check if all reviewers have approved
      const allApproved = reviewers.every(r => r.status === 'approved')
      const anyRejected = reviewers.some(r => r.status === 'rejected')
      
      if (allApproved) {
        await this.update({ status: DocumentStatus.APPROVED })
      } else if (anyRejected) {
        await this.update({ status: DocumentStatus.REJECTED })
      }
      
      await this.logAccess(userId, `document_${status}`)
    }
  }

  public async logAccess(userId: string, action: string, ipAddress?: string): Promise<void> {
    const accessLog = this.accessLog || []
    accessLog.push({
      userId,
      action,
      timestamp: new Date(),
      ipAddress
    })
    
    // Keep only last 100 access logs
    if (accessLog.length > 100) {
      accessLog.splice(0, accessLog.length - 100)
    }
    
    await this.update({ accessLog })
  }

  public async hasPermission(userId: string, action: 'view' | 'edit' | 'delete' | 'download'): Promise<boolean> {
    if (!this.permissions) return true // No permissions set means open access
    
    const allowedUsers = this.permissions[action] || []
    return allowedUsers.includes(userId) || allowedUsers.includes('*')
  }

  public async archive(): Promise<void> {
    await this.update({ status: DocumentStatus.ARCHIVED })
  }
}

Document.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'documents',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM(...Object.values(DocumentType)),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(...Object.values(DocumentCategory)),
      allowNull: false,
      defaultValue: DocumentCategory.ADMINISTRATIVE
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DocumentStatus)),
      allowNull: false,
      defaultValue: DocumentStatus.DRAFT
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    extension: {
      type: DataTypes.STRING,
      allowNull: false
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '1.0'
    },
    versionHistory: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isTemplate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    reviewers: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    relatedDocuments: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      defaultValue: []
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    retentionPeriod: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Retention period in days'
    },
    isConfidential: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    accessLog: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    customFields: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Document',
    tableName: 'documents',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['projectId'] },
      { fields: ['userId'] },
      { fields: ['parentId'] },
      { fields: ['type'] },
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['isTemplate'] },
      { fields: ['tags'], using: 'GIN' },
      { fields: ['name'] },
      { fields: ['projectId', 'type'] },
      { fields: ['userId', 'status'] }
    ]
  }
)

export default Document