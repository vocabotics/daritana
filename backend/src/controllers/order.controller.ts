import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';


// Validation schemas
const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  deliveryAddress: z.string().optional(),
  deliveryDate: z.string().datetime().optional(),
  deliveryInstructions: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_PAID']).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

const updateOrderItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
  specifications: z.record(z.any()).optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

// Get all orders for organization
export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      vendorId = '',
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
      ...(vendorId && { vendorId }),
      ...(projectId && { projectId }),
      ...(userId && { userId }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { vendor: { companyName: { contains: search, mode: 'insensitive' } } },
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

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
          vendor: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              email: true,
              phone: true,
              isVerified: true,
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
                  unit: true,
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
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get order by ID
export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const order = await prisma.order.findUnique({
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
        vendor: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
            website: true,
            address: true,
            city: true,
            state: true,
            postcode: true,
            isVerified: true,
            rating: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
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
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        vendorReviews: {
          select: {
            id: true,
            rating: true,
            title: true,
            review: true,
            qualityRating: true,
            deliveryRating: true,
            serviceRating: true,
            valueRating: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Update order
export const updateOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const validatedData = updateOrderSchema.parse(req.body);

    // Check if order exists and belongs to organization
    const existingOrder = await prisma.order.findUnique({
      where: { id, organizationId },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Handle special status transitions
    const updates: any = { ...validatedData };
    
    if (validatedData.status) {
      switch (validatedData.status) {
        case 'DELIVERED':
          if (!updates.deliveredAt) {
            updates.deliveredAt = new Date();
          }
          break;
        case 'PAID':
          if (validatedData.paymentStatus === 'PAID' && !updates.paidAt) {
            updates.paidAt = new Date();
          }
          break;
      }
    }

    // Convert date strings to Date objects
    if (validatedData.deliveryDate) {
      updates.deliveryDate = new Date(validatedData.deliveryDate);
    }

    const order = await prisma.order.update({
      where: { id },
      data: updates,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Create notification for status changes
    if (validatedData.status && validatedData.status !== existingOrder.status) {
      const statusMessages = {
        CONFIRMED: 'Order confirmed by vendor',
        PROCESSING: 'Order is being processed',
        SHIPPED: 'Order has been shipped',
        DELIVERED: 'Order delivered successfully',
        CANCELLED: 'Order has been cancelled',
      };

      const message = statusMessages[validatedData.status as keyof typeof statusMessages];
      
      if (message) {
        await prisma.notification.create({
          data: {
            organizationId,
            recipientId: order.userId,
            title: `Order ${order.orderNumber} Update`,
            message,
            type: validatedData.status === 'DELIVERED' ? 'SUCCESS' : 'INFO',
            resourceType: 'order',
            resourceId: order.id,
          },
        });
      }
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'update',
        resource: 'order',
        resourceId: order.id,
        oldValues: existingOrder,
        newValues: validatedData,
      },
    });

    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Update order item
export const updateOrderItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, itemId } = req.params;
    const { organizationId } = req.user!;
    const validatedData = updateOrderItemSchema.parse(req.body);

    // Check if order exists and belongs to organization
    const order = await prisma.order.findUnique({
      where: { id: orderId, organizationId },
      include: {
        items: {
          where: { id: itemId },
        },
      },
    });

    if (!order || order.items.length === 0) {
      return res.status(404).json({ error: 'Order or item not found' });
    }

    const existingItem = order.items[0];

    // Calculate new total price if quantity or unit price changed
    const updates: any = { ...validatedData };
    if (validatedData.quantity || validatedData.unitPrice) {
      const newQuantity = validatedData.quantity || existingItem.quantity;
      const newUnitPrice = validatedData.unitPrice || existingItem.unitPrice;
      updates.totalPrice = newQuantity * newUnitPrice;
    }

    const orderItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: updates,
      include: {
        product: {
          select: {
            name: true,
            category: true,
            unit: true,
          },
        },
      },
    });

    // Recalculate order totals if price changed
    if (updates.totalPrice !== undefined) {
      const allItems = await prisma.orderItem.findMany({
        where: { orderId },
      });
      
      const subtotal = allItems.reduce((sum, item) => {
        return sum + (item.id === itemId ? updates.totalPrice : item.totalPrice);
      }, 0);
      
      const taxAmount = subtotal * 0.06; // 6% GST
      const totalAmount = subtotal + taxAmount;

      await prisma.order.update({
        where: { id: orderId },
        data: {
          subtotal,
          taxAmount,
          totalAmount,
        },
      });
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'update',
        resource: 'order_item',
        resourceId: itemId,
        oldValues: existingItem,
        newValues: validatedData,
      },
    });

    res.json(orderItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error updating order item:', error);
    res.status(500).json({ error: 'Failed to update order item' });
  }
};

// Cancel order
export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id, organizationId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        vendor: { select: { companyName: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order can be cancelled
    if (['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel order with status: ${order.status}` 
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        internalNotes: reason ? `Cancelled: ${reason}` : 'Order cancelled',
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        organizationId,
        recipientId: order.userId,
        title: `Order ${order.orderNumber} Cancelled`,
        message: reason || 'Your order has been cancelled',
        type: 'WARNING',
        resourceType: 'order',
        resourceId: order.id,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'update',
        resource: 'order',
        resourceId: id,
        newValues: { status: 'CANCELLED', reason },
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Get order analytics
export const getOrderAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { period = '30', vendorId, projectId } = req.query;

    const periodDays = Number(period);
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    const where: any = {
      organizationId,
      createdAt: { gte: periodStart },
      ...(vendorId && { vendorId: String(vendorId) }),
      ...(projectId && { projectId: String(projectId) }),
    };

    // Get orders for analytics
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                category: true,
              },
            },
          },
        },
        vendor: {
          select: {
            companyName: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Order status distribution
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Daily order trend
    const dailyOrders = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { count: 0, revenue: 0 };
      }
      acc[date].count += 1;
      acc[date].revenue += order.totalAmount;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    // Top vendors by revenue
    const vendorRevenue = orders.reduce((acc, order) => {
      const vendorName = order.vendor.companyName;
      if (!acc[vendorName]) {
        acc[vendorName] = { revenue: 0, orders: 0 };
      }
      acc[vendorName].revenue += order.totalAmount;
      acc[vendorName].orders += 1;
      return acc;
    }, {} as Record<string, { revenue: number; orders: number }>);

    const topVendors = Object.entries(vendorRevenue)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Product category analysis
    const categoryData = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        const category = item.product.category;
        if (!acc[category]) {
          acc[category] = { revenue: 0, quantity: 0 };
        }
        acc[category].revenue += item.totalPrice;
        acc[category].quantity += item.quantity;
      });
      return acc;
    }, {} as Record<string, { revenue: number; quantity: number }>);

    const topCategories = Object.entries(categoryData)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Performance metrics
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
    const onTimeDeliveries = deliveredOrders.filter(o => 
      o.deliveryDate && o.deliveredAt && o.deliveredAt <= o.deliveryDate
    );
    
    const deliveryPerformance = deliveredOrders.length > 0 
      ? (onTimeDeliveries.length / deliveredOrders.length) * 100 
      : 0;

    res.json({
      period: periodDays,
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        deliveryPerformance: Math.round(deliveryPerformance * 10) / 10,
      },
      ordersByStatus,
      dailyTrend: dailyOrders,
      topVendors,
      topCategories,
      comparisonToPrevious: {
        // Calculate comparison to previous period
        ordersGrowth: 0, // TODO: Implement
        revenueGrowth: 0, // TODO: Implement
      },
    });
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({ error: 'Failed to fetch order analytics' });
  }
};

// Get order tracking info
export const getOrderTracking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const order = await prisma.order.findUnique({
      where: { id, organizationId },
      include: {
        vendor: {
          select: {
            companyName: true,
            contactName: true,
            phone: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            status: true,
            deliveredAt: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create tracking timeline
    const timeline = [
      {
        status: 'PENDING',
        label: 'Order Placed',
        timestamp: order.createdAt,
        completed: true,
        description: 'Order has been placed and is pending confirmation',
      },
      {
        status: 'CONFIRMED',
        label: 'Order Confirmed',
        timestamp: order.status === 'CONFIRMED' || ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? order.updatedAt : null,
        completed: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
        description: 'Vendor has confirmed the order',
      },
      {
        status: 'PROCESSING',
        label: 'Processing',
        timestamp: order.status === 'PROCESSING' || ['SHIPPED', 'DELIVERED'].includes(order.status) ? order.updatedAt : null,
        completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
        description: 'Order is being prepared for shipment',
      },
      {
        status: 'SHIPPED',
        label: 'Shipped',
        timestamp: order.status === 'SHIPPED' || order.status === 'DELIVERED' ? order.updatedAt : null,
        completed: ['SHIPPED', 'DELIVERED'].includes(order.status),
        description: 'Order has been shipped',
      },
      {
        status: 'DELIVERED',
        label: 'Delivered',
        timestamp: order.status === 'DELIVERED' ? order.updatedAt : null,
        completed: order.status === 'DELIVERED',
        description: 'Order has been delivered successfully',
      },
    ];

    // Handle cancelled orders
    if (order.status === 'CANCELLED') {
      timeline.push({
        status: 'CANCELLED',
        label: 'Cancelled',
        timestamp: order.updatedAt,
        completed: true,
        description: 'Order has been cancelled',
      });
    }

    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedDelivery: order.deliveryDate,
      vendor: order.vendor,
      timeline,
      items: order.items,
    });
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    res.status(500).json({ error: 'Failed to fetch order tracking' });
  }
};

// Bulk update orders
export const bulkUpdateOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { orderIds, updates } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Order IDs array is required' });
    }

    const validatedUpdates = updateOrderSchema.partial().parse(updates);

    // Update orders
    const result = await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        organizationId,
      },
      data: validatedUpdates,
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'update',
        resource: 'order',
        newValues: { bulkUpdate: true, orderCount: result.count, updates: validatedUpdates },
      },
    });

    res.json({
      message: `Updated ${result.count} orders`,
      updatedCount: result.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error bulk updating orders:', error);
    res.status(500).json({ error: 'Failed to bulk update orders' });
  }
};