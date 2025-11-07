import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * List budgets for organization with filtering and pagination
 */
export const listBudgets = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      page = 1,
      limit = 20,
      projectId,
      category,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { organizationId }

    // Apply filters
    if (projectId) where.projectId = projectId
    if (category) where.category = category
    if (status) where.status = status

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } }
      ]
    }

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { [String(sortBy)]: sortOrder }
      }),
      prisma.budget.count({ where })
    ])

    // Calculate usage for each budget
    const budgetsWithUsage = await Promise.all(
      budgets.map(async (budget) => {
        const actualSpent = await calculateActualSpent(budget.id, budget.projectId)
        const utilizationPercentage = budget.totalAmount > 0 ? (actualSpent / budget.totalAmount) * 100 : 0
        
        return {
          ...budget,
          actualSpent,
          remainingAmount: budget.totalAmount - actualSpent,
          utilizationPercentage,
          isOverBudget: actualSpent > budget.totalAmount
        }
      })
    )

    res.json({
      budgets: budgetsWithUsage,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('List budgets error:', error)
    res.status(500).json({ error: 'Failed to list budgets' })
  }
}

/**
 * Create new budget
 */
export const createBudget = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('budgets.create')) {
      return res.status(403).json({ error: 'No permission to create budgets' })
    }

    const {
      name,
      description,
      projectId,
      category,
      totalAmount,
      currency = 'MYR',
      startDate,
      endDate,
      items = [],
      notes
    } = req.body

    // Validate budget items total
    const itemsTotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0)
    if (Math.abs(itemsTotal - parseFloat(totalAmount)) > 0.01) {
      return res.status(400).json({ 
        error: 'Budget items total does not match total amount',
        itemsTotal,
        totalAmount: parseFloat(totalAmount)
      })
    }

    const budget = await prisma.$transaction(async (tx) => {
      // Create budget
      const newBudget = await tx.budget.create({
        data: {
          organizationId,
          name,
          description,
          projectId,
          category,
          totalAmount: parseFloat(totalAmount),
          currency,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          notes,
          status: 'DRAFT',
          createdById: req.user!.id
        }
      })

      // Create budget items
      if (items.length > 0) {
        await tx.budgetItem.createMany({
          data: items.map((item: any) => ({
            budgetId: newBudget.id,
            name: item.name,
            description: item.description,
            category: item.category,
            quantity: parseFloat(item.quantity || 1),
            unitPrice: parseFloat(item.unitPrice),
            amount: parseFloat(item.amount),
            notes: item.notes
          }))
        })
      }

      return newBudget
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'create',
        resource: 'budget',
        resourceId: budget.id,
        newValues: { name, totalAmount, projectId }
      }
    })

    // Fetch complete budget with relations
    const completeBudget = await prisma.budget.findUnique({
      where: { id: budget.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        items: true
      }
    })

    res.status(201).json(completeBudget)
  } catch (error) {
    console.error('Create budget error:', error)
    res.status(500).json({ error: 'Failed to create budget' })
  }
}

/**
 * Get budget details
 */
export const getBudget = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const budget = await prisma.budget.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
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
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        items: {
          orderBy: { category: 'asc' }
        }
      }
    })

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' })
    }

    // Calculate actual spending
    const actualSpent = await calculateActualSpent(budget.id, budget.projectId)
    const itemSpending = await calculateItemSpending(budget.items)

    const enrichedBudget = {
      ...budget,
      actualSpent,
      remainingAmount: budget.totalAmount - actualSpent,
      utilizationPercentage: budget.totalAmount > 0 ? (actualSpent / budget.totalAmount) * 100 : 0,
      isOverBudget: actualSpent > budget.totalAmount,
      items: budget.items.map(item => ({
        ...item,
        actualSpent: itemSpending[item.id] || 0,
        remainingAmount: item.amount - (itemSpending[item.id] || 0),
        utilizationPercentage: item.amount > 0 ? ((itemSpending[item.id] || 0) / item.amount) * 100 : 0
      }))
    }

    res.json(enrichedBudget)
  } catch (error) {
    console.error('Get budget error:', error)
    res.status(500).json({ error: 'Failed to get budget' })
  }
}

/**
 * Update budget
 */
export const updateBudget = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if budget exists
    const existingBudget = await prisma.budget.findFirst({
      where: { id, organizationId },
      include: { items: true }
    })

    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('budgets.update')) {
      return res.status(403).json({ error: 'No permission to update budgets' })
    }

    // Don't allow editing approved budgets
    if (existingBudget.status === 'APPROVED') {
      return res.status(400).json({ error: 'Cannot edit approved budgets' })
    }

    const {
      name,
      description,
      projectId,
      category,
      totalAmount,
      currency,
      startDate,
      endDate,
      status,
      notes,
      items = []
    } = req.body

    // Validate budget items total if provided
    if (items.length > 0 && totalAmount) {
      const itemsTotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0)
      if (Math.abs(itemsTotal - parseFloat(totalAmount)) > 0.01) {
        return res.status(400).json({ 
          error: 'Budget items total does not match total amount' 
        })
      }
    }

    const updatedBudget = await prisma.$transaction(async (tx) => {
      // Update budget
      const updateData: any = {}
      
      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (projectId !== undefined) updateData.projectId = projectId
      if (category !== undefined) updateData.category = category
      if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount)
      if (currency !== undefined) updateData.currency = currency
      if (startDate !== undefined) updateData.startDate = new Date(startDate)
      if (endDate !== undefined) updateData.endDate = new Date(endDate)
      if (status !== undefined) updateData.status = status
      if (notes !== undefined) updateData.notes = notes

      const budget = await tx.budget.update({
        where: { id },
        data: updateData
      })

      // Update budget items if provided
      if (items.length > 0) {
        // Delete existing items
        await tx.budgetItem.deleteMany({
          where: { budgetId: id }
        })

        // Create new items
        await tx.budgetItem.createMany({
          data: items.map((item: any) => ({
            budgetId: id,
            name: item.name,
            description: item.description,
            category: item.category,
            quantity: parseFloat(item.quantity || 1),
            unitPrice: parseFloat(item.unitPrice),
            amount: parseFloat(item.amount),
            notes: item.notes
          }))
        })
      }

      return budget
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'update',
        resource: 'budget',
        resourceId: id,
        oldValues: { name: existingBudget.name, totalAmount: existingBudget.totalAmount },
        newValues: { name, totalAmount }
      }
    })

    // Fetch complete updated budget
    const completeBudget = await prisma.budget.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        items: true
      }
    })

    res.json(completeBudget)
  } catch (error) {
    console.error('Update budget error:', error)
    res.status(500).json({ error: 'Failed to update budget' })
  }
}

/**
 * Delete budget
 */
export const deleteBudget = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const budget = await prisma.budget.findFirst({
      where: { id, organizationId }
    })

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('budgets.delete')) {
      return res.status(403).json({ error: 'No permission to delete budgets' })
    }

    // Don't allow deleting approved budgets
    if (budget.status === 'APPROVED') {
      return res.status(400).json({ error: 'Cannot delete approved budgets' })
    }

    await prisma.budget.delete({
      where: { id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'delete',
        resource: 'budget',
        resourceId: id,
        oldValues: { name: budget.name, totalAmount: budget.totalAmount }
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete budget error:', error)
    res.status(500).json({ error: 'Failed to delete budget' })
  }
}

/**
 * Get budget analytics
 */
export const getBudgetAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      projectId,
      startDate,
      endDate
    } = req.query

    const where: any = { organizationId }

    if (projectId) {
      where.projectId = String(projectId)
    }

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate))
      }
    }

    const [
      totalBudgets,
      approvedBudgets,
      draftBudgets,
      totalBudgetAmount,
      budgetsByCategory,
      budgetsByProject
    ] = await Promise.all([
      prisma.budget.count({ where }),
      prisma.budget.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.budget.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.budget.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      prisma.budget.groupBy({
        by: ['category'],
        where,
        _sum: { totalAmount: true },
        _count: true
      }),
      prisma.budget.groupBy({
        by: ['projectId'],
        where: { ...where, projectId: { not: null } },
        _sum: { totalAmount: true },
        _count: true
      })
    ])

    // Calculate actual spending for all budgets
    const allBudgets = await prisma.budget.findMany({
      where,
      select: { id: true, totalAmount: true, projectId: true }
    })

    let totalActualSpent = 0
    const budgetUtilization = []

    for (const budget of allBudgets) {
      const actualSpent = await calculateActualSpent(budget.id, budget.projectId)
      totalActualSpent += actualSpent
      budgetUtilization.push({
        budgetId: budget.id,
        budgetAmount: budget.totalAmount,
        actualSpent,
        utilizationPercentage: budget.totalAmount > 0 ? (actualSpent / budget.totalAmount) * 100 : 0
      })
    }

    const analytics = {
      summary: {
        totalBudgets,
        approvedBudgets,
        draftBudgets,
        totalBudgetAmount: totalBudgetAmount._sum.totalAmount || 0,
        totalActualSpent,
        overallUtilization: totalBudgetAmount._sum.totalAmount ? 
          (totalActualSpent / (totalBudgetAmount._sum.totalAmount || 1)) * 100 : 0
      },
      byCategory: budgetsByCategory.map(item => ({
        category: item.category,
        amount: item._sum.totalAmount || 0,
        count: item._count
      })),
      byProject: await enrichProjectBudgetData(budgetsByProject),
      utilization: budgetUtilization
    }

    res.json(analytics)
  } catch (error) {
    console.error('Get budget analytics error:', error)
    res.status(500).json({ error: 'Failed to get budget analytics' })
  }
}

/**
 * Calculate actual spending for a budget
 */
async function calculateActualSpent(budgetId: string, projectId: string | null): Promise<number> {
  if (!projectId) return 0

  // Sum approved expenses for the project
  const expenseSum = await prisma.expense.aggregate({
    where: {
      projectId,
      status: 'APPROVED'
    },
    _sum: { amount: true }
  })

  // Could also include invoice costs here if needed
  // const invoiceSum = await prisma.invoice.aggregate({
  //   where: { projectId, status: 'PAID' },
  //   _sum: { total: true }
  // })

  return expenseSum._sum.amount || 0
}

/**
 * Calculate spending for each budget item
 */
async function calculateItemSpending(items: any[]): Promise<{ [itemId: string]: number }> {
  // This is a simplified implementation
  // In a real system, you'd want to track expenses against specific budget items
  const itemSpending: { [itemId: string]: number } = {}
  
  for (const item of items) {
    // For now, return 0 for each item
    // You could implement logic to match expenses to budget items by category or other criteria
    itemSpending[item.id] = 0
  }
  
  return itemSpending
}

/**
 * Enrich project budget data with project names
 */
async function enrichProjectBudgetData(projectBudgets: any[]) {
  const projectIds = projectBudgets.map(item => item.projectId).filter(Boolean)
  
  if (projectIds.length === 0) return []

  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true, code: true }
  })

  const projectMap = new Map(projects.map(p => [p.id, p]))

  return projectBudgets.map(item => ({
    project: projectMap.get(item.projectId),
    amount: item._sum.totalAmount || 0,
    count: item._count
  }))
}