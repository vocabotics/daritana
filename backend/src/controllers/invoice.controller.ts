import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * List invoices for organization with filtering and pagination
 */
export const listInvoices = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      page = 1,
      limit = 20,
      status,
      clientId,
      projectId,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { organizationId }

    // Apply filters
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (projectId) where.projectId = projectId

    if (startDate && endDate) {
      where.issueDate = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate))
      }
    }

    if (search) {
      where.OR = [
        { number: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } }
      ]
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: {
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
          },
          transactions: {
            where: { type: 'PAYMENT' },
            select: {
              amount: true,
              status: true,
              createdAt: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { [String(sortBy)]: sortOrder }
      }),
      prisma.invoice.count({ where })
    ])

    // Calculate payment status for each invoice
    const invoicesWithPaymentStatus = invoices.map(invoice => {
      const totalPaid = invoice.transactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0)
      
      return {
        ...invoice,
        totalPaid,
        remainingAmount: invoice.total - totalPaid,
        isFullyPaid: totalPaid >= invoice.total
      }
    })

    res.json({
      invoices: invoicesWithPaymentStatus,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('List invoices error:', error)
    res.status(500).json({ error: 'Failed to list invoices' })
  }
}

/**
 * Create new invoice
 */
export const createInvoice = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check permissions - allow if user has any financial permissions or is admin
    const hasPermission = req.user?.permissions?.some(p => 
      p.includes('invoices') || 
      p.includes('financial') || 
      p === 'ALL' ||
      p === 'admin'
    ) || req.user?.role === 'ADMIN' || req.user?.role === 'OWNER'
    
    if (!hasPermission && req.user?.permissions?.length > 0) {
      return res.status(403).json({ error: 'No permission to create invoices' })
    }

    const {
      clientId,
      projectId,
      description,
      subtotal,
      taxRate = 0.06, // 6% GST default for Malaysia
      currency = 'MYR',
      dueDate,
      terms,
      notes,
      items = []
    } = req.body

    // Validate and parse dates
    let parsedDueDate: Date
    if (dueDate) {
      parsedDueDate = new Date(dueDate)
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ error: 'Invalid due date format' })
      }
    } else {
      // Default to 30 days from now if not provided
      parsedDueDate = new Date()
      parsedDueDate.setDate(parsedDueDate.getDate() + 30)
    }

    // Calculate tax and total
    const taxAmount = subtotal * taxRate
    const total = subtotal + taxAmount

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(organizationId)

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        number: invoiceNumber,
        clientId,
        projectId,
        description,
        subtotal: parseFloat(subtotal),
        taxRate: parseFloat(taxRate),
        taxAmount,
        total,
        currency,
        status: 'DRAFT',
        dueDate: parsedDueDate,
        terms,
        notes
      },
      include: {
        client: {
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
        resource: 'invoice',
        resourceId: invoice.id,
        newValues: { number: invoiceNumber, clientId, total }
      }
    })

    res.status(201).json(invoice)
  } catch (error) {
    console.error('Create invoice error:', error)
    res.status(500).json({ error: 'Failed to create invoice' })
  }
}

/**
 * Get invoice details
 */
export const getInvoice = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            siteAddress: true
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    // Calculate payment status
    const totalPaid = invoice.transactions
      .filter(t => t.status === 'COMPLETED' && t.type === 'PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0)

    const enrichedInvoice = {
      ...invoice,
      totalPaid,
      remainingAmount: invoice.total - totalPaid,
      isFullyPaid: totalPaid >= invoice.total,
      isOverdue: new Date() > invoice.dueDate && invoice.status !== 'PAID'
    }

    res.json(enrichedInvoice)
  } catch (error) {
    console.error('Get invoice error:', error)
    res.status(500).json({ error: 'Failed to get invoice' })
  }
}

/**
 * Update invoice
 */
export const updateInvoice = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, organizationId }
    })

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('invoices.update')) {
      return res.status(403).json({ error: 'No permission to update invoices' })
    }

    // Don't allow editing paid invoices
    if (existingInvoice.status === 'PAID') {
      return res.status(400).json({ error: 'Cannot edit paid invoices' })
    }

    const {
      clientId,
      projectId,
      description,
      subtotal,
      taxRate,
      currency,
      status,
      dueDate,
      terms,
      notes
    } = req.body

    const updateData: any = {}
    
    if (clientId !== undefined) updateData.clientId = clientId
    if (projectId !== undefined) updateData.projectId = projectId
    if (description !== undefined) updateData.description = description
    if (currency !== undefined) updateData.currency = currency
    if (status !== undefined) updateData.status = status
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (terms !== undefined) updateData.terms = terms
    if (notes !== undefined) updateData.notes = notes

    // Recalculate if financial values changed
    if (subtotal !== undefined || taxRate !== undefined) {
      const newSubtotal = subtotal !== undefined ? parseFloat(subtotal) : existingInvoice.subtotal
      const newTaxRate = taxRate !== undefined ? parseFloat(taxRate) : existingInvoice.taxRate
      const newTaxAmount = newSubtotal * newTaxRate
      const newTotal = newSubtotal + newTaxAmount

      updateData.subtotal = newSubtotal
      updateData.taxRate = newTaxRate
      updateData.taxAmount = newTaxAmount
      updateData.total = newTotal
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: {
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
        resource: 'invoice',
        resourceId: id,
        oldValues: { status: existingInvoice.status, total: existingInvoice.total },
        newValues: updateData
      }
    })

    res.json(updatedInvoice)
  } catch (error) {
    console.error('Update invoice error:', error)
    res.status(500).json({ error: 'Failed to update invoice' })
  }
}

/**
 * Delete invoice
 */
export const deleteInvoice = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if invoice exists
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId }
    })

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('invoices.delete')) {
      return res.status(403).json({ error: 'No permission to delete invoices' })
    }

    // Don't allow deleting paid invoices
    if (invoice.status === 'PAID' || invoice.status === 'PARTIAL') {
      return res.status(400).json({ error: 'Cannot delete invoices with payments' })
    }

    await prisma.invoice.delete({
      where: { id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'delete',
        resource: 'invoice',
        resourceId: id,
        oldValues: { number: invoice.number, total: invoice.total }
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete invoice error:', error)
    res.status(500).json({ error: 'Failed to delete invoice' })
  }
}

/**
 * Send invoice to client
 */
export const sendInvoice = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        project: true
      }
    })

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    if (invoice.status === 'DRAFT') {
      await prisma.invoice.update({
        where: { id },
        data: { 
          status: 'SENT',
          issueDate: new Date()
        }
      })
    }

    // TODO: Implement email sending logic here
    // For now, just update status and return success

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'send',
        resource: 'invoice',
        resourceId: id,
        newValues: { sentAt: new Date() }
      }
    })

    res.json({ success: true, message: 'Invoice sent successfully' })
  } catch (error) {
    console.error('Send invoice error:', error)
    res.status(500).json({ error: 'Failed to send invoice' })
  }
}

/**
 * Get financial analytics for organization
 */
export const getFinancialAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      startDate,
      endDate,
      period = 'month' // week, month, quarter, year
    } = req.query

    const dateFilter = startDate && endDate ? {
      issueDate: {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate))
      }
    } : {}

    // Get summary statistics
    const [
      totalInvoices,
      totalRevenue,
      paidInvoices,
      overdueInvoices,
      draftInvoices,
      recentTransactions
    ] = await Promise.all([
      prisma.invoice.count({
        where: { organizationId, ...dateFilter }
      }),
      prisma.invoice.aggregate({
        where: { organizationId, ...dateFilter },
        _sum: { total: true }
      }),
      prisma.invoice.count({
        where: { organizationId, status: 'PAID', ...dateFilter }
      }),
      prisma.invoice.count({
        where: { 
          organizationId, 
          status: { in: ['SENT', 'VIEWED', 'PARTIAL'] },
          dueDate: { lt: new Date() },
          ...dateFilter
        }
      }),
      prisma.invoice.count({
        where: { organizationId, status: 'DRAFT', ...dateFilter }
      }),
      prisma.transaction.findMany({
        where: {
          invoice: { organizationId },
          status: 'COMPLETED',
          type: 'PAYMENT'
        },
        include: {
          invoice: {
            select: {
              number: true,
              client: {
                select: { name: true, firstName: true, lastName: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    // Get revenue trend data
    const revenueTrend = await getRevenueTrend(organizationId, period as string, dateFilter)

    const analytics = {
      summary: {
        totalInvoices,
        totalRevenue: totalRevenue._sum.total || 0,
        paidInvoices,
        overdueInvoices,
        draftInvoices,
        paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0
      },
      revenueTrend,
      recentTransactions
    }

    res.json(analytics)
  } catch (error) {
    console.error('Get financial analytics error:', error)
    res.status(500).json({ error: 'Failed to get financial analytics' })
  }
}

/**
 * Generate unique invoice number
 */
async function generateInvoiceNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
  const base = `INV-${year}${month}-`
  
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      organizationId,
      number: { startsWith: base }
    },
    orderBy: { number: 'desc' }
  })

  let nextNumber = 1
  if (lastInvoice?.number) {
    const lastNumber = parseInt(lastInvoice.number.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `${base}${nextNumber.toString().padStart(4, '0')}`
}

/**
 * Get revenue trend data
 */
async function getRevenueTrend(organizationId: string, period: string, dateFilter: any) {
  // This is a simplified implementation
  // In a real system, you'd want more sophisticated time series analysis
  
  const invoices = await prisma.invoice.findMany({
    where: { 
      organizationId, 
      status: { in: ['PAID', 'PARTIAL'] },
      ...dateFilter
    },
    select: {
      total: true,
      paidDate: true,
      issueDate: true
    }
  })

  // Group by period and calculate totals
  const trendData: { [key: string]: number } = {}
  
  invoices.forEach(invoice => {
    const date = invoice.paidDate || invoice.issueDate
    let key: string
    
    switch (period) {
      case 'week':
        key = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`
        break
      case 'quarter':
        key = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`
        break
      case 'year':
        key = date.getFullYear().toString()
        break
      default: // month
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
    }
    
    trendData[key] = (trendData[key] || 0) + invoice.total
  })

  return Object.entries(trendData).map(([period, revenue]) => ({
    period,
    revenue
  }))
}