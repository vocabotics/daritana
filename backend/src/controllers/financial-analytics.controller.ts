import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * Get comprehensive financial analytics for organization
 */
export const getFinancialDashboard = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      startDate,
      endDate,
      projectId
    } = req.query

    // Build base filters
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate))
      }
    } : {}

    const projectFilter = projectId ? { projectId: String(projectId) } : {}

    // Get all financial data in parallel
    const [
      revenueAnalytics,
      expenseAnalytics,
      budgetAnalytics,
      cashFlowData,
      profitabilityData,
      projectFinancials
    ] = await Promise.all([
      getRevenueAnalytics(organizationId, dateFilter, projectFilter),
      getExpenseAnalytics(organizationId, dateFilter, projectFilter),
      getBudgetAnalytics(organizationId, dateFilter, projectFilter),
      getCashFlowData(organizationId, dateFilter),
      getProfitabilityData(organizationId, dateFilter, projectFilter),
      getProjectFinancials(organizationId, projectFilter)
    ])

    const dashboard = {
      summary: {
        totalRevenue: revenueAnalytics.totalRevenue,
        totalExpenses: expenseAnalytics.totalExpenses,
        grossProfit: revenueAnalytics.totalRevenue - expenseAnalytics.totalExpenses,
        profitMargin: revenueAnalytics.totalRevenue > 0 ? 
          ((revenueAnalytics.totalRevenue - expenseAnalytics.totalExpenses) / revenueAnalytics.totalRevenue) * 100 : 0,
        totalBudgeted: budgetAnalytics.totalBudgetAmount,
        budgetUtilization: budgetAnalytics.overallUtilization,
        outstandingInvoices: revenueAnalytics.outstandingAmount,
        overdueInvoices: revenueAnalytics.overdueAmount
      },
      revenue: revenueAnalytics,
      expenses: expenseAnalytics,
      budgets: budgetAnalytics,
      cashFlow: cashFlowData,
      profitability: profitabilityData,
      projects: projectFinancials
    }

    res.json(dashboard)
  } catch (error) {
    console.error('Get financial dashboard error:', error)
    res.status(500).json({ error: 'Failed to get financial dashboard' })
  }
}

/**
 * Get revenue analytics
 */
async function getRevenueAnalytics(organizationId: string, dateFilter: any, projectFilter: any) {
  const invoiceWhere = { organizationId, ...dateFilter, ...projectFilter }

  const [
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
    totalRevenue,
    paidRevenue,
    outstandingAmount,
    overdueAmount,
    monthlyRevenue
  ] = await Promise.all([
    prisma.invoice.count({ where: invoiceWhere }),
    prisma.invoice.count({ where: { ...invoiceWhere, status: 'PAID' } }),
    prisma.invoice.count({ where: { ...invoiceWhere, status: { in: ['SENT', 'VIEWED'] } } }),
    prisma.invoice.count({ 
      where: { 
        ...invoiceWhere, 
        status: { in: ['SENT', 'VIEWED', 'PARTIAL'] },
        dueDate: { lt: new Date() }
      } 
    }),
    prisma.invoice.aggregate({
      where: invoiceWhere,
      _sum: { total: true }
    }),
    prisma.invoice.aggregate({
      where: { ...invoiceWhere, status: 'PAID' },
      _sum: { total: true }
    }),
    prisma.invoice.aggregate({
      where: { ...invoiceWhere, status: { in: ['SENT', 'VIEWED', 'PARTIAL'] } },
      _sum: { total: true }
    }),
    prisma.invoice.aggregate({
      where: { 
        ...invoiceWhere, 
        status: { in: ['SENT', 'VIEWED', 'PARTIAL'] },
        dueDate: { lt: new Date() }
      },
      _sum: { total: true }
    }),
    getMonthlyRevenueTrend(organizationId, invoiceWhere)
  ])

  return {
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
    totalRevenue: totalRevenue._sum.total || 0,
    paidRevenue: paidRevenue._sum.total || 0,
    outstandingAmount: outstandingAmount._sum.total || 0,
    overdueAmount: overdueAmount._sum.total || 0,
    paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
    monthlyTrend: monthlyRevenue
  }
}

/**
 * Get expense analytics
 */
async function getExpenseAnalytics(organizationId: string, dateFilter: any, projectFilter: any) {
  const expenseWhere = { organizationId, ...dateFilter, ...projectFilter }

  const [
    totalExpenses,
    approvedExpenses,
    pendingExpenses,
    totalAmount,
    approvedAmount,
    expensesByCategory,
    monthlyExpenses
  ] = await Promise.all([
    prisma.expense.count({ where: expenseWhere }),
    prisma.expense.count({ where: { ...expenseWhere, status: 'APPROVED' } }),
    prisma.expense.count({ where: { ...expenseWhere, status: 'PENDING' } }),
    prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true }
    }),
    prisma.expense.aggregate({
      where: { ...expenseWhere, status: 'APPROVED' },
      _sum: { amount: true }
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: expenseWhere,
      _sum: { amount: true },
      _count: true
    }),
    getMonthlyExpenseTrend(organizationId, expenseWhere)
  ])

  return {
    totalExpenses,
    approvedExpenses,
    pendingExpenses,
    totalAmount: totalAmount._sum.amount || 0,
    approvedAmount: approvedAmount._sum.amount || 0,
    approvalRate: totalExpenses > 0 ? (approvedExpenses / totalExpenses) * 100 : 0,
    byCategory: expensesByCategory.map(item => ({
      category: item.category,
      amount: item._sum.amount || 0,
      count: item._count
    })),
    monthlyTrend: monthlyExpenses
  }
}

/**
 * Get budget analytics
 */
async function getBudgetAnalytics(organizationId: string, dateFilter: any, projectFilter: any) {
  const budgetWhere = { organizationId, ...dateFilter, ...projectFilter }

  const [
    totalBudgets,
    activeBudgets,
    totalBudgetAmount,
    budgetsByCategory
  ] = await Promise.all([
    prisma.budget.count({ where: budgetWhere }),
    prisma.budget.count({ where: { ...budgetWhere, status: 'ACTIVE' } }),
    prisma.budget.aggregate({
      where: budgetWhere,
      _sum: { totalAmount: true }
    }),
    prisma.budget.groupBy({
      by: ['category'],
      where: budgetWhere,
      _sum: { totalAmount: true },
      _count: true
    })
  ])

  // Calculate budget utilization (simplified)
  const totalBudgetAmountValue = totalBudgetAmount._sum.totalAmount || 0
  const totalExpenseAmount = await prisma.expense.aggregate({
    where: { organizationId, status: 'APPROVED', ...projectFilter },
    _sum: { amount: true }
  })

  const overallUtilization = totalBudgetAmountValue > 0 ? 
    ((totalExpenseAmount._sum.amount || 0) / totalBudgetAmountValue) * 100 : 0

  return {
    totalBudgets,
    activeBudgets,
    totalBudgetAmount: totalBudgetAmountValue,
    overallUtilization,
    byCategory: budgetsByCategory.map(item => ({
      category: item.category || 'Uncategorized',
      amount: item._sum.totalAmount || 0,
      count: item._count
    }))
  }
}

/**
 * Get cash flow data
 */
async function getCashFlowData(organizationId: string, dateFilter: any) {
  // Get monthly cash inflows (paid invoices) and outflows (approved expenses)
  const transactions = await prisma.transaction.findMany({
    where: {
      invoice: { organizationId },
      status: 'COMPLETED',
      type: 'PAYMENT',
      ...dateFilter
    },
    include: {
      invoice: {
        select: { total: true, issueDate: true }
      }
    }
  })

  const expenses = await prisma.expense.findMany({
    where: {
      organizationId,
      status: 'APPROVED',
      ...dateFilter
    },
    select: {
      amount: true,
      expenseDate: true
    }
  })

  // Group by month
  const cashFlowByMonth: { [key: string]: { inflow: number, outflow: number } } = {}

  transactions.forEach(transaction => {
    const date = transaction.createdAt
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
    
    if (!cashFlowByMonth[key]) {
      cashFlowByMonth[key] = { inflow: 0, outflow: 0 }
    }
    
    cashFlowByMonth[key].inflow += transaction.amount
  })

  expenses.forEach(expense => {
    const date = expense.expenseDate
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
    
    if (!cashFlowByMonth[key]) {
      cashFlowByMonth[key] = { inflow: 0, outflow: 0 }
    }
    
    cashFlowByMonth[key].outflow += expense.amount
  })

  return Object.entries(cashFlowByMonth).map(([month, data]) => ({
    month,
    inflow: data.inflow,
    outflow: data.outflow,
    netFlow: data.inflow - data.outflow
  }))
}

/**
 * Get profitability data
 */
async function getProfitabilityData(organizationId: string, dateFilter: any, projectFilter: any) {
  const [invoiceData, expenseData] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        organizationId,
        status: 'PAID',
        ...dateFilter,
        ...projectFilter
      },
      select: {
        total: true,
        paidDate: true,
        projectId: true,
        project: {
          select: { name: true, code: true }
        }
      }
    }),
    prisma.expense.findMany({
      where: {
        organizationId,
        status: 'APPROVED',
        ...dateFilter,
        ...projectFilter
      },
      select: {
        amount: true,
        expenseDate: true,
        projectId: true,
        project: {
          select: { name: true, code: true }
        }
      }
    })
  ])

  // Calculate profitability by project
  const projectProfitability: { [projectId: string]: any } = {}

  invoiceData.forEach(invoice => {
    if (invoice.projectId) {
      if (!projectProfitability[invoice.projectId]) {
        projectProfitability[invoice.projectId] = {
          project: invoice.project,
          revenue: 0,
          expenses: 0,
          profit: 0,
          margin: 0
        }
      }
      projectProfitability[invoice.projectId].revenue += invoice.total
    }
  })

  expenseData.forEach(expense => {
    if (expense.projectId && projectProfitability[expense.projectId]) {
      projectProfitability[expense.projectId].expenses += expense.amount
    }
  })

  // Calculate profit and margin for each project
  Object.values(projectProfitability).forEach((project: any) => {
    project.profit = project.revenue - project.expenses
    project.margin = project.revenue > 0 ? (project.profit / project.revenue) * 100 : 0
  })

  return Object.values(projectProfitability)
}

/**
 * Get project financials summary
 */
async function getProjectFinancials(organizationId: string, projectFilter: any) {
  const projects = await prisma.project.findMany({
    where: {
      organizationId,
      ...projectFilter
    },
    include: {
      invoices: {
        select: {
          total: true,
          status: true
        }
      },
      expenses: {
        where: { status: 'APPROVED' },
        select: {
          amount: true
        }
      },
      budgets: {
        select: {
          totalAmount: true,
          status: true
        }
      }
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  return projects.map(project => {
    const totalRevenue = project.invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + i.total, 0)
    
    const totalExpenses = project.expenses
      .reduce((sum, e) => sum + e.amount, 0)
    
    const totalBudget = project.budgets
      .filter(b => b.status === 'ACTIVE')
      .reduce((sum, b) => sum + b.totalAmount, 0)

    return {
      id: project.id,
      name: project.name,
      code: project.code,
      revenue: totalRevenue,
      expenses: totalExpenses,
      budget: totalBudget,
      profit: totalRevenue - totalExpenses,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      budgetUtilization: totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0
    }
  })
}

/**
 * Get monthly revenue trend
 */
async function getMonthlyRevenueTrend(organizationId: string, where: any) {
  const invoices = await prisma.invoice.findMany({
    where: { ...where, status: 'PAID' },
    select: {
      total: true,
      paidDate: true
    }
  })

  const trendData: { [key: string]: number } = {}
  
  invoices.forEach(invoice => {
    const date = invoice.paidDate || invoice.paidDate
    if (date) {
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      trendData[key] = (trendData[key] || 0) + invoice.total
    }
  })

  return Object.entries(trendData).map(([month, revenue]) => ({
    month,
    revenue
  }))
}

/**
 * Get monthly expense trend
 */
async function getMonthlyExpenseTrend(organizationId: string, where: any) {
  const expenses = await prisma.expense.findMany({
    where,
    select: {
      amount: true,
      expenseDate: true,
      status: true
    }
  })

  const trendData: { [key: string]: { approved: number, total: number } } = {}
  
  expenses.forEach(expense => {
    const key = `${expense.expenseDate.getFullYear()}-${(expense.expenseDate.getMonth() + 1).toString().padStart(2, '0')}`
    
    if (!trendData[key]) {
      trendData[key] = { approved: 0, total: 0 }
    }
    
    trendData[key].total += expense.amount
    if (expense.status === 'APPROVED') {
      trendData[key].approved += expense.amount
    }
  })

  return Object.entries(trendData).map(([month, data]) => ({
    month,
    ...data
  }))
}

/**
 * Get financial KPIs
 */
export const getFinancialKPIs = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      startDate,
      endDate,
      compareStartDate,
      compareEndDate
    } = req.query

    const currentPeriod = await getKPIsForPeriod(organizationId, startDate as string, endDate as string)
    const previousPeriod = compareStartDate && compareEndDate ? 
      await getKPIsForPeriod(organizationId, compareStartDate as string, compareEndDate as string) : null

    const kpis = {
      current: currentPeriod,
      previous: previousPeriod,
      changes: previousPeriod ? calculateKPIChanges(currentPeriod, previousPeriod) : null
    }

    res.json(kpis)
  } catch (error) {
    console.error('Get financial KPIs error:', error)
    res.status(500).json({ error: 'Failed to get financial KPIs' })
  }
}

/**
 * Get KPIs for a specific period
 */
async function getKPIsForPeriod(organizationId: string, startDate: string, endDate: string) {
  const dateFilter = {
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  const [
    totalRevenue,
    totalExpenses,
    invoiceCount,
    expenseCount,
    averageInvoiceValue,
    averageExpenseValue,
    paymentRate
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { organizationId, status: 'PAID', ...dateFilter },
      _sum: { total: true }
    }),
    prisma.expense.aggregate({
      where: { organizationId, status: 'APPROVED', ...dateFilter },
      _sum: { amount: true }
    }),
    prisma.invoice.count({
      where: { organizationId, ...dateFilter }
    }),
    prisma.expense.count({
      where: { organizationId, ...dateFilter }
    }),
    prisma.invoice.aggregate({
      where: { organizationId, ...dateFilter },
      _avg: { total: true }
    }),
    prisma.expense.aggregate({
      where: { organizationId, ...dateFilter },
      _avg: { amount: true }
    }),
    calculatePaymentRate(organizationId, dateFilter)
  ])

  const revenue = totalRevenue._sum.total || 0
  const expenses = totalExpenses._sum.amount || 0

  return {
    revenue,
    expenses,
    profit: revenue - expenses,
    profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
    invoiceCount,
    expenseCount,
    averageInvoiceValue: averageInvoiceValue._avg.total || 0,
    averageExpenseValue: averageExpenseValue._avg.amount || 0,
    paymentRate
  }
}

/**
 * Calculate payment rate
 */
async function calculatePaymentRate(organizationId: string, dateFilter: any) {
  const [totalInvoices, paidInvoices] = await Promise.all([
    prisma.invoice.count({
      where: { organizationId, ...dateFilter }
    }),
    prisma.invoice.count({
      where: { organizationId, status: 'PAID', ...dateFilter }
    })
  ])

  return totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0
}

/**
 * Calculate KPI changes between periods
 */
function calculateKPIChanges(current: any, previous: any) {
  const calculateChange = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0
    return ((currentValue - previousValue) / previousValue) * 100
  }

  return {
    revenue: calculateChange(current.revenue, previous.revenue),
    expenses: calculateChange(current.expenses, previous.expenses),
    profit: calculateChange(current.profit, previous.profit),
    profitMargin: current.profitMargin - previous.profitMargin,
    invoiceCount: calculateChange(current.invoiceCount, previous.invoiceCount),
    expenseCount: calculateChange(current.expenseCount, previous.expenseCount),
    averageInvoiceValue: calculateChange(current.averageInvoiceValue, previous.averageInvoiceValue),
    averageExpenseValue: calculateChange(current.averageExpenseValue, previous.averageExpenseValue),
    paymentRate: current.paymentRate - previous.paymentRate
  }
}