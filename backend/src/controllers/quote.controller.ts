import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createQuoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  projectId: z.string().uuid().optional(),
  validUntil: z.string().datetime().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    unit: z.string().optional(),
    specifications: z.record(z.any()).optional(),
    notes: z.string().optional(),
  })).min(1, 'At least one item is required'),
});

const updateQuoteSchema = createQuoteSchema.partial().extend({
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED']).optional(),
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

// Get all quotes for organization
export const getQuotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      projectId = '',
      userId = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
      dateFrom,
      dateTo,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      organizationId,
      ...(status && { status }),
      ...(projectId && { projectId }),
      ...(userId && { userId }),
      ...(search && {
        OR: [
          { quoteNumber: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(String(dateFrom)) }),
          ...(dateTo && { lte: new Date(String(dateTo)) }),
        },
      },
    };

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          [String(sortBy)]: sortOrder as 'asc' | 'desc',
        },
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      quotes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
};

// Get quote by ID
export const getQuoteById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const quote = await prisma.quote.findUnique({
      where: {
        id,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            clientId: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                unit: true,
                images: true,
                vendor: {
                  select: {
                    companyName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
};

// Create new quote
export const createQuote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;
    const validatedData = createQuoteSchema.parse(req.body);

    // Generate quote number
    const quoteCount = await prisma.quote.count();
    const quoteNumber = `QUO-${new Date().getFullYear()}-${String(quoteCount + 1).padStart(6, '0')}`;

    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = subtotal * 0.06; // 6% GST
    const totalAmount = subtotal + taxAmount;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        userId,
        organizationId,
        title: validatedData.title,
        description: validatedData.description,
        projectId: validatedData.projectId,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
        subtotal,
        taxAmount,
        totalAmount,
        terms: validatedData.terms,
        notes: validatedData.notes,
        items: {
          create: validatedData.items.map(item => ({
            productId: item.productId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            unit: item.unit,
            specifications: item.specifications,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'create',
        resource: 'quote',
        resourceId: quote.id,
        newValues: validatedData,
      },
    });

    res.status(201).json(quote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
};

// Update quote
export const updateQuote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const validatedData = updateQuoteSchema.parse(req.body);

    // Check if quote exists and belongs to organization
    const existingQuote = await prisma.quote.findUnique({
      where: { id, organizationId },
      include: { items: true },
    });

    if (!existingQuote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Prepare update data
    const updates: any = { ...validatedData };
    delete updates.items; // Handle items separately

    // Convert date strings
    if (validatedData.validUntil) {
      updates.validUntil = new Date(validatedData.validUntil);
    }

    // Handle items update if provided
    if (validatedData.items) {
      // Delete existing items
      await prisma.quoteItem.deleteMany({
        where: { quoteId: id },
      });

      // Calculate new totals
      const subtotal = validatedData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const taxAmount = subtotal * 0.06;
      const totalAmount = subtotal + taxAmount;

      updates.subtotal = subtotal;
      updates.taxAmount = taxAmount;
      updates.totalAmount = totalAmount;

      // Create new items
      updates.items = {
        create: validatedData.items.map(item => ({
          productId: item.productId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          unit: item.unit,
          specifications: item.specifications,
          notes: item.notes,
        })),
      };
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: updates,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'update',
        resource: 'quote',
        resourceId: id,
        oldValues: existingQuote,
        newValues: validatedData,
      },
    });

    res.json(quote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error updating quote:', error);
    res.status(500).json({ error: 'Failed to update quote' });
  }
};

// Send quote to client
export const sendQuote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const { message } = req.body;

    const quote = await prisma.quote.update({
      where: { id, organizationId },
      data: { status: 'SENT' },
      include: {
        user: { select: { name: true, email: true } },
        project: { select: { name: true } },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        organizationId,
        recipientId: quote.userId,
        title: `Quote ${quote.quoteNumber} Sent`,
        message: message || 'Your quote has been prepared and sent',
        type: 'INFO',
        resourceType: 'quote',
        resourceId: quote.id,
      },
    });

    res.json(quote);
  } catch (error) {
    console.error('Error sending quote:', error);
    res.status(500).json({ error: 'Failed to send quote' });
  }
};

// Accept quote (convert to order)
export const acceptQuote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const quote = await prisma.quote.findUnique({
      where: { id, organizationId },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: true,
              },
            },
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.status !== 'SENT' && quote.status !== 'VIEWED') {
      return res.status(400).json({ error: 'Quote cannot be accepted in current status' });
    }

    // Check if quote is expired
    if (quote.validUntil && new Date() > quote.validUntil) {
      await prisma.quote.update({
        where: { id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Quote has expired' });
    }

    // Group items by vendor for order creation
    const itemsByVendor = quote.items.reduce((acc, item) => {
      if (!item.product?.vendor) return acc;
      
      const vendorId = item.product.vendor.id;
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendor: item.product.vendor,
          items: [],
        };
      }
      acc[vendorId].items.push(item);
      return acc;
    }, {} as Record<string, any>);

    const orders = [];

    // Create orders for each vendor
    for (const [vendorId, vendorData] of Object.entries(itemsByVendor)) {
      const { vendor, items } = vendorData as any;
      
      const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      const taxAmount = subtotal * 0.06;
      const totalAmount = subtotal + taxAmount;

      const orderCount = await prisma.order.count();
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: quote.userId,
          organizationId,
          vendorId,
          projectId: quote.projectId,
          subtotal,
          taxAmount,
          totalAmount,
          notes: `Converted from quote ${quote.quoteNumber}`,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              specifications: item.specifications,
              notes: item.notes,
            })),
          },
        },
      });

      orders.push(order);
    }

    // Update quote status
    await prisma.quote.update({
      where: { id },
      data: { status: 'CONVERTED' },
    });

    res.json({
      message: 'Quote accepted and converted to orders',
      quote,
      orders,
    });
  } catch (error) {
    console.error('Error accepting quote:', error);
    res.status(500).json({ error: 'Failed to accept quote' });
  }
};

// Reject quote
export const rejectQuote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const { reason } = req.body;

    const quote = await prisma.quote.update({
      where: { id, organizationId },
      data: { 
        status: 'REJECTED',
        notes: reason ? `Rejected: ${reason}` : 'Quote rejected',
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        organizationId,
        recipientId: quote.userId,
        title: `Quote ${quote.quoteNumber} Rejected`,
        message: reason || 'Quote has been rejected',
        type: 'WARNING',
        resourceType: 'quote',
        resourceId: quote.id,
      },
    });

    res.json(quote);
  } catch (error) {
    console.error('Error rejecting quote:', error);
    res.status(500).json({ error: 'Failed to reject quote' });
  }
};

// Delete quote
export const deleteQuote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const quote = await prisma.quote.findUnique({
      where: { id, organizationId },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Only allow deletion of draft quotes
    if (quote.status !== 'DRAFT') {
      return res.status(400).json({ 
        error: 'Only draft quotes can be deleted' 
      });
    }

    await prisma.quote.delete({
      where: { id },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'delete',
        resource: 'quote',
        resourceId: id,
        oldValues: quote,
      },
    });

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
};

// Get quote analytics
export const getQuoteAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { period = '30' } = req.query;

    const periodDays = Number(period);
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    const quotes = await prisma.quote.findMany({
      where: {
        organizationId,
        createdAt: { gte: periodStart },
      },
      include: {
        items: true,
      },
    });

    // Calculate metrics
    const totalQuotes = quotes.length;
    const totalValue = quotes.reduce((sum, quote) => sum + quote.totalAmount, 0);
    const averageQuoteValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;

    // Status distribution
    const quotesByStatus = quotes.reduce((acc, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Conversion rate
    const convertedQuotes = quotes.filter(q => q.status === 'CONVERTED').length;
    const conversionRate = totalQuotes > 0 ? (convertedQuotes / totalQuotes) * 100 : 0;

    // Daily trend
    const dailyQuotes = quotes.reduce((acc, quote) => {
      const date = quote.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { count: 0, value: 0 };
      }
      acc[date].count += 1;
      acc[date].value += quote.totalAmount;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    res.json({
      period: periodDays,
      summary: {
        totalQuotes,
        totalValue,
        averageQuoteValue,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      quotesByStatus,
      dailyTrend: dailyQuotes,
    });
  } catch (error) {
    console.error('Error fetching quote analytics:', error);
    res.status(500).json({ error: 'Failed to fetch quote analytics' });
  }
};