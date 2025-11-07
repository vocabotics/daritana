import { create } from 'zustand';
import { Invoice, Quotation, QuotationItem, InvoiceItem } from '@/types';
import { financialAPI, FinancialInvoice, FinancialExpense, FinancialBudget } from '@/services/financialAPI';
import { useDemoStore } from './demoStore';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: Date;
  method: 'bank_transfer' | 'fpx' | 'credit_card' | 'cash' | 'cheque';
  reference: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export type Expense = FinancialExpense;
export type Budget = FinancialBudget;

interface ExtendedInvoice extends FinancialInvoice {}

interface FinancialStore {
  invoices: ExtendedInvoice[];
  quotations: Quotation[];
  payments: Payment[];
  expenses: Expense[];
  budgets: Budget[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Invoice methods
  fetchInvoices: (params?: { projectId?: string; status?: string }) => Promise<void>;
  createInvoice: (invoice: Omit<ExtendedInvoice, 'id' | 'createdAt'>) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<ExtendedInvoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  sendInvoice: (id: string, recipients: string[]) => Promise<void>;
  
  // Quotation methods
  fetchQuotations: (params?: { projectId?: string; status?: string }) => Promise<void>;
  createQuotation: (quotation: Omit<Quotation, 'id' | 'submittedAt'>) => Promise<void>;
  updateQuotation: (id: string, updates: Partial<Quotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  approveQuotation: (id: string) => Promise<void>;
  rejectQuotation: (id: string) => Promise<void>;
  convertQuotationToInvoice: (quotationId: string) => Promise<void>;
  
  // Payment methods - keeping local for now as backend doesn't have payment endpoints
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  
  // Expense methods
  fetchExpenses: (params?: { projectId?: string; status?: string }) => Promise<void>;
  createExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  approveExpense: (id: string, notes?: string) => Promise<void>;
  rejectExpense: (id: string, reason: string) => Promise<void>;
  
  // Budget methods
  fetchBudgets: (params?: { projectId?: string }) => Promise<void>;
  createBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  // Analytics methods
  fetchFinancialAnalytics: (params?: { timeframe?: string; projectId?: string }) => Promise<any>;
  fetchFinancialKPIs: (params?: { timeframe?: string; projectId?: string }) => Promise<any>;
  
  // Query methods (local data)
  getInvoicesByProject: (projectId: string) => ExtendedInvoice[];
  getQuotationsByProject: (projectId: string) => Quotation[];
  getPaymentsByInvoice: (invoiceId: string) => Payment[];
  getExpensesByProject: (projectId: string) => Expense[];
  getBudgetByProject: (projectId: string) => Budget | undefined;
  getOverdueInvoices: () => ExtendedInvoice[];
  getTotalRevenue: (projectId?: string) => number;
  getTotalOutstanding: (projectId?: string) => number;
  getTotalExpenses: (projectId?: string) => number;
  
  // Utility methods
  clearError: () => void;
  reset: () => void;
}

// Default empty arrays for initial state
const defaultInvoices: ExtendedInvoice[] = [];
const defaultQuotations: Quotation[] = [];
const defaultPayments: Payment[] = [];
const defaultExpenses: Expense[] = [];
const defaultBudgets: Budget[] = [];

export const useFinancialStore = create<FinancialStore>((set, get) => ({
  invoices: defaultInvoices,
  quotations: defaultQuotations,
  payments: defaultPayments,
  expenses: defaultExpenses,
  budgets: defaultBudgets,
  isLoading: false,
  error: null,
  
  // Invoice methods
  fetchInvoices: async (params) => {
    set({ isLoading: true, error: null });
    const isDemoMode = useDemoStore.getState().isEnabled;
    
    if (isDemoMode) {
      // Return sample data in demo mode
      set({ 
        invoices: [
          {
            id: 'demo-1',
            projectId: 'demo-project',
            contractorId: 'demo-contractor',
            quotationId: 'demo-quote',
            invoiceNumber: 'INV-DEMO-001',
            number: 'INV-DEMO-001',
            client: 'Demo Client',
            category: 'Design',
            amount: 25000,
            currency: 'MYR',
            dueDate: new Date('2024-12-31'),
            status: 'draft',
            items: [
              {
                id: 'demo-item-1',
                description: 'Demo Design Services',
                quantity: 1,
                unitPrice: 25000,
                total: 25000
              }
            ],
            attachments: [],
            createdAt: new Date()
          }
        ],
        isLoading: false 
      });
      return;
    }
    
    try {
      const response = await financialAPI.invoices.getAll(params);
      set({ 
        invoices: response.invoices || [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      set({ 
        invoices: [],
        error: 'Failed to fetch invoices',
        isLoading: false 
      });
    }
  },
  
  createInvoice: async (invoice) => {
    set({ isLoading: true, error: null });
    try {
      const newInvoice = await financialAPI.invoices.create(invoice);
      set((state) => ({
        invoices: [...state.invoices, newInvoice],
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to create invoice:', error);
      // Fallback to local creation
      const newInvoice = {
        ...invoice,
        id: `inv-${Date.now()}`,
        createdAt: new Date()
      } as ExtendedInvoice;
      set((state) => ({
        invoices: [...state.invoices, newInvoice],
        error: 'Created locally - sync pending',
        isLoading: false
      }));
    }
  },
  
  updateInvoice: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedInvoice = await financialAPI.invoices.update(id, updates);
      set((state) => ({
        invoices: state.invoices.map(inv => 
          inv.id === id ? updatedInvoice : inv
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update invoice:', error);
      // Fallback to local update
      set((state) => ({
        invoices: state.invoices.map(inv => 
          inv.id === id ? { ...inv, ...updates } : inv
        ),
        error: 'Updated locally - sync pending',
        isLoading: false
      }));
    }
  },
  
  deleteInvoice: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financialAPI.invoices.delete(id);
      set((state) => ({
        invoices: state.invoices.filter(inv => inv.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      set({ 
        error: 'Failed to delete invoice',
        isLoading: false 
      });
    }
  },
  
  sendInvoice: async (id, recipients) => {
    set({ isLoading: true, error: null });
    try {
      await financialAPI.invoices.send(id, recipients);
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to send invoice:', error);
      set({ 
        error: 'Failed to send invoice',
        isLoading: false 
      });
    }
  },
  
  // Quotation methods
  fetchQuotations: async (params) => {
    set({ isLoading: true, error: null });
    const isDemoMode = useDemoStore.getState().isEnabled;
    
    if (isDemoMode) {
      // Return sample data in demo mode
      set({ 
        quotations: [
          {
            id: 'demo-quote-1',
            projectId: 'demo-project',
            contractorId: 'demo-contractor',
            title: 'Demo Design Services',
            description: 'Sample quotation for demonstration purposes',
            amount: 25000,
            currency: 'MYR',
            validUntil: new Date('2024-12-31'),
            status: 'draft',
            items: [
              {
                id: 'demo-item-1',
                description: 'Demo Design Services',
                quantity: 1,
                unitPrice: 25000,
                total: 25000
              }
            ],
            attachments: [],
            submittedAt: new Date()
          }
        ],
        isLoading: false 
      });
      return;
    }
    
    try {
      // Note: quotations API might not be implemented yet
      set({ 
        quotations: [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
      set({ 
        quotations: [],
        error: 'Failed to fetch quotations',
        isLoading: false 
      });
    }
  },
  
  createQuotation: async (quotation) => {
    set({ isLoading: true, error: null });
    try {
      const newQuotation = {
        ...quotation,
        id: `quote-${Date.now()}`,
        submittedAt: new Date()
      } as Quotation;
      set((state) => ({
        quotations: [...state.quotations, newQuotation],
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to create quotation:', error);
      set({ 
        error: 'Failed to create quotation',
        isLoading: false 
      });
    }
  },
  
  updateQuotation: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        quotations: state.quotations.map(q => 
          q.id === id ? { ...q, ...updates } : q
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update quotation:', error);
      set({ 
        error: 'Failed to update quotation',
        isLoading: false 
      });
    }
  },
  
  deleteQuotation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        quotations: state.quotations.filter(q => q.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to delete quotation:', error);
      set({ 
        error: 'Failed to delete quotation',
        isLoading: false 
      });
    }
  },
  
  approveQuotation: async (id) => {
    await get().updateQuotation(id, { status: 'approved' });
  },
  
  rejectQuotation: async (id) => {
    await get().updateQuotation(id, { status: 'rejected' });
  },
  
  convertQuotationToInvoice: async (quotationId) => {
    const quotation = get().quotations.find(q => q.id === quotationId);
    if (!quotation) return;
    
    const newInvoice = {
      projectId: quotation.projectId,
      contractorId: quotation.contractorId,
      quotationId: quotation.id,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(get().invoices.length + 1).padStart(3, '0')}`,
      number: `INV-${new Date().getFullYear()}-${String(get().invoices.length + 1).padStart(3, '0')}`,
      amount: quotation.amount,
      currency: quotation.currency,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'draft' as const,
      items: quotation.items,
      attachments: []
    };
    
    await get().createInvoice(newInvoice);
  },
  
  // Payment methods (local only for now)
  addPayment: (payment) => {
    const invoice = get().invoices.find(inv => inv.id === payment.invoiceId);
    if (invoice) {
      const totalPayments = [...get().payments, payment]
        .filter(p => p.invoiceId === payment.invoiceId)
        .reduce((sum, p) => sum + p.amount, 0);
      
      const updatedInvoices = get().invoices.map(inv => {
        if (inv.id === payment.invoiceId) {
          return {
            ...inv,
            status: totalPayments >= inv.amount ? 'paid' as const : inv.status
          };
        }
        return inv;
      });
      
      set((state) => ({
        payments: [...state.payments, payment],
        invoices: updatedInvoices
      }));
    } else {
      set((state) => ({
        payments: [...state.payments, payment]
      }));
    }
  },
  
  updatePayment: (id, updates) => set((state) => ({
    payments: state.payments.map(p => 
      p.id === id ? { ...p, ...updates } : p
    )
  })),
  
  deletePayment: (id) => set((state) => ({
    payments: state.payments.filter(p => p.id !== id)
  })),
  
  // Expense methods
  fetchExpenses: async (params) => {
    set({ isLoading: true, error: null });
    const isDemoMode = useDemoStore.getState().isEnabled;
    
    if (isDemoMode) {
      // Return sample data in demo mode
      set({ 
        expenses: [
          {
            id: 'demo-exp-1',
            projectId: 'demo-project',
            category: 'Materials',
            description: 'Demo expense for demonstration purposes',
            amount: 2500,
            date: new Date(),
            status: 'approved',
            createdBy: 'demo-user',
            createdAt: new Date()
          }
        ],
        isLoading: false 
      });
      return;
    }
    
    try {
      const response = await financialAPI.expenses.getAll(params);
      set({ 
        expenses: response.expenses || [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      set({ 
        expenses: [],
        error: 'Failed to fetch expenses',
        isLoading: false 
      });
    }
  },
  
  createExpense: async (expense) => {
    set({ isLoading: true, error: null });
    try {
      const newExpense = await financialAPI.expenses.create(expense);
      set((state) => ({
        expenses: [...state.expenses, newExpense],
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to create expense:', error);
      // Fallback to local creation
      const newExpense = {
        ...expense,
        id: `exp-${Date.now()}`,
        createdAt: new Date()
      } as Expense;
      set((state) => ({
        expenses: [...state.expenses, newExpense],
        error: 'Created locally - sync pending',
        isLoading: false
      }));
    }
  },
  
  updateExpense: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedExpense = await financialAPI.expenses.update(id, updates);
      set((state) => ({
        expenses: state.expenses.map(exp => 
          exp.id === id ? updatedExpense : exp
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update expense:', error);
      // Fallback to local update
      set((state) => ({
        expenses: state.expenses.map(exp => 
          exp.id === id ? { ...exp, ...updates } : exp
        ),
        error: 'Updated locally - sync pending',
        isLoading: false
      }));
    }
  },
  
  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financialAPI.expenses.delete(id);
      set((state) => ({
        expenses: state.expenses.filter(exp => exp.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to delete expense:', error);
      set({ 
        error: 'Failed to delete expense',
        isLoading: false 
      });
    }
  },
  
  approveExpense: async (id, notes) => {
    set({ isLoading: true, error: null });
    try {
      await financialAPI.expenses.approve(id, notes);
      set((state) => ({
        expenses: state.expenses.map(exp => 
          exp.id === id ? { ...exp, status: 'approved' } : exp
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to approve expense:', error);
      set({ 
        error: 'Failed to approve expense',
        isLoading: false 
      });
    }
  },
  
  rejectExpense: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      await financialAPI.expenses.reject(id, reason);
      set((state) => ({
        expenses: state.expenses.map(exp => 
          exp.id === id ? { ...exp, status: 'rejected' } : exp
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to reject expense:', error);
      set({ 
        error: 'Failed to reject expense',
        isLoading: false 
      });
    }
  },
  
  // Budget methods
  fetchBudgets: async (params) => {
    set({ isLoading: true, error: null });
    const isDemoMode = useDemoStore.getState().isEnabled;
    
    if (isDemoMode) {
      // Return sample data in demo mode
      set({ 
        budgets: [
          {
            id: 'demo-budget-1',
            projectId: 'demo-project',
            totalAmount: 250000,
            allocations: {
              design: 50000,
              materials: 87500,
              labor: 62500,
              equipment: 25000,
              contingency: 25000
            },
            spent: 45000,
            remaining: 205000,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        isLoading: false 
      });
      return;
    }
    
    try {
      const response = await financialAPI.budgets.getAll(params);
      set({ 
        budgets: response.budgets || [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      set({ 
        budgets: [],
        error: 'Failed to fetch budgets',
        isLoading: false 
      });
    }
  },
  
  createBudget: async (budget) => {
    set({ isLoading: true, error: null });
    try {
      const newBudget = await financialAPI.budgets.create(budget);
      set((state) => ({
        budgets: [...state.budgets, newBudget],
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to create budget:', error);
      // Fallback to local creation
      const newBudget = {
        ...budget,
        id: `budget-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Budget;
      set((state) => ({
        budgets: [...state.budgets, newBudget],
        error: 'Created locally - sync pending',
        isLoading: false
      }));
    }
  },
  
  updateBudget: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedBudget = await financialAPI.budgets.update(id, updates);
      set((state) => ({
        budgets: state.budgets.map(b => 
          b.id === id ? updatedBudget : b
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update budget:', error);
      // Fallback to local update
      set((state) => ({
        budgets: state.budgets.map(b => 
          b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b
        ),
        error: 'Updated locally - sync pending',
        isLoading: false
      }));
    }
  },
  
  deleteBudget: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await financialAPI.budgets.delete(id);
      set((state) => ({
        budgets: state.budgets.filter(b => b.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to delete budget:', error);
      set({ 
        error: 'Failed to delete budget',
        isLoading: false 
      });
    }
  },
  
  // Analytics methods
  fetchFinancialAnalytics: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const analytics = await financialAPI.analytics.getDashboard(params);
      set({ isLoading: false });
      return analytics;
    } catch (error) {
      console.error('Failed to fetch financial analytics:', error);
      set({ 
        error: 'Failed to fetch analytics',
        isLoading: false 
      });
      return null;
    }
  },
  
  fetchFinancialKPIs: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const kpis = await financialAPI.analytics.getKPIs(params);
      set({ isLoading: false });
      return kpis;
    } catch (error) {
      console.error('Failed to fetch financial KPIs:', error);
      set({ 
        error: 'Failed to fetch KPIs',
        isLoading: false 
      });
      return null;
    }
  },
  
  // Query methods (local data)
  getInvoicesByProject: (projectId) => {
    return get().invoices.filter(inv => inv.projectId === projectId);
  },
  
  getQuotationsByProject: (projectId) => {
    return get().quotations.filter(q => q.projectId === projectId);
  },
  
  getPaymentsByInvoice: (invoiceId) => {
    return get().payments.filter(p => p.invoiceId === invoiceId);
  },
  
  getExpensesByProject: (projectId) => {
    return get().expenses.filter(exp => exp.projectId === projectId);
  },
  
  getBudgetByProject: (projectId) => {
    return get().budgets.find(b => b.projectId === projectId);
  },
  
  getOverdueInvoices: () => {
    const now = new Date();
    return get().invoices.filter(inv => 
      (inv.status === 'overdue' || (inv.status === 'pending' && inv.dueDate && new Date(inv.dueDate) < now))
    );
  },
  
  getTotalRevenue: (projectId) => {
    const invoices = projectId 
      ? get().invoices.filter(inv => inv.projectId === projectId)
      : get().invoices;
    return invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  },
  
  getTotalOutstanding: (projectId) => {
    const invoices = projectId 
      ? get().invoices.filter(inv => inv.projectId === projectId)
      : get().invoices;
    return invoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.amount, 0);
  },
  
  getTotalExpenses: (projectId) => {
    const expenses = projectId 
      ? get().expenses.filter(exp => exp.projectId === projectId)
      : get().expenses;
    return expenses
      .filter(exp => exp.status === 'approved')
      .reduce((sum, exp) => sum + exp.amount, 0);
  },
  
  // Utility methods
  clearError: () => set({ error: null }),
  
  reset: () => set({
    invoices: [],
    quotations: [],
    payments: [],
    expenses: [],
    budgets: [],
    isLoading: false,
    error: null
  })
}));