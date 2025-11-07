// ==================== PAYMENT GATEWAY TYPES FOR MALAYSIAN MARKET ====================

import { User, Project } from './index';

// ==================== PAYMENT METHODS ====================

export type PaymentMethod = 
  | 'fpx' 
  | 'fpx_b2b' 
  | 'credit_card' 
  | 'debit_card'
  | 'ewallet_grab' 
  | 'ewallet_tng' 
  | 'ewallet_boost' 
  | 'ewallet_shopee'
  | 'jompay' 
  | 'bank_transfer' 
  | 'duitnow' 
  | 'cash_deposit'
  | 'cheque'
  | 'corporate_card';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'authorized'
  | 'captured'
  | 'settled'
  | 'cancelled'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'expired'
  | 'disputed';

export type PaymentPurpose = 
  | 'project_deposit'
  | 'milestone_payment'
  | 'final_payment'
  | 'material_purchase'
  | 'contractor_payment'
  | 'professional_fee'
  | 'subscription'
  | 'commission'
  | 'refund'
  | 'adjustment';

// ==================== FPX SPECIFIC TYPES ====================

export interface FPXConfiguration {
  merchantId: string;
  exchangeId: string;
  version: '7.0' | '7.1' | '7.2';
  environment: 'production' | 'sandbox' | 'uat';
  sellerOrderNo: string;
  sellerExId: string;
  sellerName: string;
  certificatePath?: string;
  privateKeyPath?: string;
  fpxPublicKeyPath?: string;
  returnUrl: string;
  callbackUrl: string;
  indirectUrl: string;
}

export interface FPXBank {
  code: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  type: 'individual' | 'corporate';
  logo?: string;
  lastChecked: Date;
}

export interface FPXTransaction {
  fpxTxnId: string;
  fpxTxnTime: string;
  fpxSellerOrderNo: string;
  fpxSellerExOrderNo: string;
  fpxBuyerEmail: string;
  fpxBuyerName: string;
  fpxBuyerBankId: string;
  fpxBuyerBankBranch: string;
  fpxBuyerAccNo: string;
  fpxBuyerId: string;
  fpxMakerName?: string;
  fpxBuyerIban?: string;
  fpxTxnCurrency: 'MYR';
  fpxTxnAmount: string;
  fpxChecksum: string;
  fpxDebitAuthCode?: string;
  fpxDebitAuthNo?: string;
  fpxCreditAuthCode?: string;
  fpxCreditAuthNo?: string;
  status: '00' | '09' | '12' | '14' | '39' | '45' | '46' | '51' | '53' | '54' | '55' | '56' | '57' | '58' | '76' | '96' | '99';
  statusDescription?: string;
}

export interface FPXRequest {
  msgType: 'AE' | 'AR' | 'AC' | 'BC' | 'BE' | 'RQ' | 'RV';
  msgToken: string;
  sellerExId: string;
  sellerExOrderNo: string;
  sellerTxnTime: string;
  sellerOrderNo: string;
  sellerId?: string;
  sellerBankCode?: string;
  txnCurrency: 'MYR';
  txnAmount: string;
  buyerEmail: string;
  buyerName: string;
  buyerBankId?: string;
  buyerBankBranch?: string;
  buyerAccNo?: string;
  buyerId?: string;
  buyerIban?: string;
  makerName?: string;
  productDesc: string;
  version: string;
  checksum: string;
}

export interface FPXResponse {
  fpx_msgType: string;
  fpx_msgToken: string;
  fpx_sellerExId: string;
  fpx_sellerExOrderNo: string;
  fpx_sellerTxnTime: string;
  fpx_sellerOrderNo: string;
  fpx_sellerId?: string;
  fpx_sellerBankCode?: string;
  fpx_buyerBankId: string;
  fpx_buyerBankBranch?: string;
  fpx_buyerIban?: string;
  fpx_buyerId?: string;
  fpx_buyerName: string;
  fpx_buyerEmail?: string;
  fpx_txnCurrency: string;
  fpx_txnAmount: string;
  fpx_checkSum: string;
  fpx_fpxTxnId?: string;
  fpx_fpxTxnTime?: string;
  fpx_debitAuthCode?: string;
  fpx_debitAuthNo?: string;
  fpx_creditAuthCode?: string;
  fpx_creditAuthNo?: string;
}

// ==================== E-WALLET TYPES ====================

export interface EWalletProvider {
  type: 'grab' | 'tng' | 'boost' | 'shopee';
  name: string;
  apiEndpoint: string;
  apiKey: string;
  apiSecret: string;
  merchantId: string;
  webhookSecret?: string;
  supportedFeatures: EWalletFeature[];
  minAmount: number;
  maxAmount: number;
  dailyLimit?: number;
}

export type EWalletFeature = 
  | 'qr_payment'
  | 'direct_debit'
  | 'tokenization'
  | 'refund'
  | 'partial_refund'
  | 'recurring'
  | 'split_payment';

export interface EWalletTransaction {
  providerId: string;
  providerType: 'grab' | 'tng' | 'boost' | 'shopee';
  referenceId: string;
  amount: number;
  currency: 'MYR';
  status: 'pending' | 'success' | 'failed' | 'expired';
  qrCode?: string;
  deepLink?: string;
  expiryTime: Date;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

// ==================== JOMPAY TYPES ====================

export interface JomPayConfiguration {
  billerId: string;
  billerCode: string;
  billerName: string;
  bankCode: string;
  bankAccountNo: string;
  environment: 'production' | 'sandbox';
}

export interface JomPayBill {
  ref1: string; // Reference 1 (Bill Account Number)
  ref2?: string; // Reference 2 (Optional)
  amount: number;
  expiryDate: Date;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  paidDate?: Date;
  paymentRef?: string;
}

// ==================== CREDIT/DEBIT CARD TYPES ====================

export interface CardPaymentGateway {
  provider: 'ipay88' | 'molpay' | 'stripe' | 'paypal' | 'billplz';
  merchantId: string;
  merchantCode: string;
  apiKey: string;
  apiSecret: string;
  currency: string[];
  supportedCards: CardType[];
  features: CardFeature[];
  require3DS: boolean;
  webhookUrl?: string;
}

export type CardType = 'visa' | 'mastercard' | 'amex' | 'unionpay';

export type CardFeature = 
  | 'tokenization'
  | 'recurring'
  | 'preauth'
  | '3ds'
  | 'dcc' // Dynamic Currency Conversion
  | 'installment';

export interface CardTransaction {
  gatewayId: string;
  transactionId: string;
  cardType: CardType;
  maskedCardNo: string;
  cardHolder: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  authCode?: string;
  responseCode?: string;
  responseMessage?: string;
  threeDSStatus?: '1' | '2' | 'N';
  tokenId?: string;
}

// ==================== PAYMENT TRANSACTION TYPES ====================

export interface PaymentTransaction {
  id: string;
  referenceNo: string;
  projectId?: string;
  userId: string;
  userType: 'client' | 'contractor' | 'supplier' | 'staff';
  method: PaymentMethod;
  purpose: PaymentPurpose;
  amount: number;
  currency: 'MYR' | 'USD' | 'SGD';
  exchangeRate?: number;
  localAmount: number; // Amount in MYR
  status: PaymentStatus;
  
  // Payment Details
  description: string;
  invoiceId?: string;
  quotationId?: string;
  milestoneId?: string;
  
  // Gateway Response
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  gatewayStatus?: string;
  
  // FPX Specific
  fpxTransaction?: FPXTransaction;
  
  // Card Specific
  cardTransaction?: CardTransaction;
  
  // E-Wallet Specific
  ewalletTransaction?: EWalletTransaction;
  
  // JomPay Specific
  jompayBill?: JomPayBill;
  
  // Bank Transfer
  bankTransferDetails?: BankTransferDetails;
  
  // Fees and Charges
  gatewayFee?: number;
  processingFee?: number;
  sst?: number; // Sales and Service Tax
  netAmount?: number;
  
  // Timestamps
  createdAt: Date;
  processedAt?: Date;
  settledAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
  
  // Metadata
  metadata?: Record<string, any>;
  ipAddress?: string;
  deviceInfo?: string;
  location?: string;
  
  // Compliance
  amlCheck?: AMLCheck;
  riskScore?: number;
  fraudCheck?: FraudCheck;
  
  // Notifications
  notificationsSent: NotificationRecord[];
  
  // Audit
  createdBy: string;
  updatedBy?: string;
  approvedBy?: string;
  notes?: string;
}

// ==================== BANK TRANSFER TYPES ====================

export interface BankTransferDetails {
  bankName: string;
  bankCode: string;
  accountNo: string;
  accountName: string;
  transferType: 'instant' | 'giro' | 'ibg' | 'rentas';
  referenceNo: string;
  receiptUrl?: string;
  duitNowId?: string;
  duitNowIdType?: 'mobile' | 'nric' | 'passport' | 'business';
}

// ==================== PAYMENT SETTLEMENT ====================

export interface PaymentSettlement {
  id: string;
  settlementDate: Date;
  provider: string;
  batchNo: string;
  totalTransactions: number;
  totalAmount: number;
  gatewayFees: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankAccount: string;
  transactions: string[]; // Transaction IDs
  reportUrl?: string;
  reconciledAt?: Date;
  reconciledBy?: string;
}

// ==================== REFUND MANAGEMENT ====================

export interface RefundRequest {
  id: string;
  transactionId: string;
  amount: number;
  reason: RefundReason;
  description: string;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  gatewayRefundId?: string;
  refundedAt?: Date;
  failureReason?: string;
  evidence?: string[];
}

export type RefundReason = 
  | 'duplicate_payment'
  | 'cancelled_service'
  | 'quality_issue'
  | 'overcharge'
  | 'customer_request'
  | 'fraud'
  | 'other';

// ==================== INVOICE & BILLING ====================

export interface PaymentInvoice {
  id: string;
  invoiceNo: string;
  projectId?: string;
  clientId: string;
  issueDate: Date;
  dueDate: Date;
  
  // Line Items
  items: InvoiceLineItem[];
  subtotal: number;
  
  // Taxes
  sstRate: number;
  sstAmount: number;
  professionalTax?: number;
  withholdingTax?: number;
  
  // Totals
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  
  // Payment Terms
  paymentTerms: PaymentTerms;
  lateFeeRate?: number;
  
  // Status
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  
  // Payment Methods
  acceptedMethods: PaymentMethod[];
  preferredMethod?: PaymentMethod;
  
  // Transactions
  transactions: string[]; // Payment transaction IDs
  
  // Documents
  pdfUrl?: string;
  attachments?: string[];
  
  // Reminders
  remindersSent: ReminderRecord[];
  
  // Metadata
  notes?: string;
  termsAndConditions?: string;
  createdBy: string;
  sentAt?: Date;
  viewedAt?: Date;
  paidAt?: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  taxable: boolean;
  category?: string;
  milestoneId?: string;
}

export interface PaymentTerms {
  type: 'immediate' | 'net_7' | 'net_15' | 'net_30' | 'net_60' | 'custom';
  days?: number;
  earlyPaymentDiscount?: {
    percentage: number;
    withinDays: number;
  };
  installments?: PaymentInstallment[];
}

export interface PaymentInstallment {
  no: number;
  percentage: number;
  amount: number;
  dueDate: Date;
  description: string;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: Date;
  transactionId?: string;
}

// ==================== ESCROW SERVICES ====================

export interface EscrowAccount {
  id: string;
  projectId: string;
  accountNo: string;
  bankName: string;
  totalAmount: number;
  currentBalance: number;
  status: 'active' | 'closed' | 'frozen';
  
  // Parties
  buyer: string;
  seller: string;
  escrowAgent?: string;
  
  // Milestones
  milestones: EscrowMilestone[];
  
  // Transactions
  deposits: EscrowTransaction[];
  releases: EscrowTransaction[];
  
  // Terms
  agreementUrl?: string;
  termsAcceptedAt?: Date;
  
  // Closure
  closedAt?: Date;
  closureReason?: string;
  finalStatement?: string;
}

export interface EscrowMilestone {
  id: string;
  name: string;
  amount: number;
  releaseConditions: string[];
  status: 'pending' | 'funded' | 'released' | 'disputed';
  fundedAt?: Date;
  releasedAt?: Date;
  releaseApprovedBy?: string[];
}

export interface EscrowTransaction {
  id: string;
  type: 'deposit' | 'release' | 'refund';
  amount: number;
  transactionId: string;
  milestoneId?: string;
  date: Date;
  description: string;
  approvedBy?: string[];
  evidence?: string[];
}

// ==================== SPLIT PAYMENTS ====================

export interface SplitPaymentRule {
  id: string;
  projectId?: string;
  name: string;
  totalAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  
  // Recipients
  recipients: SplitRecipient[];
  
  // Conditions
  triggerType: 'immediate' | 'milestone' | 'approval' | 'date';
  triggerCondition?: string;
  
  // Execution
  executedAt?: Date;
  transactionIds?: string[];
}

export interface SplitRecipient {
  userId: string;
  userType: 'contractor' | 'supplier' | 'staff' | 'platform';
  amount?: number;
  percentage?: number;
  bankAccount?: string;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  transactionId?: string;
  paidAt?: Date;
}

// ==================== COMPLIANCE & REGULATORY ====================

export interface AMLCheck {
  provider: string;
  checkDate: Date;
  status: 'clear' | 'review' | 'blocked';
  riskLevel: 'low' | 'medium' | 'high';
  matchedLists?: string[];
  additionalInfo?: string;
}

export interface FraudCheck {
  provider: string;
  checkDate: Date;
  score: number;
  status: 'passed' | 'review' | 'failed';
  rules: FraudRule[];
  recommendation: string;
}

export interface FraudRule {
  name: string;
  status: 'passed' | 'failed';
  score: number;
  description?: string;
}

export interface ComplianceReport {
  id: string;
  reportType: 'sst' | 'withholding_tax' | 'aml' | 'transaction_report';
  period: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
  submittedAt?: Date;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  
  // SST Specific
  sstDetails?: {
    totalSales: number;
    taxableSales: number;
    sstCollected: number;
    inputTax: number;
    netPayable: number;
  };
  
  // Transaction Report
  transactionSummary?: {
    totalTransactions: number;
    totalAmount: number;
    byMethod: Record<PaymentMethod, number>;
    byPurpose: Record<PaymentPurpose, number>;
    suspiciousTransactions?: string[];
  };
  
  // Documents
  reportUrl?: string;
  submissionRef?: string;
  acknowledgmentUrl?: string;
}

// ==================== PAYMENT SECURITY ====================

export interface PaymentSecurityConfig {
  // PCI DSS
  pciLevel: '1' | '2' | '3' | '4';
  tokenizationEnabled: boolean;
  encryptionMethod: 'AES256' | 'RSA2048';
  
  // 3D Secure
  threeDSVersion: '1.0' | '2.0';
  threeDSRequired: boolean;
  threeDSThreshold?: number;
  
  // Rate Limiting
  rateLimits: {
    transactionsPerMinute: number;
    transactionsPerHour: number;
    transactionsPerDay: number;
    amountPerDay: number;
  };
  
  // Fraud Prevention
  fraudDetection: {
    enabled: boolean;
    provider: string;
    threshold: number;
    autoBlock: boolean;
  };
  
  // IP Restrictions
  allowedIPs?: string[];
  blockedIPs?: string[];
  geoBlocking?: string[]; // Country codes
  
  // Session Security
  sessionTimeout: number;
  requireReauth: boolean;
  mfaRequired: boolean;
}

// ==================== WEBHOOKS & NOTIFICATIONS ====================

export interface PaymentWebhook {
  id: string;
  provider: string;
  event: WebhookEvent;
  payload: any;
  signature?: string;
  receivedAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  attempts: number;
  lastError?: string;
}

export type WebhookEvent = 
  | 'payment.success'
  | 'payment.failed'
  | 'payment.pending'
  | 'payment.cancelled'
  | 'refund.initiated'
  | 'refund.completed'
  | 'refund.failed'
  | 'settlement.completed'
  | 'chargeback.created'
  | 'fraud.detected';

export interface NotificationRecord {
  type: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  recipient: string;
  subject?: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'failed';
  provider?: string;
  messageId?: string;
  error?: string;
}

export interface ReminderRecord {
  sentAt: Date;
  type: 'first' | 'second' | 'final' | 'overdue';
  method: 'email' | 'sms' | 'whatsapp';
  recipient: string;
  status: 'sent' | 'delivered' | 'failed';
}

// ==================== PAYMENT PREFERENCES ====================

export interface PaymentPreferences {
  userId: string;
  defaultMethod?: PaymentMethod;
  savedMethods: SavedPaymentMethod[];
  autoPayEnabled: boolean;
  reminderPreferences: {
    enabled: boolean;
    daysBefore: number;
    methods: ('email' | 'sms' | 'whatsapp')[];
  };
  invoiceDelivery: 'email' | 'whatsapp' | 'both';
  language: 'en' | 'ms' | 'zh' | 'ta';
  currency: 'MYR' | 'USD' | 'SGD';
}

export interface SavedPaymentMethod {
  id: string;
  method: PaymentMethod;
  label: string;
  isDefault: boolean;
  
  // Card
  cardDetails?: {
    maskedNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cardType: CardType;
    tokenId: string;
  };
  
  // Bank Account
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountType: 'savings' | 'current';
  };
  
  // E-Wallet
  ewalletDetails?: {
    provider: string;
    accountId: string;
    phoneNumber?: string;
  };
  
  createdAt: Date;
  lastUsedAt?: Date;
  verified: boolean;
}

// ==================== ACCOUNTING INTEGRATION ====================

export interface AccountingIntegration {
  system: 'sql_account' | 'autocount' | 'quickbooks' | 'xero' | 'custom';
  enabled: boolean;
  config: {
    apiUrl?: string;
    apiKey?: string;
    companyId?: string;
    syncFrequency: 'realtime' | 'hourly' | 'daily';
    lastSync?: Date;
  };
  
  // Mapping
  accountMapping: {
    revenue: string;
    receivables: string;
    bankAccount: string;
    salesTax: string;
    fees: string;
  };
  
  // Sync Settings
  syncSettings: {
    syncInvoices: boolean;
    syncPayments: boolean;
    syncRefunds: boolean;
    syncCustomers: boolean;
    autoReconcile: boolean;
  };
}

// ==================== REPORTING & ANALYTICS ====================

export interface PaymentAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  
  // Revenue Metrics
  totalRevenue: number;
  projectedRevenue: number;
  recurringRevenue: number;
  averageTransactionValue: number;
  
  // Transaction Metrics
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  
  // Payment Method Breakdown
  byMethod: Record<PaymentMethod, {
    count: number;
    amount: number;
    percentage: number;
  }>;
  
  // User Metrics
  uniquePayers: number;
  repeatCustomers: number;
  newCustomers: number;
  churnRate: number;
  
  // Collection Metrics
  collectionEfficiency: number;
  averageDaysToPayment: number;
  overdueAmount: number;
  overdueCount: number;
  
  // Fee Analysis
  totalFees: number;
  averageFeeRate: number;
  netRevenue: number;
}

export interface PaymentForecast {
  period: {
    start: Date;
    end: Date;
  };
  expectedRevenue: number;
  expectedTransactions: number;
  pendingPayments: number;
  upcomingMilestones: {
    date: Date;
    amount: number;
    projectId: string;
    confidence: 'high' | 'medium' | 'low';
  }[];
  cashFlowProjection: {
    date: Date;
    inflow: number;
    outflow: number;
    balance: number;
  }[];
}