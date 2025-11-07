import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Validation schemas
const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  businessType: z.string().optional(),
  country: z.string().default('Malaysia'),
  planId: z.string().uuid(),
  // Admin user details
  adminEmail: z.string().email(),
  adminFirstName: z.string().min(1),
  adminLastName: z.string().min(1),
  adminPassword: z.string().min(8),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ORG_ADMIN', 'PROJECT_LEAD', 'SENIOR_DESIGNER', 'SENIOR_ARCHITECT', 'DESIGNER', 'ARCHITECT', 'CONTRACTOR', 'ENGINEER', 'STAFF', 'CLIENT', 'CONSULTANT', 'MEMBER', 'VIEWER']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  department: z.string().optional(),
  title: z.string().optional(),
});

const updateMemberSchema = z.object({
  role: z.enum(['ORG_ADMIN', 'PROJECT_LEAD', 'SENIOR_DESIGNER', 'SENIOR_ARCHITECT', 'DESIGNER', 'ARCHITECT', 'CONTRACTOR', 'ENGINEER', 'STAFF', 'CLIENT', 'CONSULTANT', 'MEMBER', 'VIEWER']).optional(),
  permissions: z.array(z.string()).optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Helper functions
const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
};

// Create new organization (with admin user)
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const data = createOrgSchema.parse(req.body);

    // Check if organization slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: data.slug }
    });

    if (existingOrg) {
      return res.status(400).json({ error: 'Organization slug already exists' });
    }

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Admin user email already exists' });
    }

    // Get the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: data.planId }
    });

    if (!plan) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create admin user
      const hashedPassword = await bcrypt.hash(data.adminPassword, 12);
      const adminUser = await tx.user.create({
        data: {
          email: data.adminEmail,
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
          password: hashedPassword,
          emailVerified: false,
        }
      });

      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          email: data.email,
          phone: data.phone,
          website: data.website,
          businessType: data.businessType,
          country: data.country,
          planId: data.planId,
          maxUsers: plan.maxUsers,
          maxProjects: plan.maxProjects,
          maxStorage: plan.maxStorage,
        }
      });

      // Create organization membership for admin
      await tx.organizationMember.create({
        data: {
          userId: adminUser.id,
          organizationId: organization.id,
          role: 'ORG_ADMIN',
          permissions: [
            'organization:manage',
            'users:manage',
            'projects:manage',
            'billing:manage',
            'settings:manage'
          ]
        }
      });

      // Create subscription
      const subscription = await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId: data.planId,
          status: 'TRIALING',
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        }
      });

      // Update organization with subscription
      const updatedOrg = await tx.organization.update({
        where: { id: organization.id },
        data: { subscriptionId: subscription.id },
        include: {
          plan: true,
          subscription: true,
          members: {
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
          }
        }
      });

      return { organization: updatedOrg, adminUser };
    });

    // Create JWT token for admin user
    const token = jwt.sign(
      {
        userId: result.adminUser.id,
        email: result.adminUser.email,
        organizationId: result.organization.id,
        role: 'ORG_ADMIN',
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create session
    await prisma.session.create({
      data: {
        token,
        userId: result.adminUser.id,
        organizationId: result.organization.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    res.status(201).json({
      message: 'Organization created successfully',
      organization: result.organization,
      user: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        firstName: result.adminUser.firstName,
        lastName: result.adminUser.lastName,
      },
      token
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get organization details
export const getOrganization = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userId = (req as any).user.userId;

    // Check if user is member of organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        plan: true,
        subscription: true,
        members: {
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
        },
        _count: {
          select: {
            projects: true,
            documents: true,
            tasks: true,
          }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);

  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Invite user to organization
export const inviteUser = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userId = (req as any).user.userId;
    const data = inviteUserSchema.parse(req.body);

    // Check if current user is org admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      }
    });

    if (!membership || !['ORG_ADMIN'].includes(membership.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check organization limits
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { _count: { select: { members: true } } }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (organization._count.members >= organization.maxUsers) {
      return res.status(400).json({ error: 'Organization has reached maximum user limit' });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    const result = await prisma.$transaction(async (tx) => {
      // Create user if doesn't exist
      if (!user) {
        const tempPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        
        user = await tx.user.create({
          data: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            password: hashedPassword,
            emailVerified: false,
          }
        });
      }

      // Check if user is already a member
      const existingMembership = await tx.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user!.id,
            organizationId
          }
        }
      });

      if (existingMembership) {
        throw new Error('User is already a member of this organization');
      }

      // Create organization membership
      const newMembership = await tx.organizationMember.create({
        data: {
          userId: user!.id,
          organizationId,
          role: data.role,
          department: data.department,
          title: data.title,
          invitedBy: userId,
          permissions: getDefaultPermissions(data.role)
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

      return { membership: newMembership, isNewUser: !user };
    });

    // TODO: Send invitation email

    res.status(201).json({
      message: 'User invited successfully',
      membership: result.membership,
      isNewUser: result.isNewUser
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error && error.message === 'User is already a member of this organization') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update organization member
export const updateMember = async (req: Request, res: Response) => {
  try {
    const { organizationId, memberId } = req.params;
    const userId = (req as any).user.userId;
    const data = updateMemberSchema.parse(req.body);

    // Check if current user is org admin
    const currentMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      }
    });

    if (!currentMembership || !['ORG_ADMIN'].includes(currentMembership.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update member
    const updatedMember = await prisma.organizationMember.update({
      where: { id: memberId },
      data: {
        role: data.role,
        permissions: data.permissions || (data.role ? getDefaultPermissions(data.role) : undefined),
        department: data.department,
        title: data.title,
        isActive: data.isActive,
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

    res.json({
      message: 'Member updated successfully',
      member: updatedMember
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove member from organization
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { organizationId, memberId } = req.params;
    const userId = (req as any).user.userId;

    // Check if current user is org admin
    const currentMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      }
    });

    if (!currentMembership || !['ORG_ADMIN'].includes(currentMembership.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get member to remove
    const memberToRemove = await prisma.organizationMember.findUnique({
      where: { id: memberId }
    });

    if (!memberToRemove || memberToRemove.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Cannot remove self
    if (memberToRemove.userId === userId) {
      return res.status(400).json({ error: 'Cannot remove yourself from organization' });
    }

    // Remove member
    await prisma.organizationMember.delete({
      where: { id: memberId }
    });

    res.json({ message: 'Member removed successfully' });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get organization statistics
export const getOrganizationStats = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userId = (req as any).user.userId;

    // Check if user is member of organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [
      projectStats,
      taskStats,
      documentStats,
      memberStats,
      recentActivity
    ] = await Promise.all([
      // Project statistics
      prisma.project.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: true
      }),
      
      // Task statistics  
      prisma.task.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: true
      }),

      // Document statistics
      prisma.document.aggregate({
        where: { organizationId },
        _count: true,
        _sum: { size: true }
      }),

      // Member statistics
      prisma.organizationMember.groupBy({
        by: ['role'],
        where: { organizationId, isActive: true },
        _count: true
      }),

      // Recent activity (audit logs)
      prisma.auditLog.findMany({
        where: { organizationId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      })
    ]);

    res.json({
      projects: projectStats,
      tasks: taskStats,
      documents: {
        count: documentStats._count,
        totalSize: documentStats._sum.size || 0
      },
      members: memberStats,
      recentActivity
    });

  } catch (error) {
    console.error('Get organization stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to get default permissions based on role
function getDefaultPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    'ORG_ADMIN': [
      'organization:manage',
      'users:manage', 
      'projects:manage',
      'billing:manage',
      'settings:manage'
    ],
    'PROJECT_LEAD': [
      'projects:manage',
      'tasks:manage',
      'documents:manage',
      'meetings:manage'
    ],
    'SENIOR_DESIGNER': [
      'projects:create',
      'projects:update',
      'tasks:manage',
      'documents:manage'
    ],
    'SENIOR_ARCHITECT': [
      'projects:create',
      'projects:update', 
      'tasks:manage',
      'documents:manage'
    ],
    'DESIGNER': [
      'projects:read',
      'tasks:create',
      'tasks:update',
      'documents:upload'
    ],
    'ARCHITECT': [
      'projects:read',
      'tasks:create', 
      'tasks:update',
      'documents:upload'
    ],
    'CONTRACTOR': [
      'projects:read',
      'tasks:update',
      'documents:read'
    ],
    'ENGINEER': [
      'projects:read',
      'tasks:update', 
      'documents:read'
    ],
    'STAFF': [
      'projects:read',
      'tasks:read',
      'documents:read'
    ],
    'CLIENT': [
      'projects:read',
      'documents:read'
    ],
    'CONSULTANT': [
      'projects:read',
      'documents:read'
    ],
    'MEMBER': [
      'projects:read'
    ],
    'VIEWER': [
      'projects:read'
    ]
  };

  return permissions[role] || [];
}