import { apiClient } from './api';
import { Invoice, Quotation } from '@/types';

// Extended types for API responses
export interface FinancialInvoice extends Omit<Invoice, 'id'> {
  id: string;
  number?: string;
  client?: string;
  category?: string;
}

export interface FinancialExpense {
  id: string;
  projectId?: string;
  category: 'Materials' | 'Labor' | 'Equipment' | 'Transportation' | 'Other';
  description: string;
  amount: number;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string;
  createdBy: string;
  createdAt: Date;
}

export interface FinancialBudget {
  id: string;
  projectId: string;
  totalAmount: number;
  allocations: {
    design: number;
    materials: number;
    labor: number;
    equipment: number;
    contingency: number;
  };
  spent: number;
  remaining: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialAnalytics {
  totalRevenue: number;
  totalOutstanding: number;
  totalExpenses: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;
  overdueInvoices: number;
  averagePaymentTime: number;
}

export interface FinancialKPIs {
  grossRevenue: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: number;
  accountsReceivable: number;
  averageInvoiceValue: number;
  collectionPeriod: number;
  expenseRatio: number;
}

// ==================== INVOICE API ====================

export const invoiceAPI = {
  async getAll(params?: { 
    projectId?: string; 
    status?: string; 
    page?: number; 
    limit?: number; 
  }) {
    const response = await apiClient.get('/financial/invoices', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/financial/invoices/${id}`);
    return response.data;
  },

  async create(invoice: Omit<FinancialInvoice, 'id' | 'createdAt'>) {
    const response = await apiClient.post('/financial/invoices', invoice);
    return response.data;
  },

  async update(id: string, updates: Partial<FinancialInvoice>) {
    const response = await apiClient.put(`/financial/invoices/${id}`, updates);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/financial/invoices/${id}`);
    return response.data;
  },

  async send(id: string, recipients: string[]) {
    const response = await apiClient.post(`/financial/invoices/${id}/send`, { recipients });
    return response.data;
  },

  async getAnalytics(params?: { timeframe?: string; projectId?: string }) {
    const response = await apiClient.get('/financial/analytics/invoices', { params });
    return response.data;
  }
};

// ==================== EXPENSE API ====================

export const expenseAPI = {
  async getAll(params?: { 
    projectId?: string; 
    status?: string; 
    category?: string;
    page?: number; 
    limit?: number; 
  }) {
    const response = await apiClient.get('/financial/expenses', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/financial/expenses/${id}`);
    return response.data;
  },

  async create(expense: Omit<FinancialExpense, 'id' | 'createdAt'>) {
    const response = await apiClient.post('/financial/expenses', expense);
    return response.data;
  },

  async update(id: string, updates: Partial<FinancialExpense>) {
    const response = await apiClient.put(`/financial/expenses/${id}`, updates);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/financial/expenses/${id}`);
    return response.data;
  },

  async approve(id: string, notes?: string) {
    const response = await apiClient.post(`/financial/expenses/${id}/approve`, { notes });
    return response.data;
  },

  async reject(id: string, reason: string) {
    const response = await apiClient.post(`/financial/expenses/${id}/reject`, { reason });
    return response.data;
  },

  async getAnalytics(params?: { timeframe?: string; projectId?: string }) {
    const response = await apiClient.get('/financial/analytics/expenses', { params });
    return response.data;
  }
};

// ==================== BUDGET API ====================

export const budgetAPI = {
  async getAll(params?: { 
    projectId?: string; 
    page?: number; 
    limit?: number; 
  }) {
    const response = await apiClient.get('/financial/budgets', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/financial/budgets/${id}`);
    return response.data;
  },

  async getByProject(projectId: string) {
    const response = await apiClient.get('/financial/budgets', { 
      params: { projectId, limit: 1 } 
    });
    return response.data.budgets?.[0] || null;
  },

  async create(budget: Omit<FinancialBudget, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await apiClient.post('/financial/budgets', budget);
    return response.data;
  },

  async update(id: string, updates: Partial<FinancialBudget>) {
    const response = await apiClient.put(`/financial/budgets/${id}`, updates);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/financial/budgets/${id}`);
    return response.data;
  },

  async getAnalytics(params?: { timeframe?: string; projectId?: string }) {
    const response = await apiClient.get('/financial/analytics/budgets', { params });
    return response.data;
  }
};

// ==================== FINANCIAL ANALYTICS API ====================

export const financialAnalyticsAPI = {
  async getDashboard(params?: { timeframe?: string; projectId?: string }) {
    const response = await apiClient.get('/financial/dashboard', { params });
    return response.data as FinancialAnalytics;
  },

  async getKPIs(params?: { timeframe?: string; projectId?: string }) {
    const response = await apiClient.get('/financial/kpis', { params });
    return response.data as FinancialKPIs;
  },

  async getRevenueTrends(params?: { 
    timeframe?: '7d' | '30d' | '90d' | '1y';
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const response = await apiClient.get('/financial/analytics/revenue-trends', { params });
    return response.data;
  },

  async getExpenseTrends(params?: { 
    timeframe?: '7d' | '30d' | '90d' | '1y';
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const response = await apiClient.get('/financial/analytics/expense-trends', { params });
    return response.data;
  },

  async getCashFlowForecast(params?: { months?: number }) {
    const response = await apiClient.get('/financial/analytics/cash-flow-forecast', { params });
    return response.data;
  },

  async getProfitLossStatement(params?: { 
    startDate: string; 
    endDate: string;
    projectId?: string;
  }) {
    const response = await apiClient.get('/financial/analytics/profit-loss', { params });
    return response.data;
  }
};

// ==================== COMBINED FINANCIAL API ====================

export const financialAPI = {
  invoices: invoiceAPI,
  expenses: expenseAPI,
  budgets: budgetAPI,
  analytics: financialAnalyticsAPI,

  // Convenience methods for common operations
  async getProjectFinancials(projectId: string) {
    const [invoices, expenses, budget] = await Promise.all([
      invoiceAPI.getAll({ projectId }),
      expenseAPI.getAll({ projectId }),
      budgetAPI.getByProject(projectId)
    ]);

    return {
      invoices: invoices.invoices || [],
      expenses: expenses.expenses || [],
      budget
    };
  },

  async getOverdueInvoices() {
    const response = await invoiceAPI.getAll({ status: 'overdue' });
    return response.invoices || [];
  },

  async getPendingExpenses() {
    const response = await expenseAPI.getAll({ status: 'pending' });
    return response.expenses || [];
  },

  async getFinancialSummary(projectId?: string) {
    const analytics = await financialAnalyticsAPI.getDashboard({ projectId });
    const kpis = await financialAnalyticsAPI.getKPIs({ projectId });
    
    return {
      analytics,
      kpis
    };
  }
};

export default financialAPI;