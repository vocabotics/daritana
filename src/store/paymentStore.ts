// ==================== PAYMENT STORE ====================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  PaymentTransaction, 
  PaymentInvoice, 
  PaymentMethod,
  PaymentStatus,
  FPXBank,
  SavedPaymentMethod,
  PaymentPreferences,
  PaymentAnalytics,
  PaymentSettlement,
  RefundRequest,
  EscrowAccount
} from '@/types/payment';
import { PaymentService } from '@/services/payment/PaymentService';

interface PaymentStore {
  // Service
  paymentService: PaymentService;

  // State
  transactions: PaymentTransaction[];
  invoices: PaymentInvoice[];
  refunds: RefundRequest[];
  settlements: PaymentSettlement[];
  escrowAccounts: EscrowAccount[];
  
  // User Preferences
  preferences: PaymentPreferences | null;
  savedMethods: SavedPaymentMethod[];
  
  // FPX Banks
  fpxBanks: {
    individual: FPXBank[];
    corporate: FPXBank[];
    lastUpdated: Date | null;
  };
  
  // Analytics
  analytics: PaymentAnalytics | null;
  
  // Loading States
  isProcessing: boolean;
  isLoadingBanks: boolean;
  isLoadingTransactions: boolean;
  
  // Error State
  error: string | null;
  
  // Actions - Transactions
  createPayment: (params: {
    amount: number;
    currency: 'MYR' | 'USD' | 'SGD';
    method: PaymentMethod;
    purpose: string;
    description: string;
    userId: string;
    userType: 'client' | 'contractor' | 'supplier' | 'staff';
    projectId?: string;
    invoiceId?: string;
    metadata?: Record<string, any>;
  }) => Promise<PaymentTransaction>;
  
  getTransaction: (id: string) => PaymentTransaction | undefined;
  getTransactionsByProject: (projectId: string) => PaymentTransaction[];
  getTransactionsByUser: (userId: string) => PaymentTransaction[];
  updateTransactionStatus: (id: string, status: PaymentStatus) => void;
  
  // Actions - FPX
  loadFPXBanks: (type?: 'individual' | 'corporate') => Promise<void>;
  refreshFPXBanks: () => Promise<void>;
  
  // Actions - Invoices
  createInvoice: (invoice: Partial<PaymentInvoice>) => Promise<PaymentInvoice>;
  getInvoice: (id: string) => PaymentInvoice | undefined;
  updateInvoice: (id: string, updates: Partial<PaymentInvoice>) => void;
  sendInvoice: (id: string) => Promise<void>;
  markInvoiceAsPaid: (id: string, transactionId: string) => void;
  
  // Actions - Refunds
  requestRefund: (params: {
    transactionId: string;
    amount: number;
    reason: string;
    requestedBy: string;
  }) => Promise<RefundRequest>;
  approveRefund: (refundId: string, approvedBy: string) => Promise<void>;
  getRefundsByTransaction: (transactionId: string) => RefundRequest[];
  
  // Actions - Settlements
  getSettlements: (startDate: Date, endDate: Date) => PaymentSettlement[];
  reconcileSettlement: (settlementId: string, reconciledBy: string) => void;
  
  // Actions - Escrow
  createEscrowAccount: (params: Partial<EscrowAccount>) => Promise<EscrowAccount>;
  releaseEscrowFunds: (escrowId: string, milestoneId: string, approvedBy: string[]) => Promise<void>;
  getEscrowByProject: (projectId: string) => EscrowAccount | undefined;
  
  // Actions - Preferences
  loadPreferences: (userId: string) => Promise<void>;
  updatePreferences: (updates: Partial<PaymentPreferences>) => Promise<void>;
  savePaymentMethod: (method: SavedPaymentMethod) => Promise<void>;
  removePaymentMethod: (methodId: string) => Promise<void>;
  setDefaultPaymentMethod: (methodId: string) => Promise<void>;
  
  // Actions - Analytics
  loadAnalytics: (startDate: Date, endDate: Date) => Promise<void>;
  generatePaymentReport: (type: 'summary' | 'detailed', startDate: Date, endDate: Date) => Promise<string>;
  
  // Actions - Utilities
  validatePaymentMethod: (method: PaymentMethod, params: any) => boolean;
  calculateFees: (amount: number, method: PaymentMethod) => {
    gateway: number;
    processing: number;
    sst: number;
    total: number;
    net: number;
  };
  formatCurrency: (amount: number, currency?: string) => string;
  
  // Clear error
  clearError: () => void;
}

export const usePaymentStore = create<PaymentStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initialize service
        paymentService: new PaymentService(),
        
        // Initial state
        transactions: [],
        invoices: [],
        refunds: [],
        settlements: [],
        escrowAccounts: [],
        preferences: null,
        savedMethods: [],
        fpxBanks: {
          individual: [],
          corporate: [],
          lastUpdated: null
        },
        analytics: null,
        isProcessing: false,
        isLoadingBanks: false,
        isLoadingTransactions: false,
        error: null,
        
        // ==================== TRANSACTIONS ====================
        
        createPayment: async (params) => {
          set({ isProcessing: true, error: null });
          
          try {
            const transaction = await get().paymentService.createPayment(params);
            
            set(state => ({
              transactions: [...state.transactions, transaction],
              isProcessing: false
            }));
            
            return transaction;
          } catch (error: any) {
            set({ 
              isProcessing: false, 
              error: error.message || 'Payment failed' 
            });
            throw error;
          }
        },
        
        getTransaction: (id) => {
          return get().transactions.find(t => t.id === id);
        },
        
        getTransactionsByProject: (projectId) => {
          return get().transactions.filter(t => t.projectId === projectId);
        },
        
        getTransactionsByUser: (userId) => {
          return get().transactions.filter(t => t.userId === userId);
        },
        
        updateTransactionStatus: (id, status) => {
          set(state => ({
            transactions: state.transactions.map(t => 
              t.id === id ? { ...t, status } : t
            )
          }));
        },
        
        // ==================== FPX ====================
        
        loadFPXBanks: async (type = 'individual') => {
          set({ isLoadingBanks: true, error: null });
          
          try {
            const banks = await get().paymentService.getAvailableFPXBanks(type);
            
            set(state => ({
              fpxBanks: {
                ...state.fpxBanks,
                [type]: banks,
                lastUpdated: new Date()
              },
              isLoadingBanks: false
            }));
          } catch (error: any) {
            set({ 
              isLoadingBanks: false, 
              error: error.message || 'Failed to load banks' 
            });
          }
        },
        
        refreshFPXBanks: async () => {
          await Promise.all([
            get().loadFPXBanks('individual'),
            get().loadFPXBanks('corporate')
          ]);
        },
        
        // ==================== INVOICES ====================
        
        createInvoice: async (invoice) => {
          const newInvoice: PaymentInvoice = {
            id: `INV${Date.now()}`,
            invoiceNo: `INV-${new Date().getFullYear()}-${String(get().invoices.length + 1).padStart(5, '0')}`,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            items: [],
            subtotal: 0,
            sstRate: 0.06,
            sstAmount: 0,
            totalAmount: 0,
            paidAmount: 0,
            balanceAmount: 0,
            paymentTerms: {
              type: 'net_30'
            },
            status: 'draft',
            acceptedMethods: ['fpx', 'credit_card', 'bank_transfer'],
            transactions: [],
            remindersSent: [],
            createdBy: 'system',
            ...invoice,
            clientId: invoice.clientId || ''
          };
          
          // Calculate totals
          newInvoice.subtotal = newInvoice.items.reduce((sum, item) => sum + item.amount, 0);
          newInvoice.sstAmount = newInvoice.subtotal * newInvoice.sstRate;
          newInvoice.totalAmount = newInvoice.subtotal + newInvoice.sstAmount;
          newInvoice.balanceAmount = newInvoice.totalAmount - newInvoice.paidAmount;
          
          set(state => ({
            invoices: [...state.invoices, newInvoice]
          }));
          
          return newInvoice;
        },
        
        getInvoice: (id) => {
          return get().invoices.find(i => i.id === id);
        },
        
        updateInvoice: (id, updates) => {
          set(state => ({
            invoices: state.invoices.map(i => 
              i.id === id ? { ...i, ...updates } : i
            )
          }));
        },
        
        sendInvoice: async (id) => {
          const invoice = get().getInvoice(id);
          if (!invoice) throw new Error('Invoice not found');
          
          // Send invoice via notification service
          // Update status to 'sent'
          get().updateInvoice(id, { 
            status: 'sent',
            sentAt: new Date()
          });
        },
        
        markInvoiceAsPaid: (id, transactionId) => {
          const invoice = get().getInvoice(id);
          if (!invoice) return;
          
          const transaction = get().getTransaction(transactionId);
          if (!transaction) return;
          
          get().updateInvoice(id, {
            status: 'paid',
            paidAmount: invoice.totalAmount,
            balanceAmount: 0,
            paidAt: new Date(),
            transactions: [...invoice.transactions, transactionId]
          });
        },
        
        // ==================== REFUNDS ====================
        
        requestRefund: async (params) => {
          try {
            const refund = await get().paymentService.processRefund(params);
            
            set(state => ({
              refunds: [...state.refunds, refund]
            }));
            
            return refund;
          } catch (error: any) {
            set({ error: error.message || 'Refund request failed' });
            throw error;
          }
        },
        
        approveRefund: async (refundId, approvedBy) => {
          const refund = get().refunds.find(r => r.id === refundId);
          if (!refund) throw new Error('Refund not found');
          
          set(state => ({
            refunds: state.refunds.map(r => 
              r.id === refundId 
                ? { 
                    ...r, 
                    status: 'approved',
                    approvedBy,
                    approvedAt: new Date()
                  }
                : r
            )
          }));
        },
        
        getRefundsByTransaction: (transactionId) => {
          return get().refunds.filter(r => r.transactionId === transactionId);
        },
        
        // ==================== SETTLEMENTS ====================
        
        getSettlements: (startDate, endDate) => {
          return get().settlements.filter(s => 
            s.settlementDate >= startDate && s.settlementDate <= endDate
          );
        },
        
        reconcileSettlement: (settlementId, reconciledBy) => {
          set(state => ({
            settlements: state.settlements.map(s => 
              s.id === settlementId
                ? {
                    ...s,
                    status: 'completed',
                    reconciledAt: new Date(),
                    reconciledBy
                  }
                : s
            )
          }));
        },
        
        // ==================== ESCROW ====================
        
        createEscrowAccount: async (params) => {
          const escrow: EscrowAccount = {
            id: `ESC${Date.now()}`,
            projectId: params.projectId || '',
            accountNo: `ESC-${Date.now()}`,
            bankName: 'Maybank',
            totalAmount: params.totalAmount || 0,
            currentBalance: params.totalAmount || 0,
            status: 'active',
            buyer: params.buyer || '',
            seller: params.seller || '',
            milestones: params.milestones || [],
            deposits: [],
            releases: [],
            ...params
          };
          
          set(state => ({
            escrowAccounts: [...state.escrowAccounts, escrow]
          }));
          
          return escrow;
        },
        
        releaseEscrowFunds: async (escrowId, milestoneId, approvedBy) => {
          const escrow = get().escrowAccounts.find(e => e.id === escrowId);
          if (!escrow) throw new Error('Escrow account not found');
          
          const milestone = escrow.milestones.find(m => m.id === milestoneId);
          if (!milestone) throw new Error('Milestone not found');
          
          // Update milestone status
          set(state => ({
            escrowAccounts: state.escrowAccounts.map(e => 
              e.id === escrowId
                ? {
                    ...e,
                    milestones: e.milestones.map(m =>
                      m.id === milestoneId
                        ? {
                            ...m,
                            status: 'released',
                            releasedAt: new Date(),
                            releaseApprovedBy: approvedBy
                          }
                        : m
                    ),
                    currentBalance: e.currentBalance - milestone.amount
                  }
                : e
            )
          }));
        },
        
        getEscrowByProject: (projectId) => {
          return get().escrowAccounts.find(e => e.projectId === projectId);
        },
        
        // ==================== PREFERENCES ====================
        
        loadPreferences: async (userId) => {
          // Load user preferences from API/database
          const preferences: PaymentPreferences = {
            userId,
            savedMethods: [],
            autoPayEnabled: false,
            reminderPreferences: {
              enabled: true,
              daysBefore: 3,
              methods: ['email']
            },
            invoiceDelivery: 'email',
            language: 'en',
            currency: 'MYR'
          };
          
          set({ preferences });
        },
        
        updatePreferences: async (updates) => {
          set(state => ({
            preferences: state.preferences 
              ? { ...state.preferences, ...updates }
              : null
          }));
        },
        
        savePaymentMethod: async (method) => {
          set(state => ({
            savedMethods: [...state.savedMethods, method],
            preferences: state.preferences
              ? {
                  ...state.preferences,
                  savedMethods: [...state.preferences.savedMethods, method]
                }
              : null
          }));
        },
        
        removePaymentMethod: async (methodId) => {
          set(state => ({
            savedMethods: state.savedMethods.filter(m => m.id !== methodId),
            preferences: state.preferences
              ? {
                  ...state.preferences,
                  savedMethods: state.preferences.savedMethods.filter(m => m.id !== methodId)
                }
              : null
          }));
        },
        
        setDefaultPaymentMethod: async (methodId) => {
          set(state => ({
            savedMethods: state.savedMethods.map(m => ({
              ...m,
              isDefault: m.id === methodId
            })),
            preferences: state.preferences
              ? {
                  ...state.preferences,
                  defaultMethod: state.savedMethods.find(m => m.id === methodId)?.method
                }
              : null
          }));
        },
        
        // ==================== ANALYTICS ====================
        
        loadAnalytics: async (startDate, endDate) => {
          const transactions = get().transactions.filter(t => 
            t.createdAt >= startDate && t.createdAt <= endDate
          );
          
          // Calculate analytics
          const analytics: PaymentAnalytics = {
            period: { start: startDate, end: endDate },
            totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
            projectedRevenue: 0,
            recurringRevenue: 0,
            averageTransactionValue: transactions.length > 0 
              ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
              : 0,
            totalTransactions: transactions.length,
            successfulTransactions: transactions.filter(t => t.status === 'captured' || t.status === 'settled').length,
            failedTransactions: transactions.filter(t => t.status === 'failed').length,
            successRate: transactions.length > 0
              ? (transactions.filter(t => t.status === 'captured' || t.status === 'settled').length / transactions.length) * 100
              : 0,
            byMethod: {} as any,
            uniquePayers: new Set(transactions.map(t => t.userId)).size,
            repeatCustomers: 0,
            newCustomers: 0,
            churnRate: 0,
            collectionEfficiency: 0,
            averageDaysToPayment: 0,
            overdueAmount: 0,
            overdueCount: 0,
            totalFees: transactions.reduce((sum, t) => sum + (t.gatewayFee || 0) + (t.processingFee || 0), 0),
            averageFeeRate: 0,
            netRevenue: 0
          };
          
          set({ analytics });
        },
        
        generatePaymentReport: async (type, startDate, endDate) => {
          // Generate report URL
          return `/reports/payment_${type}_${startDate.getTime()}_${endDate.getTime()}.pdf`;
        },
        
        // ==================== UTILITIES ====================
        
        validatePaymentMethod: (method, params) => {
          switch (method) {
            case 'fpx':
              return !!(params.buyerBankId && params.buyerEmail && params.buyerName);
            
            case 'credit_card':
            case 'debit_card':
              return !!(params.cardNumber && params.cardHolder && params.expiryMonth && params.expiryYear && params.cvv);
            
            case 'ewallet_grab':
            case 'ewallet_tng':
            case 'ewallet_boost':
            case 'ewallet_shopee':
              return !!(params.customerPhone);
            
            default:
              return true;
          }
        },
        
        calculateFees: (amount, method) => {
          let gatewayFee = 0;
          let processingFee = 0;
          
          switch (method) {
            case 'fpx':
              gatewayFee = amount * 0.01; // 1%
              processingFee = 1.00; // RM 1.00
              break;
            
            case 'credit_card':
              gatewayFee = amount * 0.025; // 2.5%
              break;
            
            case 'debit_card':
              gatewayFee = amount * 0.015; // 1.5%
              break;
            
            case 'ewallet_grab':
            case 'ewallet_tng':
              gatewayFee = amount * 0.015; // 1.5%
              break;
            
            case 'ewallet_boost':
            case 'ewallet_shopee':
              gatewayFee = amount * 0.018; // 1.8%
              break;
          }
          
          const sst = (gatewayFee + processingFee) * 0.06; // 6% SST
          const total = gatewayFee + processingFee + sst;
          const net = amount - total;
          
          return {
            gateway: gatewayFee,
            processing: processingFee,
            sst,
            total,
            net
          };
        },
        
        formatCurrency: (amount, currency = 'MYR') => {
          const formatter = new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          
          return formatter.format(amount);
        },
        
        clearError: () => {
          set({ error: null });
        }
      }),
      {
        name: 'payment-store',
        partialize: (state) => ({
          preferences: state.preferences,
          savedMethods: state.savedMethods
        })
      }
    )
  )
);