import { Router } from 'express'
import { authenticateMultiTenant } from '../middleware/multi-tenant-auth'

// Invoice controllers
import {
  listInvoices,
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  getFinancialAnalytics as getInvoiceAnalytics
} from '../controllers/invoice.controller'

// Expense controllers
import {
  listExpenses,
  createExpense,
  getExpense,
  updateExpense,
  approveExpense,
  rejectExpense,
  deleteExpense,
  getExpenseAnalytics
} from '../controllers/expense.controller'

// Budget controllers
import {
  listBudgets,
  createBudget,
  getBudget,
  updateBudget,
  deleteBudget,
  getBudgetAnalytics
} from '../controllers/budget.controller'

// Financial analytics controllers
import {
  getFinancialDashboard,
  getFinancialKPIs
} from '../controllers/financial-analytics.controller'

const router = Router()

// Apply multi-tenant authentication to all routes
router.use(authenticateMultiTenant)

// ==================== INVOICE ROUTES ====================

// List and create invoices
router.get('/invoices', listInvoices)
router.post('/invoices', createInvoice)

// Individual invoice operations
router.get('/invoices/:id', getInvoice)
router.put('/invoices/:id', updateInvoice)
router.delete('/invoices/:id', deleteInvoice)

// Invoice actions
router.post('/invoices/:id/send', sendInvoice)

// Invoice analytics
router.get('/analytics/invoices', getInvoiceAnalytics)

// ==================== EXPENSE ROUTES ====================

// List and create expenses
router.get('/expenses', listExpenses)
router.post('/expenses', createExpense)

// Individual expense operations
router.get('/expenses/:id', getExpense)
router.put('/expenses/:id', updateExpense)
router.delete('/expenses/:id', deleteExpense)

// Expense approval workflow
router.post('/expenses/:id/approve', approveExpense)
router.post('/expenses/:id/reject', rejectExpense)

// Expense analytics
router.get('/analytics/expenses', getExpenseAnalytics)

// ==================== BUDGET ROUTES ====================

// List and create budgets
router.get('/budgets', listBudgets)
router.post('/budgets', createBudget)

// Individual budget operations
router.get('/budgets/:id', getBudget)
router.put('/budgets/:id', updateBudget)
router.delete('/budgets/:id', deleteBudget)

// Budget analytics
router.get('/analytics/budgets', getBudgetAnalytics)

// ==================== FINANCIAL ANALYTICS ROUTES ====================

// Main financial dashboard
router.get('/dashboard', getFinancialDashboard)

// Financial KPIs and metrics
router.get('/kpis', getFinancialKPIs)

export default router