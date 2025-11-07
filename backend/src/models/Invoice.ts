import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentTerms {
  IMMEDIATE = 'immediate',
  NET_7 = 'net_7',
  NET_15 = 'net_15',
  NET_30 = 'net_30',
  NET_45 = 'net_45',
  NET_60 = 'net_60',
  NET_90 = 'net_90',
  CUSTOM = 'custom'
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount?: number
  discountType?: 'percentage' | 'fixed'
  tax?: number
  taxType?: string
  total: number
}

export interface InvoiceAttributes {
  id: string
  invoiceNumber: string
  projectId?: string
  clientId: string
  issuedBy: string
  status: InvoiceStatus
  issueDate: Date
  dueDate: Date
  paymentTerms: PaymentTerms
  customPaymentTerms?: string
  items: InvoiceItem[]
  subtotal: number
  discount?: number
  discountType?: 'percentage' | 'fixed'
  tax?: number
  taxType?: string
  taxNumber?: string
  total: number
  amountPaid: number
  amountDue: number
  currency: string
  exchangeRate?: number
  notes?: string
  termsAndConditions?: string
  attachments?: string[]
  billingAddress?: {
    name: string
    company?: string
    address: string
    city: string
    state: string
    postcode: string
    country: string
  }
  shippingAddress?: {
    name: string
    company?: string
    address: string
    city: string
    state: string
    postcode: string
    country: string
  }
  bankDetails?: {
    bankName: string
    accountName: string
    accountNumber: string
    swiftCode?: string
    routingNumber?: string
  }
  sentAt?: Date
  viewedAt?: Date
  paidAt?: Date
  remindersSent?: Array<{
    sentAt: Date
    type: 'email' | 'sms' | 'whatsapp'
    recipient: string
  }>
  paymentHistory?: Array<{
    id: string
    amount: number
    paymentDate: Date
    paymentMethod: string
    reference?: string
    notes?: string
  }>
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface InvoiceCreationAttributes extends Optional<InvoiceAttributes,
  'id' | 'status' | 'amountPaid' | 'amountDue' | 'currency' | 
  'createdAt' | 'updatedAt' | 'deletedAt'> {}

export class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  public id!: string
  public invoiceNumber!: string
  public projectId?: string
  public clientId!: string
  public issuedBy!: string
  public status!: InvoiceStatus
  public issueDate!: Date
  public dueDate!: Date
  public paymentTerms!: PaymentTerms
  public customPaymentTerms?: string
  public items!: InvoiceItem[]
  public subtotal!: number
  public discount?: number
  public discountType?: 'percentage' | 'fixed'
  public tax?: number
  public taxType?: string
  public taxNumber?: string
  public total!: number
  public amountPaid!: number
  public amountDue!: number
  public currency!: string
  public exchangeRate?: number
  public notes?: string
  public termsAndConditions?: string
  public attachments?: string[]
  public billingAddress?: {
    name: string
    company?: string
    address: string
    city: string
    state: string
    postcode: string
    country: string
  }
  public shippingAddress?: {
    name: string
    company?: string
    address: string
    city: string
    state: string
    postcode: string
    country: string
  }
  public bankDetails?: {
    bankName: string
    accountName: string
    accountNumber: string
    swiftCode?: string
    routingNumber?: string
  }
  public sentAt?: Date
  public viewedAt?: Date
  public paidAt?: Date
  public remindersSent?: Array<{
    sentAt: Date
    type: 'email' | 'sms' | 'whatsapp'
    recipient: string
  }>
  public paymentHistory?: Array<{
    id: string
    amount: number
    paymentDate: Date
    paymentMethod: string
    reference?: string
    notes?: string
  }>
  public metadata?: Record<string, any>
  
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt?: Date

  // Associations
  public readonly project?: any
  public readonly client?: any
  public readonly issuer?: any
  public readonly payments?: any[]

  // Virtual fields
  public get isOverdue(): boolean {
    return this.status !== InvoiceStatus.PAID && 
           this.status !== InvoiceStatus.CANCELLED && 
           this.dueDate < new Date()
  }

  public get daysOverdue(): number {
    if (!this.isOverdue) return 0
    const now = new Date()
    const due = new Date(this.dueDate)
    const diffTime = now.getTime() - due.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  public get paymentProgress(): number {
    if (this.total === 0) return 100
    return Math.round((this.amountPaid / this.total) * 100)
  }

  // Instance methods
  public async calculateTotals(): Promise<void> {
    let subtotal = 0
    
    // Calculate items total
    const items = this.items.map(item => {
      let itemTotal = item.quantity * item.unitPrice
      
      // Apply item discount
      if (item.discount) {
        if (item.discountType === 'percentage') {
          itemTotal -= (itemTotal * item.discount / 100)
        } else {
          itemTotal -= item.discount
        }
      }
      
      // Apply item tax
      if (item.tax) {
        itemTotal += (itemTotal * item.tax / 100)
      }
      
      item.total = itemTotal
      subtotal += itemTotal
      return item
    })
    
    this.items = items
    this.subtotal = subtotal
    
    // Apply invoice-level discount
    let total = subtotal
    if (this.discount) {
      if (this.discountType === 'percentage') {
        total -= (total * this.discount / 100)
      } else {
        total -= this.discount
      }
    }
    
    // Apply invoice-level tax
    if (this.tax) {
      total += (total * this.tax / 100)
    }
    
    this.total = total
    this.amountDue = total - this.amountPaid
    
    await this.save()
  }

  public async recordPayment(amount: number, paymentMethod: string, reference?: string, notes?: string): Promise<void> {
    const paymentHistory = this.paymentHistory || []
    paymentHistory.push({
      id: DataTypes.UUIDV4,
      amount,
      paymentDate: new Date(),
      paymentMethod,
      reference,
      notes
    })
    
    this.amountPaid += amount
    this.amountDue = this.total - this.amountPaid
    this.paymentHistory = paymentHistory
    
    // Update status based on payment
    if (this.amountDue <= 0) {
      this.status = InvoiceStatus.PAID
      this.paidAt = new Date()
    } else if (this.amountPaid > 0) {
      this.status = InvoiceStatus.PARTIALLY_PAID
    }
    
    await this.save()
  }

  public async markAsSent(recipient?: string): Promise<void> {
    this.status = InvoiceStatus.SENT
    this.sentAt = new Date()
    await this.save()
  }

  public async markAsViewed(): Promise<void> {
    if (this.status === InvoiceStatus.SENT) {
      this.status = InvoiceStatus.VIEWED
      this.viewedAt = new Date()
      await this.save()
    }
  }

  public async sendReminder(type: 'email' | 'sms' | 'whatsapp', recipient: string): Promise<void> {
    const remindersSent = this.remindersSent || []
    remindersSent.push({
      sentAt: new Date(),
      type,
      recipient
    })
    this.remindersSent = remindersSent
    await this.save()
  }

  public async cancel(): Promise<void> {
    this.status = InvoiceStatus.CANCELLED
    await this.save()
  }

  public async refund(amount?: number): Promise<void> {
    if (amount) {
      await this.recordPayment(-amount, 'refund')
    }
    this.status = InvoiceStatus.REFUNDED
    await this.save()
  }
}

Invoice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    issuedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(InvoiceStatus)),
      allowNull: false,
      defaultValue: InvoiceStatus.DRAFT
    },
    issueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    paymentTerms: {
      type: DataTypes.ENUM(...Object.values(PaymentTerms)),
      allowNull: false,
      defaultValue: PaymentTerms.NET_30
    },
    customPaymentTerms: {
      type: DataTypes.STRING,
      allowNull: true
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    discount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: true
    },
    tax: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    taxType: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'SST'
    },
    taxNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    amountPaid: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    amountDue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'MYR'
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      defaultValue: 1
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    bankDetails: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    remindersSent: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    paymentHistory: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['invoiceNumber'], unique: true },
      { fields: ['projectId'] },
      { fields: ['clientId'] },
      { fields: ['issuedBy'] },
      { fields: ['status'] },
      { fields: ['dueDate'] },
      { fields: ['issueDate'] },
      { fields: ['clientId', 'status'] }
    ],
    hooks: {
      beforeValidate: async (invoice) => {
        // Generate invoice number if not provided
        if (!invoice.invoiceNumber) {
          const year = new Date().getFullYear()
          const count = await Invoice.count({ where: { 
            createdAt: {
              [sequelize.Sequelize.Op.gte]: new Date(year, 0, 1),
              [sequelize.Sequelize.Op.lt]: new Date(year + 1, 0, 1)
            }
          }})
          invoice.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`
        }
        
        // Calculate due date based on payment terms if not set
        if (!invoice.dueDate && invoice.issueDate && invoice.paymentTerms) {
          const issueDate = new Date(invoice.issueDate)
          let daysToAdd = 0
          
          switch (invoice.paymentTerms) {
            case PaymentTerms.IMMEDIATE: daysToAdd = 0; break
            case PaymentTerms.NET_7: daysToAdd = 7; break
            case PaymentTerms.NET_15: daysToAdd = 15; break
            case PaymentTerms.NET_30: daysToAdd = 30; break
            case PaymentTerms.NET_45: daysToAdd = 45; break
            case PaymentTerms.NET_60: daysToAdd = 60; break
            case PaymentTerms.NET_90: daysToAdd = 90; break
          }
          
          issueDate.setDate(issueDate.getDate() + daysToAdd)
          invoice.dueDate = issueDate
        }
      }
    }
  }
)

export default Invoice