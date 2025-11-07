import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export enum ProjectStatus {
  DRAFT = 'draft',
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ProjectType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  INSTITUTIONAL = 'institutional',
  MIXED_USE = 'mixed_use',
  RENOVATION = 'renovation',
  INTERIOR_DESIGN = 'interior_design'
}

export interface ProjectAttributes {
  id: string
  name: string
  description?: string
  type: ProjectType
  status: ProjectStatus
  clientId: string
  projectLeadId?: string
  designerId?: string
  address?: string
  city?: string
  state?: string
  postcode?: string
  country: string
  latitude?: number
  longitude?: number
  startDate?: Date
  endDate?: Date
  actualStartDate?: Date
  actualEndDate?: Date
  budget?: number
  actualCost?: number
  currency: string
  squareFootage?: number
  numberOfFloors?: number
  designBrief?: Record<string, any>
  requirements?: string[]
  deliverables?: string[]
  milestones?: Array<{
    name: string
    dueDate: Date
    completed: boolean
    completedDate?: Date
  }>
  risks?: Array<{
    description: string
    severity: 'low' | 'medium' | 'high'
    mitigation: string
  }>
  tags?: string[]
  attachments?: string[]
  coverImage?: string
  progress: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isPublic: boolean
  metadata?: Record<string, any>
  complianceStatus?: {
    ubbl: boolean
    bomba: boolean
    environmental: boolean
    localAuthority: boolean
  }
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface ProjectCreationAttributes extends Optional<ProjectAttributes,
  'id' | 'status' | 'country' | 'currency' | 'progress' | 'priority' | 'isPublic' | 
  'createdAt' | 'updatedAt' | 'deletedAt'> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: string
  public name!: string
  public description?: string
  public type!: ProjectType
  public status!: ProjectStatus
  public clientId!: string
  public projectLeadId?: string
  public designerId?: string
  public address?: string
  public city?: string
  public state?: string
  public postcode?: string
  public country!: string
  public latitude?: number
  public longitude?: number
  public startDate?: Date
  public endDate?: Date
  public actualStartDate?: Date
  public actualEndDate?: Date
  public budget?: number
  public actualCost?: number
  public currency!: string
  public squareFootage?: number
  public numberOfFloors?: number
  public designBrief?: Record<string, any>
  public requirements?: string[]
  public deliverables?: string[]
  public milestones?: Array<{
    name: string
    dueDate: Date
    completed: boolean
    completedDate?: Date
  }>
  public risks?: Array<{
    description: string
    severity: 'low' | 'medium' | 'high'
    mitigation: string
  }>
  public tags?: string[]
  public attachments?: string[]
  public coverImage?: string
  public progress!: number
  public priority!: 'low' | 'medium' | 'high' | 'urgent'
  public isPublic!: boolean
  public metadata?: Record<string, any>
  public complianceStatus?: {
    ubbl: boolean
    bomba: boolean
    environmental: boolean
    localAuthority: boolean
  }
  
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt?: Date

  // Associations
  public readonly client?: any
  public readonly projectLead?: any
  public readonly designer?: any
  public readonly tasks?: any[]
  public readonly documents?: any[]
  public readonly team?: any[]

  // Virtual fields
  public get isOverdue(): boolean {
    return !!(this.endDate && this.endDate < new Date() && this.status !== ProjectStatus.COMPLETED)
  }

  public get daysRemaining(): number | null {
    if (!this.endDate) return null
    const now = new Date()
    const end = new Date(this.endDate)
    const diffTime = end.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  public get budgetUtilization(): number {
    if (!this.budget || !this.actualCost) return 0
    return (this.actualCost / this.budget) * 100
  }

  // Instance methods
  public async updateProgress(): Promise<void> {
    // Calculate progress based on completed milestones
    if (this.milestones && this.milestones.length > 0) {
      const completed = this.milestones.filter(m => m.completed).length
      const progress = Math.round((completed / this.milestones.length) * 100)
      await this.update({ progress })
    }
  }

  public async addTeamMember(userId: string, role: string): Promise<void> {
    // This will be implemented when ProjectTeam association is created
  }

  public async removeTeamMember(userId: string): Promise<void> {
    // This will be implemented when ProjectTeam association is created
  }
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
      type: DataTypes.ENUM(...Object.values(ProjectType)),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ProjectStatus)),
      allowNull: false,
      defaultValue: ProjectStatus.DRAFT
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    projectLeadId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    designerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    postcode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Malaysia'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    actualCost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'MYR'
    },
    squareFootage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    numberOfFloors: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    designBrief: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    requirements: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: []
    },
    deliverables: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: []
    },
    milestones: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    risks: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
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
    coverImage: {
      type: DataTypes.STRING,
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
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    complianceStatus: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        ubbl: false,
        bomba: false,
        environmental: false,
        localAuthority: false
      }
    }
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['clientId'] },
      { fields: ['projectLeadId'] },
      { fields: ['designerId'] },
      { fields: ['status'] },
      { fields: ['type'] },
      { fields: ['priority'] },
      { fields: ['startDate'] },
      { fields: ['endDate'] },
      { fields: ['city', 'state'] },
      { fields: ['tags'], using: 'GIN' }
    ]
  }
)

export default Project