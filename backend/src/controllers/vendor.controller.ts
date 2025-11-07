import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createVendorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default('Malaysia'),
  businessType: z.string().min(1, 'Business type is required'),
  specialties: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  yearsInBusiness: z.number().int().min(0).optional(),
});

const updateVendorSchema = createVendorSchema.partial();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

// Get all vendors for organization
export const getVendors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      businessType = '', 
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      organizationId,
      ...(search && {
        OR: [
          { companyName: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(businessType && { businessType }),
      ...(isVerified !== undefined && { isVerified: isVerified === 'true' }),
    };

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          products: {
            select: {
              id: true,
              name: true,
              category: true,
              price: true,
              isActive: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
              reviews: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          [String(sortBy)]: sortOrder as 'asc' | 'desc',
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    // Calculate average ratings
    const vendorsWithRatings = vendors.map(vendor => {
      const totalRating = vendor.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = vendor.reviews.length > 0 ? totalRating / vendor.reviews.length : 0;
      
      return {
        ...vendor,
        averageRating: Math.round(averageRating * 10) / 10,
        reviews: undefined, // Remove individual reviews from response
      };
    });

    res.json({
      vendors: vendorsWithRatings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

// Get vendor by ID
export const getVendorById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const vendor = await prisma.vendor.findUnique({
      where: {
        id,
        organizationId,
      },
      include: {
        products: {
          where: { isActive: true },
          include: {
            reviews: {
              select: {
                rating: true,
                review: true,
                user: {
                  select: {
                    name: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            _count: {
              select: {
                reviews: true,
                orderItems: true,
              },
            },
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
              },
            },
            order: {
              select: {
                orderNumber: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Calculate analytics
    const totalOrders = vendor._count.orders;
    const totalProducts = vendor._count.products;
    const totalReviews = vendor._count.reviews;
    
    const totalRevenue = vendor.orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const analytics = {
      totalOrders,
      totalProducts,
      totalReviews,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      rating: vendor.rating,
    };

    res.json({
      ...vendor,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
};

// Create new vendor
export const createVendor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const validatedData = createVendorSchema.parse(req.body);

    // Check if vendor with same email already exists
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        email: validatedData.email,
        organizationId,
      },
    });

    if (existingVendor) {
      return res.status(400).json({ error: 'Vendor with this email already exists' });
    }

    const vendor = await prisma.vendor.create({
      data: {
        ...validatedData,
        organizationId,
      },
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'create',
        resource: 'vendor',
        resourceId: vendor.id,
        newValues: validatedData,
      },
    });

    res.status(201).json(vendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
};

// Update vendor
export const updateVendor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const validatedData = updateVendorSchema.parse(req.body);

    // Check if vendor exists and belongs to organization
    const existingVendor = await prisma.vendor.findUnique({
      where: { id, organizationId },
    });

    if (!existingVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Check if email is being changed and if it conflicts
    if (validatedData.email && validatedData.email !== existingVendor.email) {
      const emailConflict = await prisma.vendor.findFirst({
        where: {
          email: validatedData.email,
          organizationId,
          id: { not: id },
        },
      });

      if (emailConflict) {
        return res.status(400).json({ error: 'Vendor with this email already exists' });
      }
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true,
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
        resource: 'vendor',
        resourceId: vendor.id,
        oldValues: existingVendor,
        newValues: validatedData,
      },
    });

    res.json(vendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
};

// Delete vendor
export const deleteVendor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    // Check if vendor exists and belongs to organization
    const vendor = await prisma.vendor.findUnique({
      where: { id, organizationId },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Check if vendor has active orders
    const activeOrders = await prisma.order.count({
      where: {
        vendorId: id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
        },
      },
    });

    if (activeOrders > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete vendor with active orders. Please complete or cancel all orders first.' 
      });
    }

    await prisma.vendor.delete({
      where: { id },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'delete',
        resource: 'vendor',
        resourceId: id,
        oldValues: vendor,
      },
    });

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
};

// Verify vendor
export const verifyVendor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const { isVerified } = req.body;

    const vendor = await prisma.vendor.update({
      where: { id, organizationId },
      data: { isVerified },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'update',
        resource: 'vendor',
        resourceId: id,
        newValues: { isVerified },
      },
    });

    res.json(vendor);
  } catch (error) {
    console.error('Error verifying vendor:', error);
    res.status(500).json({ error: 'Failed to verify vendor' });
  }
};

// Get vendor analytics
export const getVendorAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const { period = '30' } = req.query; // days

    const periodDays = Number(period);
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    // Get vendor analytics
    const analytics = await prisma.vendor.findUnique({
      where: { id, organizationId },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: periodStart,
            },
          },
          select: {
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            category: true,
            orderItems: {
              where: {
                order: {
                  createdAt: {
                    gte: periodStart,
                  },
                },
              },
              select: {
                quantity: true,
                totalPrice: true,
              },
            },
          },
        },
        reviews: {
          where: {
            createdAt: {
              gte: periodStart,
            },
          },
          select: {
            rating: true,
            qualityRating: true,
            deliveryRating: true,
            serviceRating: true,
            valueRating: true,
            createdAt: true,
          },
        },
      },
    });

    if (!analytics) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Calculate metrics
    const totalRevenue = analytics.orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = analytics.orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Order status distribution
    const ordersByStatus = analytics.orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Daily revenue trend
    const dailyRevenue = analytics.orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Top products by revenue
    const productRevenue = analytics.products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      revenue: product.orderItems.reduce((sum, item) => sum + item.totalPrice, 0),
      unitsSold: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    })).sort((a, b) => b.revenue - a.revenue);

    // Rating trends
    const averageRatings = {
      overall: analytics.reviews.length > 0 
        ? analytics.reviews.reduce((sum, r) => sum + r.rating, 0) / analytics.reviews.length 
        : 0,
      quality: analytics.reviews.filter(r => r.qualityRating).length > 0
        ? analytics.reviews.reduce((sum, r) => sum + (r.qualityRating || 0), 0) / analytics.reviews.filter(r => r.qualityRating).length
        : 0,
      delivery: analytics.reviews.filter(r => r.deliveryRating).length > 0
        ? analytics.reviews.reduce((sum, r) => sum + (r.deliveryRating || 0), 0) / analytics.reviews.filter(r => r.deliveryRating).length
        : 0,
      service: analytics.reviews.filter(r => r.serviceRating).length > 0
        ? analytics.reviews.reduce((sum, r) => sum + (r.serviceRating || 0), 0) / analytics.reviews.filter(r => r.serviceRating).length
        : 0,
      value: analytics.reviews.filter(r => r.valueRating).length > 0
        ? analytics.reviews.reduce((sum, r) => sum + (r.valueRating || 0), 0) / analytics.reviews.filter(r => r.valueRating).length
        : 0,
    };

    res.json({
      period: periodDays,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      ordersByStatus,
      dailyRevenue,
      topProducts: productRevenue.slice(0, 10),
      averageRatings,
      totalReviews: analytics.reviews.length,
    });
  } catch (error) {
    console.error('Error fetching vendor analytics:', error);
    res.status(500).json({ error: 'Failed to fetch vendor analytics' });
  }
};

// Search vendors
export const searchVendors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { q, category, location, minRating } = req.query;

    const vendors = await prisma.vendor.findMany({
      where: {
        organizationId,
        isActive: true,
        ...(q && {
          OR: [
            { companyName: { contains: String(q), mode: 'insensitive' } },
            { specialties: { hasSome: [String(q)] } },
            { businessType: { contains: String(q), mode: 'insensitive' } },
          ],
        }),
        ...(category && { businessType: String(category) }),
        ...(location && {
          OR: [
            { city: { contains: String(location), mode: 'insensitive' } },
            { state: { contains: String(location), mode: 'insensitive' } },
          ],
        }),
        ...(minRating && { rating: { gte: Number(minRating) } }),
      },
      include: {
        _count: {
          select: {
            products: true,
            reviews: true,
          },
        },
      },
      take: 50,
      orderBy: [
        { isVerified: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
    });

    res.json(vendors);
  } catch (error) {
    console.error('Error searching vendors:', error);
    res.status(500).json({ error: 'Failed to search vendors' });
  }
};