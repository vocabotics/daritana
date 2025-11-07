import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export enum ComplianceType {
  UBBL = 'ubbl',
  BOMBA = 'bomba',
  ENVIRONMENTAL = 'environmental',
  LOCAL_AUTHORITY = 'local_authority',
  PAM = 'pam',
  BEM = 'bem',
  MSID = 'msid',
  ACEM = 'acem',
  HEALTH_SAFETY = 'health_safety',
  OTHER = 'other'
}

export enum ComplianceStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  RENEWED = 'renewed'
}

export enum CompliancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ComplianceCheckItem {
  id: string
  clause: string
  description: string
  requirement: string
  status: 'pending' | 'compliant' | 'non_compliant' | 'not_applicable'
  evidence?: string[]
  notes?: string
  checkedBy?: string
  checkedAt?: Date
  severity?: 'minor' | 'major' | 'critical'
}

export interface ComplianceAttributes {
  id: string
  projectId: string
  type: ComplianceType
  status: ComplianceStatus
  priority: CompliancePriority
  authority?: string
  authorityReference?: string
  complianceTitle: string
  description?: string
  requirements?: string[]
  checklistItems?: ComplianceCheckItem[]
  complianceScore?: number
  submittedBy?: string
  submittedAt?: Date
  reviewedBy?: string
  reviewedAt?: Date
  approvedBy?: string
  approvedAt?: Date
  approvalNumber?: string
  expiryDate?: Date
  renewalDate?: Date
  validityPeriod?: number // in days
  documents?: string[]
  fees?: {
    submissionFee?: number
    processingFee?: number
    approvalFee?: number
    totalFee?: number
    paidAmount?: number
    paymentStatus?: 'pending' | 'paid' | 'partial'
    paymentDate?: Date
    receiptNumber?: string
  }
  timeline?: {
    expectedSubmissionDate?: Date
    actualSubmissionDate?: Date
    expectedApprovalDate?: Date
    actualApprovalDate?: Date
    slaD
: number // SLA in days
    daysElapsed?: number
  }
  violations?: Array<{
    id: string
    clause: string
    description: string
    severity: 'minor' | 'major' | 'critical'
    identifiedDate: Date
    resolvedDate?: Date
    resolution?: string
    penalty?: number
  }>
  communications?: Array<{
    id: string
    date: Date
    type: 'email' | 'letter' | 'meeting' | 'phone'
    subject: string
    content?: string
    sender: string
    recipient: string
    attachments?: string[]
  }>
  rejectionReasons?: Array<{
    reason: string
    clause?: string
    recommendedAction?: string
  }>
  conditions?: string[]
  notes?: string
  tags?: string[]
  isTemplate: boolean
  templateData?: Record<string, any>
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface ComplianceCreationAttributes extends Optional<ComplianceAttributes,
  'id' | 'status' | 'priority' | 'isTemplate' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

export class Compliance extends Model<ComplianceAttributes, ComplianceCreationAttributes> implements ComplianceAttributes {
  public id!: string
  public projectId!: string
  public type!: ComplianceType
  public status!: ComplianceStatus
  public priority!: CompliancePriority
  public authority?: string
  public authorityReference?: string
  public complianceTitle!: string
  public description?: string
  public requirements?: string[]
  public checklistItems?: ComplianceCheckItem[]
  public complianceScore?: number
  public submittedBy?: string
  public submittedAt?: Date
  public reviewedBy?: string
  public reviewedAt?: Date
  public approvedBy?: string
  public approvedAt?: Date
  public approvalNumber?: string
  public expiryDate?: Date
  public renewalDate?: Date
  public validityPeriod?: number
  public documents?: string[]
  public fees?: {
    submissionFee?: number
    processingFee?: number
    approvalFee?: number
    totalFee?: number
    paidAmount?: number
    paymentStatus?: 'pending' | 'paid' | 'partial'
    paymentDate?: Date
    receiptNumber?: string
  }
  public timeline?: {
    expectedSubmissionDate?: Date
    actualSubmissionDate?: Date
    expectedApprovalDate?: Date
    actualApprovalDate?: Date
    slaDays?: number
    daysElapsed?: number
  }
  public violations?: Array<{
    id: string
    clause: string
    description: string
    severity: 'minor' | 'major' | 'critical'
    identifiedDate: Date
    resolvedDate?: Date
    resolution?: string
    penalty?: number
  }>
  public communications?: Array<{
    id: string
    date: Date
    type: 'email' | 'letter' | 'meeting' | 'phone'
    subject: string
    content?: string
    sender: string
    recipient: string
    attachments?: string[]
  }>
  public rejectionReasons?: Array<{
    reason: string
    clause?: string
    recommendedAction?: string
  }>
  public conditions?: string[]
  public notes?: string
  public tags?: string[]
  public isTemplate!: boolean
  public templateData?: Record<string, any>
  public metadata?: Record<string, any>
  
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt?: Date

  // Associations
  public readonly project?: any

  // Virtual fields
  public get isExpired(): boolean {
    return !!(this.expiryDate && this.expiryDate < new Date())
  }

  public get isNearExpiry(): boolean {
    if (!this.expiryDate) return false
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return this.expiryDate <= thirtyDaysFromNow && !this.isExpired
  }

  public get daysUntilExpiry(): number | null {
    if (!this.expiryDate) return null
    const now = new Date()
    const expiry = new Date(this.expiryDate)
    const diffTime = expiry.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  public get isOverdue(): boolean {
    if (!this.timeline?.expectedApprovalDate) return false
    return this.timeline.expectedApprovalDate < new Date() && 
           this.status !== ComplianceStatus.APPROVED
  }

  public get compliancePercentage(): number {
    if (!this.checklistItems || this.checklistItems.length === 0) return 0
    const compliantItems = this.checklistItems.filter(item => 
      item.status === 'compliant' || item.status === 'not_applicable'
    ).length
    return Math.round((compliantItems / this.checklistItems.length) * 100)
  }

  public get hasViolations(): boolean {
    return !!(this.violations && this.violations.filter(v => !v.resolvedDate).length > 0)
  }

  public get unresolvedViolations(): number {
    if (!this.violations) return 0
    return this.violations.filter(v => !v.resolvedDate).length
  }

  // Instance methods
  public async updateChecklist(itemId: string, status: 'compliant' | 'non_compliant' | 'not_applicable', userId: string, evidence?: string[], notes?: string): Promise<void> {
    if (!this.checklistItems) return
    
    const item = this.checklistItems.find(i => i.id === itemId)
    if (item) {
      item.status = status
      item.checkedBy = userId
      item.checkedAt = new Date()
      if (evidence) item.evidence = evidence
      if (notes) item.notes = notes
      
      // Recalculate compliance score
      this.complianceScore = this.compliancePercentage
      await this.save()
    }
  }

  public async submit(userId: string): Promise<void> {
    this.status = ComplianceStatus.SUBMITTED
    this.submittedBy = userId
    this.submittedAt = new Date()
    
    if (this.timeline) {
      this.timeline.actualSubmissionDate = new Date()
    }
    
    await this.save()
  }

  public async approve(userId: string, approvalNumber: string, validityPeriod?: number): Promise<void> {
    this.status = ComplianceStatus.APPROVED
    this.approvedBy = userId
    this.approvedAt = new Date()
    this.approvalNumber = approvalNumber
    
    if (validityPeriod) {
      this.validityPeriod = validityPeriod
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + validityPeriod)
      this.expiryDate = expiryDate
      
      // Set renewal date 30 days before expiry
      const renewalDate = new Date(expiryDate)
      renewalDate.setDate(renewalDate.getDate() - 30)
      this.renewalDate = renewalDate
    }
    
    if (this.timeline) {
      this.timeline.actualApprovalDate = new Date()
    }
    
    await this.save()
  }

  public async reject(userId: string, reasons: Array<{ reason: string; clause?: string; recommendedAction?: string }>): Promise<void> {
    this.status = ComplianceStatus.REJECTED
    this.reviewedBy = userId
    this.reviewedAt = new Date()
    this.rejectionReasons = reasons
    await this.save()
  }

  public async addViolation(violation: {
    clause: string
    description: string
    severity: 'minor' | 'major' | 'critical'
    penalty?: number
  }): Promise<void> {
    const violations = this.violations || []
    violations.push({
      id: DataTypes.UUIDV4,
      ...violation,
      identifiedDate: new Date()
    })
    this.violations = violations
    
    // Update priority based on violations
    const criticalViolations = violations.filter(v => v.severity === 'critical' && !v.resolvedDate).length
    const majorViolations = violations.filter(v => v.severity === 'major' && !v.resolvedDate).length
    
    if (criticalViolations > 0) {
      this.priority = CompliancePriority.CRITICAL
    } else if (majorViolations > 0) {
      this.priority = CompliancePriority.HIGH
    }
    
    await this.save()
  }

  public async resolveViolation(violationId: string, resolution: string): Promise<void> {
    if (!this.violations) return
    
    const violation = this.violations.find(v => v.id === violationId)
    if (violation) {
      violation.resolvedDate = new Date()
      violation.resolution = resolution
      await this.save()
    }
  }

  public async addCommunication(communication: {
    type: 'email' | 'letter' | 'meeting' | 'phone'
    subject: string
    content?: string
    sender: string
    recipient: string
    attachments?: string[]
  }): Promise<void> {
    const communications = this.communications || []
    communications.push({
      id: DataTypes.UUIDV4,
      date: new Date(),
      ...communication
    })
    this.communications = communications
    await this.save()
  }

  public async renew(): Promise<void> {
    if (this.status === ComplianceStatus.APPROVED && this.validityPeriod) {
      this.status = ComplianceStatus.RENEWED
      const newExpiryDate = new Date()
      newExpiryDate.setDate(newExpiryDate.getDate() + this.validityPeriod)
      this.expiryDate = newExpiryDate
      
      const newRenewalDate = new Date(newExpiryDate)
      newRenewalDate.setDate(newRenewalDate.getDate() - 30)
      this.renewalDate = newRenewalDate
      
      await this.save()
    }
  }

  public async createFromTemplate(projectId: string): Promise<Compliance> {
    if (!this.isTemplate) {
      throw new Error('This compliance record is not a template')
    }
    
    const newCompliance = await Compliance.create({
      projectId,
      type: this.type,
      complianceTitle: this.complianceTitle,
      description: this.description,
      requirements: this.requirements,
      checklistItems: this.checklistItems?.map(item => ({
        ...item,
        status: 'pending',
        checkedBy: undefined,
        checkedAt: undefined,
        evidence: undefined,
        notes: undefined
      })),
      authority: this.authority,
      priority: CompliancePriority.MEDIUM,
      status: ComplianceStatus.NOT_STARTED,
      isTemplate: false,
      templateData: { templateId: this.id }
    })
    
    return newCompliance
  }
}

Compliance.init(
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
    type: {
      type: DataTypes.ENUM(...Object.values(ComplianceType)),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ComplianceStatus)),
      allowNull: false,
      defaultValue: ComplianceStatus.NOT_STARTED
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(CompliancePriority)),
      allowNull: false,
      defaultValue: CompliancePriority.MEDIUM
    },
    authority: {
      type: DataTypes.STRING,
      allowNull: true
    },
    authorityReference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    complianceTitle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requirements: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: []
    },
    checklistItems: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    complianceScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    submittedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvalNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    renewalDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    validityPeriod: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Validity period in days'
    },
    documents: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    fees: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    timeline: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    violations: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    communications: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    rejectionReasons: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    conditions: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: []
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    isTemplate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    templateData: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Compliance',
    tableName: 'compliances',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['projectId'] },
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['authority'] },
      { fields: ['expiryDate'] },
      { fields: ['renewalDate'] },
      { fields: ['isTemplate'] },
      { fields: ['submittedBy'] },
      { fields: ['approvedBy'] },
      { fields: ['tags'], using: 'GIN' },
      { fields: ['projectId', 'type'] },
      { fields: ['status', 'priority'] }
    ]
  }
)

export default Compliance