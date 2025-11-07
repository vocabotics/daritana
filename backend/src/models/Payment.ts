import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  FPX = 'fpx',
  EWALLET_GRABPAY = 'ewallet_grabpay',
  EWALLET_TOUCHNGO = 'ewallet_touchngo',
  EWALLET_BOOST = 'ewallet_boost',
  EWALLET_SHOPEEPAY = 'ewallet_shopeepay',
  JOMPAY = 'jompay',
  CHEQUE = 'cheque',
  OTHER = 'other'
}

export enum PaymentType {
  INVOICE = 'invoice',
  DEPOSIT = 'deposit',
  MILESTONE = 'milestone',
  SUBSCRIPTION = 'subscription',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  OTHER = 'other'
}

export interface PaymentAttributes {
  id: string
  paymentNumber: string
  invoiceId?: string
  projectId?: string
  payerId: string
  receiverId: string
  type: PaymentType
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  currency: string
  exchangeRate?: number
  convertedAmount?: number
  transactionFee?: number
  netAmount?: number
  reference?: string
  externalTransactionId?: string
  gatewayResponse?: Record<string, any>
  description?: string
  paymentDate: Date
  processedDate?: Date
  clearedDate?: Date
  bankDetails?: {
    bankName?: string
    accountNumber?: string
    accountName?: string
    swiftCode?: string
    referenceNumber?: string
  }
  cardDetails?: {
    last4?: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
    cardholderName?: string
  }
  ewalletDetails?: {
    provider?: string
    phoneNumber?: string
    accountId?: string
  }
  chequeDetails?: {
    chequeNumber?: string
    bankName?: string
    chequeDate?: Date
  }
  refundDetails?: {
    originalPaymentId?: string
    refundReason?: string
    refundAmount?: number
    refundDate?: Date
  }
  receiptUrl?: string
  attachments?: string[]
  notes?: string
  reconciled: boolean
  reconciledDate?: Date
  reconciledBy?: string
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes,
  'id' | 'paymentNumber' | 'status' | 'currency' | 'reconciled' | 
  'createdAt' | 'updatedAt' | 'deletedAt'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: string
  public paymentNumber!: string
  public invoiceId?: string
  public projectId?: string
  public payerId!: string
  public receiverId!: string
  public type!: PaymentType
  public method!: PaymentMethod
  public status!: PaymentStatus
  public amount!: number
  public currency!: string
  public exchangeRate?: number
  public convertedAmount?: number
  public transactionFee?: number
  public netAmount?: number
  public reference?: string
  public externalTransactionId?: string
  public gatewayResponse?: Record<string, any>
  public description?: string
  public paymentDate!: Date
  public processedDate?: Date
  public clearedDate?: Date
  public bankDetails?: {
    bankName?: string
    accountNumber?: string
    accountName?: string
    swiftCode?: string
    referenceNumber?: string
  }
  public cardDetails?: {
    last4?: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
    cardholderName?: string
  }
  public ewalletDetails?: {
    provider?: string
    phoneNumber?: string
    accountId?: string
  }
  public chequeDetails?: {
    chequeNumber?: string
    bankName?: string
    chequeDate?: Date
  }
  public refundDetails?: {
    originalPaymentId?: string
    refundReason?: string
    refundAmount?: number
    refundDate?: Date
  }
  public receiptUrl?: string
  public attachments?: string[]
  public notes?: string
  public reconciled!: boolean
  public reconciledDate?: Date
  public reconciledBy?: string
  public metadata?: Record<string, any>
  
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt?: Date

  // Associations
  public readonly invoice?: any
  public readonly project?: any
  public readonly payer?: any
  public readonly receiver?: any

  // Virtual fields
  public get isPending(): boolean {
    return this.status === PaymentStatus.PENDING || this.status === PaymentStatus.PROCESSING
  }

  public get isSuccessful(): boolean {
    return this.status === PaymentStatus.COMPLETED
  }

  public get isFailed(): boolean {
    return this.status === PaymentStatus.FAILED || this.status === PaymentStatus.CANCELLED
  }

  public get isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED || this.status === PaymentStatus.PARTIALLY_REFUNDED
  }

  public get processingDays(): number | null {
    if (!this.processedDate || !this.paymentDate) return null
    const payment = new Date(this.paymentDate)
    const processed = new Date(this.processedDate)
    const diffTime = processed.getTime() - payment.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Instance methods
  public async markAsProcessing(): Promise<void> {
    this.status = PaymentStatus.PROCESSING
    this.processedDate = new Date()
    await this.save()
  }

  public async markAsCompleted(externalTransactionId?: string, gatewayResponse?: Record<string, any>): Promise<void> {
    this.status = PaymentStatus.COMPLETED
    this.clearedDate = new Date()
    if (externalTransactionId) {
      this.externalTransactionId = externalTransactionId
    }
    if (gatewayResponse) {
      this.gatewayResponse = gatewayResponse
    }
    
    // Calculate net amount after fees
    if (this.transactionFee) {
      this.netAmount = this.amount - this.transactionFee
    } else {
      this.netAmount = this.amount
    }
    
    await this.save()
    
    // Update related invoice if exists
    if (this.invoiceId) {
      const Invoice = (await import('./Invoice')).default
      const invoice = await Invoice.findByPk(this.invoiceId)
      if (invoice) {
        await invoice.recordPayment(this.amount, this.method, this.reference, this.notes)
      }
    }
  }

  public async markAsFailed(reason?: string, gatewayResponse?: Record<string, any>): Promise<void> {
    this.status = PaymentStatus.FAILED
    if (reason) {
      this.notes = reason
    }
    if (gatewayResponse) {
      this.gatewayResponse = gatewayResponse
    }
    await this.save()
  }

  public async cancel(reason?: string): Promise<void> {
    if (this.status === PaymentStatus.PENDING || this.status === PaymentStatus.PROCESSING) {
      this.status = PaymentStatus.CANCELLED
      if (reason) {
        this.notes = reason
      }
      await this.save()
    }
  }

  public async refund(amount?: number, reason?: string): Promise<Payment> {
    const refundAmount = amount || this.amount
    
    // Create refund payment record
    const refundPayment = await Payment.create({
      payerId: this.receiverId,
      receiverId: this.payerId,
      type: PaymentType.REFUND,
      method: this.method,
      status: PaymentStatus.PENDING,
      amount: -refundAmount,
      currency: this.currency,
      exchangeRate: this.exchangeRate,
      description: `Refund for payment ${this.paymentNumber}`,
      paymentDate: new Date(),
      refundDetails: {
        originalPaymentId: this.id,
        refundReason: reason,
        refundAmount,
        refundDate: new Date()
      },
      projectId: this.projectId,
      invoiceId: this.invoiceId
    })
    
    // Update original payment status
    if (refundAmount >= this.amount) {
      this.status = PaymentStatus.REFUNDED
    } else {
      this.status = PaymentStatus.PARTIALLY_REFUNDED
    }
    await this.save()
    
    return refundPayment
  }

  public async reconcile(userId: string): Promise<void> {
    this.reconciled = true
    this.reconciledDate = new Date()
    this.reconciledBy = userId
    await this.save()
  }

  public async generateReceipt(): Promise<string> {
    // This would generate a PDF receipt and return the URL
    // For now, return a placeholder
    const receiptUrl = `/api/v1/payments/${this.id}/receipt`
    this.receiptUrl = receiptUrl
    await this.save()
    return receiptUrl
  }
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    paymentNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'invoices',
        key: 'id'
      }
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    payerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(...Object.values(PaymentType)),
      allowNull: false
    },
    method: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.PENDING
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
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
    convertedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    transactionFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    netAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    externalTransactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gatewayResponse: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    processedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    clearedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    bankDetails: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    cardDetails: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ewalletDetails: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    chequeDetails: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    refundDetails: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reconciled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    reconciledDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reconciledBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['paymentNumber'], unique: true },
      { fields: ['invoiceId'] },
      { fields: ['projectId'] },
      { fields: ['payerId'] },
      { fields: ['receiverId'] },
      { fields: ['status'] },
      { fields: ['method'] },
      { fields: ['type'] },
      { fields: ['paymentDate'] },
      { fields: ['reconciled'] },
      { fields: ['externalTransactionId'] }
    ],
    hooks: {
      beforeValidate: async (payment) => {
        // Generate payment number if not provided
        if (!payment.paymentNumber) {
          const year = new Date().getFullYear()
          const month = String(new Date().getMonth() + 1).padStart(2, '0')
          const count = await Payment.count({ where: { 
            createdAt: {
              [sequelize.Sequelize.Op.gte]: new Date(year, new Date().getMonth(), 1),
              [sequelize.Sequelize.Op.lt]: new Date(year, new Date().getMonth() + 1, 1)
            }
          }})
          payment.paymentNumber = `PAY-${year}${month}-${String(count + 1).padStart(5, '0')}`
        }
        
        // Calculate converted amount if exchange rate is provided
        if (payment.exchangeRate && payment.exchangeRate !== 1) {
          payment.convertedAmount = payment.amount * payment.exchangeRate
        }
      }
    }
  }
)

export default Payment