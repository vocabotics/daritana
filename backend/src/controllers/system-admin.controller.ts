import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';

// Validation schemas
const createPlanSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  maxUsers: z.number().min(1),
  maxProjects: z.number().min(1),
  maxStorage: z.number().min(100), // MB
  maxFiles: z.number().min(10),
  features: z.array(z.string()),
  isPublic: z.boolean().default(true),
});

const updateOrgStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']),
  suspensionReason: z.string().optional(),
});

const systemAdminSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN', 'BILLING_ADMIN', 'TECH_ADMIN', 'ANALYST', 'SUPPORT']),
  permissions: z.array(z.string()).optional(),
});

// Middleware to check system admin access
const requireSystemAdmin = (requiredRoles: string[] = []) => {
  return async (req: Request, res: Response, next: any) => {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const systemAdmin = await prisma.systemAdmin.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!systemAdmin) {
      return res.status(403).json({ error: 'System admin access required' });
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(systemAdmin.role)) {
      return res.status(403).json({ error: 'Insufficient system admin privileges' });
    }

    (req as any).systemAdmin = systemAdmin;
    next();
  };
};

// Get platform overview statistics
export const getPlatformStats = async (req: Request, res: Response) => {
  try {
    const [
      totalOrgs,
      activeOrgs,
      totalUsers,
      activeUsers,
      totalProjects,
      totalRevenue,
      subscriptionStats,
      recentOrgs
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.user.count({ 
        where: { 
          isActive: true,
          lastActiveAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
        } 
      }),
      prisma.project.count(),
      prisma.transaction.aggregate({
        where: { 
          status: 'COMPLETED',
          type: 'PAYMENT'
        },
        _sum: { amount: true }
      }),
      prisma.subscription.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.organization.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: { select: { displayName: true } },
          _count: { select: { members: true, projects: true } }
        }
      })
    ]);

    res.json({
      overview: {
        totalOrganizations: totalOrgs,
        activeOrganizations: activeOrgs,
        totalUsers: totalUsers,
        activeUsers: activeUsers,
        totalProjects: totalProjects,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      subscriptions: subscriptionStats,
      recentOrganizations: recentOrgs
    });

  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all organizations (with pagination and filters)
export const getAllOrganizations = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          plan: { select: { displayName: true, monthlyPrice: true } },
          subscription: { select: { status: true, currentPeriodEnd: true } },
          _count: { 
            select: { 
              members: true, 
              projects: true,
              documents: true
            } 
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.organization.count({ where })
    ]);

    res.json({
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all organizations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update organization status (suspend, activate, etc.)
export const updateOrganizationStatus = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const data = updateOrgStatusSchema.parse(req.body);
    const systemAdminId = (req as any).systemAdmin.id;

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        status: data.status,
        isSuspended: data.status === 'SUSPENDED',
        suspensionReason: data.suspensionReason,
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: systemAdminId,
        organizationId,
        action: 'update_status',
        resource: 'organization',
        resourceId: organizationId,
        newValues: data,
      }
    });

    res.json({
      message: 'Organization status updated successfully',
      organization
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update organization status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create subscription plan
export const createSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const data = createPlanSchema.parse(req.body);

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        monthlyPrice: data.monthlyPrice,
        yearlyPrice: data.yearlyPrice,
        maxUsers: data.maxUsers,
        maxProjects: data.maxProjects,
        maxStorage: data.maxStorage,
        maxFiles: data.maxFiles,
        features: data.features,
        isPublic: data.isPublic,
      }
    });

    res.status(201).json({
      message: 'Subscription plan created successfully',
      plan
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create subscription plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all subscription plans
export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    
    const where = includeInactive ? {} : { isActive: true };

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      include: {
        _count: { select: { organizations: true, subscriptions: true } }
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json(plans);

  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get billing analytics
export const getBillingAnalytics = async (req: Request, res: Response) => {
  try {
    const [
      monthlyRevenue,
      planDistribution,
      churnRate,
      trialConversions,
      recentTransactions
    ] = await Promise.all([
      // Monthly revenue for last 12 months
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          SUM(amount) as revenue,
          COUNT(*) as transactions
        FROM "Transaction" 
        WHERE status = 'COMPLETED' 
          AND type = 'PAYMENT'
          AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,

      // Plan distribution
      prisma.organization.groupBy({
        by: ['planId'],
        _count: true,
        where: { status: 'ACTIVE' }
      }),

      // Organizations that cancelled in last 30 days
      prisma.organization.count({
        where: {
          status: 'CANCELLED',
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),

      // Trial to paid conversions
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          startDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),

      // Recent transactions
      prisma.transaction.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          invoice: { 
            include: { 
              organization: { select: { name: true, slug: true } } 
            } 
          }
        }
      })
    ]);

    res.json({
      monthlyRevenue,
      planDistribution,
      churnRate,
      trialConversions,
      recentTransactions
    });

  } catch (error) {
    console.error('Get billing analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create system admin
export const createSystemAdmin = async (req: Request, res: Response) => {
  try {
    const data = systemAdminSchema.parse(req.body);
    const currentAdminRole = (req as any).systemAdmin.role;

    // Only SUPER_ADMIN can create other system admins
    if (currentAdminRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only super admins can create system admins' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a system admin
    const existingAdmin = await prisma.systemAdmin.findUnique({
      where: { userId: data.userId }
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'User is already a system admin' });
    }

    const systemAdmin = await prisma.systemAdmin.create({
      data: {
        userId: data.userId,
        role: data.role,
        permissions: data.permissions || getDefaultSystemPermissions(data.role),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    });

    res.status(201).json({
      message: 'System admin created successfully',
      systemAdmin
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create system admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all system admins
export const getSystemAdmins = async (req: Request, res: Response) => {
  try {
    const systemAdmins = await prisma.systemAdmin.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            lastActiveAt: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(systemAdmins);

  } catch (error) {
    console.error('Get system admins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get system audit logs
export const getSystemAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string;
    const resource = req.query.resource as string;

    const where: any = {};
    
    if (action) where.action = action;
    if (resource) where.resource = resource;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          },
          organization: {
            select: { name: true, slug: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get system audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function for default system permissions
function getDefaultSystemPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    'SUPER_ADMIN': ['*'], // All permissions
    'PLATFORM_ADMIN': [
      'organizations:manage',
      'users:manage',
      'billing:manage',
      'analytics:view',
      'system:configure'
    ],
    'SUPPORT_ADMIN': [
      'organizations:view',
      'users:manage',
      'support:manage'
    ],
    'BILLING_ADMIN': [
      'billing:manage',
      'transactions:view',
      'subscriptions:manage'
    ],
    'TECH_ADMIN': [
      'system:manage',
      'monitoring:view',
      'logs:view'
    ],
    'ANALYST': [
      'analytics:view',
      'reports:generate'
    ],
    'SUPPORT': [
      'organizations:view',
      'support:basic'
    ]
  };

  return permissions[role] || [];
}

// Export middleware
export { requireSystemAdmin };

// Export all functions
export const systemAdminController = {
  getPlatformStats: [requireSystemAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'ANALYST']), getPlatformStats],
  getAllOrganizations: [requireSystemAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN']), getAllOrganizations],
  updateOrganizationStatus: [requireSystemAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN']), updateOrganizationStatus],
  createSubscriptionPlan: [requireSystemAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN']), createSubscriptionPlan],
  getSubscriptionPlans: [requireSystemAdmin(), getSubscriptionPlans],
  getBillingAnalytics: [requireSystemAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'BILLING_ADMIN', 'ANALYST']), getBillingAnalytics],
  createSystemAdmin: [requireSystemAdmin(['SUPER_ADMIN']), createSystemAdmin],
  getSystemAdmins: [requireSystemAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN']), getSystemAdmins],
  getSystemAuditLogs: [requireSystemAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'TECH_ADMIN']), getSystemAuditLogs],
};