import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import bcrypt from 'bcrypt';

const router = Router();
const prisma = new PrismaClient();

// Get all organizations (admin only)
(router.get as any)('/', authenticate, async (req: any, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. System admin required.'
      });
    }

    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            users: true,
            projects: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      organizations
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch organizations'
    });
  }
});

// Get organization by ID
(router.get as any)('/:id', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    // Users can only access their own organization unless they're system admin
    if (user.role !== 'SYSTEM_ADMIN' && user.organizationId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            lastLoginAt: true
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        },
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true
          }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.json({
      success: true,
      organization
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch organization'
    });
  }
});

// Create new organization
(router.post as any)('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      businessType,
      size,
      country,
      city,
      state,
      address,
      postalCode,
      phone,
      website,
      email,
      adminUser
    } = req.body;

    // Validate required fields
    if (!name || !slug || !adminUser) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if organization slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    });

    if (existingOrg) {
      return res.status(400).json({
        success: false,
        error: 'Organization slug already exists'
      });
    }

    // Check if admin user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminUser.email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create organization and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
          description,
          businessType,
          size,
          country,
          city,
          state,
          address,
          postalCode,
          phone,
          website,
          email,
          status: 'active',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
          subscription: {
            create: {
              plan: 'Basic',
              status: 'trial',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      });

      // Hash password
      const hashedPassword = await bcrypt.hash(adminUser.password, 10);

      // Create admin user
      const user = await tx.user.create({
        data: {
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          password: hashedPassword,
          role: 'ORG_ADMIN',
          organizationId: organization.id,
          emailVerified: true
        }
      });

      return { organization, user };
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization: result.organization,
      adminUser: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName
      }
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create organization'
    });
  }
});

// Update organization
(router.put as any)('/:id', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const updates = req.body;

    // Users can only update their own organization unless they're system admin
    if (user.role !== 'SYSTEM_ADMIN' && user.organizationId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Remove sensitive fields that shouldn't be updated
    delete updates.id;
    delete updates.slug;
    delete updates.createdAt;
    delete updates.updatedAt;

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Organization updated successfully',
      organization
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update organization'
    });
  }
});

// Delete organization (admin only)
(router.delete as any)('/:id', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = (req as any).user?.role;

    if (userRole !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. System admin required.'
      });
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Delete organization and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete projects
      await tx.project.deleteMany({
        where: { organizationId: id }
      });

      // Delete users
      await tx.user.deleteMany({
        where: { organizationId: id }
      });

      // Delete subscription
      await tx.subscription.deleteMany({
        where: { organizationId: id }
      });

      // Delete organization
      await tx.organization.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete organization'
    });
  }
});

// Suspend/Activate organization (admin only)
(router.patch as any)('/:id/status', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userRole = (req as any).user?.role;

    if (userRole !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. System admin required.'
      });
    }

    if (!['active', 'suspended', 'pending', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    // Log the status change
    await prisma.auditLog.create({
      data: {
        action: `ORGANIZATION_${status.toUpperCase()}`,
        entityType: 'ORGANIZATION',
        entityId: id,
        userId: (req as any).user.id,
        details: {
          reason,
          previousStatus: organization.status,
          newStatus: status
        }
      }
    });

    res.json({
      success: true,
      message: `Organization ${status} successfully`,
      organization
    });
  } catch (error) {
    console.error('Error updating organization status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update organization status'
    });
  }
});

// Get organization statistics
(router.get as any)('/:id/stats', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Users can only access their own organization stats unless they're system admin
    if (user.role !== 'SYSTEM_ADMIN' && user.organizationId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const [
      userCount,
      projectCount,
      activeProjects,
      completedProjects,
      totalStorage,
      subscription
    ] = await Promise.all([
      prisma.user.count({ where: { organizationId: id } }),
      prisma.project.count({ where: { organizationId: id } }),
      prisma.project.count({ where: { organizationId: id, status: 'active' } }),
      prisma.project.count({ where: { organizationId: id, status: 'completed' } }),
      prisma.file.aggregate({
        where: { project: { organizationId: id } },
        _sum: { size: true }
      }),
      prisma.subscription.findFirst({ where: { organizationId: id } })
    ]);

    const stats = {
      users: {
        total: userCount,
        active: userCount, // You might want to add lastLoginAt logic
        newThisMonth: 0 // Add logic for new users this month
      },
      projects: {
        total: projectCount,
        active: activeProjects,
        completed: completedProjects,
        newThisMonth: 0 // Add logic for new projects this month
      },
      storage: {
        used: totalStorage._sum.size || 0,
        limit: subscription?.plan === 'Basic' ? 1024 * 1024 * 1024 * 10 : // 10GB
               subscription?.plan === 'Professional' ? 1024 * 1024 * 1024 * 100 : // 100GB
               subscription?.plan === 'Enterprise' ? 1024 * 1024 * 1024 * 1000 : // 1TB
               1024 * 1024 * 1024 * 10 // Default 10GB
      },
      subscription: {
        plan: subscription?.plan || 'Basic',
        status: subscription?.status || 'trial',
        trialEndsAt: subscription?.trialEndsAt,
        currentPeriodEnd: subscription?.currentPeriodEnd
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch organization stats'
    });
  }
});

// Invite users to organization
(router.post as any)('/:id/invite', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { emails, role, message } = req.body;
    const user = (req as any).user;

    // Only organization admins and system admins can invite users
    if (user.role !== 'SYSTEM_ADMIN' && 
        (user.organizationId !== id || user.role !== 'ORG_ADMIN')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one email is required'
      });
    }

    const invitations = [];

    for (const email of emails) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        // User exists, check if they're already in this organization
        if (existingUser.organizationId === id) {
          invitations.push({
            email,
            status: 'already_member',
            message: 'User is already a member of this organization'
          });
          continue;
        }
      }

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          email,
          organizationId: id,
          role: role || 'STAFF',
          invitedBy: user.id,
          message: message || 'You have been invited to join our organization',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      invitations.push({
        email,
        status: 'invited',
        invitationId: invitation.id
      });

      // TODO: Send invitation email
      // await sendInvitationEmail(invitation);
    }

    res.json({
      success: true,
      message: 'Invitations sent successfully',
      invitations
    });
  } catch (error) {
    console.error('Error sending invitations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send invitations'
    });
  }
});

// Get organization invitations
(router.get as any)('/:id/invitations', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Users can only view invitations for their own organization unless they're system admin
    if (user.role !== 'SYSTEM_ADMIN' && user.organizationId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const invitations = await prisma.invitation.findMany({
      where: { organizationId: id },
      include: {
        invitedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      invitations
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch invitations'
    });
  }
});

// Cancel invitation
(router.delete as any)('/:id/invitations/:invitationId', authenticate, async (req: any, res: Response) => {
  try {
    const { id, invitationId } = req.params;
    const user = (req as any).user;

    // Only organization admins and system admins can cancel invitations
    if (user.role !== 'SYSTEM_ADMIN' && 
        (user.organizationId !== id || user.role !== 'ORG_ADMIN')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await prisma.invitation.delete({
      where: { id: invitationId }
    });

    res.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel invitation'
    });
  }
});

export default router;
