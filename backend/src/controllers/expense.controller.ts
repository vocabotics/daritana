import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * List expenses for organization with filtering and pagination
 */
export const listExpenses = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      page = 1,
      limit = 20,
      category,
      projectId,
      submittedById,
      status = 'ALL',
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { organizationId }

    // Apply filters
    if (category) where.category = category
    if (projectId) where.projectId = projectId
    if (submittedById) where.submittedById = submittedById
    if (status !== 'ALL') where.status = status

    if (startDate && endDate) {
      where.expenseDate = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate))
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: String(search), mode: 'insensitive' } },
        { vendor: { contains: String(search), mode: 'insensitive' } },
        { receiptNumber: { contains: String(search), mode: 'insensitive' } }
      ]
    }

    // Role-based filtering
    if (req.user?.organizationRole !== 'ORG_ADMIN' && 
        req.user?.organizationRole !== 'PROJECT_LEAD') {
      // Regular users can only see their own expenses
      where.submittedById = req.user?.id
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          submittedBy: {
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { [String(sortBy)]: sortOrder }
      }),
      prisma.expense.count({ where })
    ])

    res.json({
      expenses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('List expenses error:', error)
    res.status(500).json({ error: 'Failed to list expenses' })
  }
}

/**
 * Create new expense
 */
export const createExpense = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('expenses.create')) {
      return res.status(403).json({ error: 'No permission to create expenses' })
    }

    const {
      description,
      category,
      amount,
      currency = 'MYR',
      expenseDate,
      vendor,
      receiptNumber,
      receiptUrl,
      projectId,
      taxAmount = 0,
      notes,
      paymentMethod
    } = req.body

    const expense = await prisma.expense.create({
      data: {
        organizationId,
        description,
        category,
        amount: parseFloat(amount),
        currency,
        expenseDate: new Date(expenseDate),
        vendor,
        receiptNumber,
        receiptUrl,
        projectId,
        taxAmount: parseFloat(taxAmount),
        notes,
        paymentMethod,
        status: 'PENDING',
        submittedById: req.user!.id
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'create',
        resource: 'expense',
        resourceId: expense.id,
        newValues: { description, amount, category }
      }
    })

    res.status(201).json(expense)
  } catch (error) {
    console.error('Create expense error:', error)
    res.status(500).json({ error: 'Failed to create expense' })
  }
}

/**
 * Get expense details
 */
export const getExpense = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            client: {
              select: { name: true, firstName: true, lastName: true }
            }
          }
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    // Check access rights
    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     expense.submittedById === req.user?.id

    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this expense' })
    }

    res.json(expense)
  } catch (error) {
    console.error('Get expense error:', error)
    res.status(500).json({ error: 'Failed to get expense' })
  }
}

/**
 * Update expense
 */
export const updateExpense = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if expense exists
    const existingExpense = await prisma.expense.findFirst({
      where: { id, organizationId }
    })

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    // Check permissions - only submitter can edit pending expenses
    const canEdit = (existingExpense.submittedById === req.user?.id && existingExpense.status === 'PENDING') ||
                    req.user?.organizationRole === 'ORG_ADMIN'

    if (!canEdit) {
      return res.status(403).json({ error: 'No permission to edit this expense' })
    }

    const {
      description,
      category,
      amount,
      currency,
      expenseDate,
      vendor,
      receiptNumber,
      receiptUrl,
      projectId,
      taxAmount,
      notes,
      paymentMethod
    } = req.body

    const updateData: any = {}
    
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (currency !== undefined) updateData.currency = currency
    if (expenseDate !== undefined) updateData.expenseDate = new Date(expenseDate)
    if (vendor !== undefined) updateData.vendor = vendor
    if (receiptNumber !== undefined) updateData.receiptNumber = receiptNumber
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl
    if (projectId !== undefined) updateData.projectId = projectId
    if (taxAmount !== undefined) updateData.taxAmount = parseFloat(taxAmount)
    if (notes !== undefined) updateData.notes = notes
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        submittedBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'update',
        resource: 'expense',
        resourceId: id,
        oldValues: { amount: existingExpense.amount, status: existingExpense.status },
        newValues: updateData
      }
    })

    res.json(updatedExpense)
  } catch (error) {
    console.error('Update expense error:', error)
    res.status(500).json({ error: 'Failed to update expense' })
  }
}

/**
 * Approve expense
 */
export const approveExpense = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('expenses.approve')) {
      return res.status(403).json({ error: 'No permission to approve expenses' })
    }

    const expense = await prisma.expense.findFirst({
      where: { id, organizationId }
    })

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    if (expense.status !== 'PENDING') {
      return res.status(400).json({ error: 'Expense is not pending approval' })
    }

    const { notes } = req.body

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user!.id,
        approvedAt: new Date(),
        approvalNotes: notes
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'approve',
        resource: 'expense',
        resourceId: id,
        oldValues: { status: 'PENDING' },
        newValues: { status: 'APPROVED', approvedById: req.user!.id }
      }
    })

    // TODO: Send notification to submitter

    res.json(updatedExpense)
  } catch (error) {
    console.error('Approve expense error:', error)
    res.status(500).json({ error: 'Failed to approve expense' })
  }
}

/**
 * Reject expense
 */
export const rejectExpense = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('expenses.approve')) {
      return res.status(403).json({ error: 'No permission to reject expenses' })
    }

    const expense = await prisma.expense.findFirst({
      where: { id, organizationId }
    })

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    if (expense.status !== 'PENDING') {
      return res.status(400).json({ error: 'Expense is not pending approval' })
    }

    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' })
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById: req.user!.id,
        rejectedAt: new Date(),
        rejectionReason: reason
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'reject',
        resource: 'expense',
        resourceId: id,
        oldValues: { status: 'PENDING' },
        newValues: { status: 'REJECTED', rejectionReason: reason }
      }
    })

    // TODO: Send notification to submitter

    res.json(updatedExpense)
  } catch (error) {
    console.error('Reject expense error:', error)
    res.status(500).json({ error: 'Failed to reject expense' })
  }
}

/**
 * Delete expense
 */
export const deleteExpense = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const expense = await prisma.expense.findFirst({
      where: { id, organizationId }
    })

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    // Check permissions - only submitter can delete pending expenses
    const canDelete = (expense.submittedById === req.user?.id && expense.status === 'PENDING') ||
                     req.user?.organizationRole === 'ORG_ADMIN'

    if (!canDelete) {
      return res.status(403).json({ error: 'No permission to delete this expense' })
    }

    await prisma.expense.delete({
      where: { id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'delete',
        resource: 'expense',
        resourceId: id,
        oldValues: { description: expense.description, amount: expense.amount }
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete expense error:', error)
    res.status(500).json({ error: 'Failed to delete expense' })
  }
}

/**
 * Get expense analytics
 */
export const getExpenseAnalytics = async (req: MultiTenantRequest, res: Response) => {
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

    const where: any = { organizationId }

    if (startDate && endDate) {
      where.expenseDate = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate))
      }
    }

    if (projectId) {
      where.projectId = String(projectId)
    }

    const [
      totalExpenses,
      approvedExpenses,
      pendingExpenses,
      rejectedExpenses,
      totalAmount,
      approvedAmount,
      expensesByCategory,
      expensesByProject,
      monthlyTrend
    ] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.expense.count({ where: { ...where, status: 'PENDING' } }),
      prisma.expense.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: { ...where, status: 'APPROVED' },
        _sum: { amount: true }
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true
      }),
      prisma.expense.groupBy({
        by: ['projectId'],
        where: { ...where, projectId: { not: null } },
        _sum: { amount: true },
        _count: true
      }),
      getMonthlyExpenseTrend(organizationId, where)
    ])

    const analytics = {
      summary: {
        totalExpenses,
        approvedExpenses,
        pendingExpenses,
        rejectedExpenses,
        totalAmount: totalAmount._sum.amount || 0,
        approvedAmount: approvedAmount._sum.amount || 0,
        approvalRate: totalExpenses > 0 ? (approvedExpenses / totalExpenses) * 100 : 0
      },
      byCategory: expensesByCategory.map(item => ({
        category: item.category,
        amount: item._sum.amount || 0,
        count: item._count
      })),
      byProject: await enrichProjectData(expensesByProject),
      monthlyTrend
    }

    res.json(analytics)
  } catch (error) {
    console.error('Get expense analytics error:', error)
    res.status(500).json({ error: 'Failed to get expense analytics' })
  }
}

/**
 * Get monthly expense trend
 */
async function getMonthlyExpenseTrend(organizationId: string, baseWhere: any) {
  const expenses = await prisma.expense.findMany({
    where: baseWhere,
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
 * Enrich project data with project names
 */
async function enrichProjectData(projectExpenses: any[]) {
  const projectIds = projectExpenses.map(item => item.projectId).filter(Boolean)
  
  if (projectIds.length === 0) return []

  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true, code: true }
  })

  const projectMap = new Map(projects.map(p => [p.id, p]))

  return projectExpenses.map(item => ({
    project: projectMap.get(item.projectId),
    amount: item._sum.amount || 0,
    count: item._count
  }))
}