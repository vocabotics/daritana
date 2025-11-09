import { Router } from 'express';
import { prisma } from '../server';

const router = Router();

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        organizationMembers: {
          include: {
            organization: true
          }
        },
        profile: true
      }
    });

    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen,
        organizations: user.organizationMembers.map(member => ({
          id: member.organization.id,
          name: member.organization.name,
          role: member.role,
          isActive: member.isActive
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        organizationMembers: {
          include: {
            organization: true
          }
        },
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen,
        organizations: user.organizationMembers.map(member => ({
          id: member.organization.id,
          name: member.organization.name,
          role: member.role,
          isActive: member.isActive
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        organizationMembers: {
          include: {
            organization: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete by updating status
    await prisma.user.update({
      where: { id },
      data: { status: 'deleted' }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (userId) where.userId = userId as string;
    if (action) where.action = action as string;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit log by ID
router.get('/audit-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Create audit log entry
router.post('/audit-logs', async (req, res) => {
  try {
    const { userId, action, details, resourceType, resourceId, organizationId } = req.body;

    const log = await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        resourceType,
        resourceId,
        organizationId
      }
    });

    res.json({
      success: true,
      message: 'Audit log created successfully',
      data: log
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const [userCount, organizationCount, projectCount, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.project.count(),
      prisma.user.count({
        where: {
          lastSeen: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: userCount,
        totalOrganizations: organizationCount,
        totalProjects: projectCount,
        activeUsers24h: activeUsers
      }
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

export default router;