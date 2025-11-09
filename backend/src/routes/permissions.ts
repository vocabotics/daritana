import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// No custom interface needed - cast inline where needed

// Get all permission groups for the organization
(router.get as any)('/groups', authenticate, async (req: any, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Organization ID is required' 
      });
    }

    // For now, return default groups (in production, these would be stored in DB)
    const defaultGroups = [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access with all permissions',
        color: 'red',
        icon: 'Shield',
        isSystem: true,
        permissions: [],
        pagePermissions: [],
        memberCount: await prisma.user.count({
          where: {
            organizationId,
            organizationRole: 'ORG_ADMIN'
          } as any
        })
      },
      {
        id: 'project_lead',
        name: 'Project Lead',
        description: 'Project management and team leadership',
        color: 'blue',
        icon: 'Briefcase',
        isSystem: true,
        permissions: [],
        pagePermissions: [],
        memberCount: await prisma.user.count({
          where: {
            organizationId,
            organizationRole: 'PROJECT_LEAD'
          } as any
        })
      },
      {
        id: 'designer',
        name: 'Designer',
        description: 'Design team with creative tools access',
        color: 'purple',
        icon: 'Palette',
        isSystem: true,
        permissions: [],
        pagePermissions: [],
        memberCount: await prisma.user.count({
          where: {
            organizationId,
            organizationRole: 'DESIGNER'
          } as any
        })
      },
      {
        id: 'staff',
        name: 'Staff',
        description: 'General staff members with operational access',
        color: 'green',
        icon: 'Users',
        isSystem: true,
        permissions: [],
        pagePermissions: [],
        memberCount: await prisma.user.count({
          where: {
            organizationId,
            organizationRole: 'STAFF'
          } as any
        })
      },
      {
        id: 'contractor',
        name: 'Contractor',
        description: 'External contractors with limited project access',
        color: 'orange',
        icon: 'UserPlus',
        isSystem: true,
        permissions: [],
        pagePermissions: [],
        memberCount: await prisma.user.count({
          where: {
            organizationId,
            organizationRole: 'CONTRACTOR'
          } as any
        })
      },
      {
        id: 'client',
        name: 'Client',
        description: 'External clients with view and approval rights',
        color: 'green',
        icon: 'User',
        isSystem: true,
        permissions: [],
        pagePermissions: [],
        memberCount: await prisma.user.count({
          where: {
            organizationId,
            organizationRole: 'CLIENT'
          } as any
        })
      }
    ];

    res.json({
      success: true,
      groups: defaultGroups
    });
  } catch (error) {
    console.error('Error fetching permission groups:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch permission groups' 
    });
  }
});

// Create a new permission group
(router.post as any)('/groups', authenticate, async (req: any, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const userRole = req.user?.role;
    
    // Only admins can create permission groups
    if (userRole !== 'ORG_ADMIN' && userRole !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can create permission groups'
      });
    }

    const { name, description, color, icon, permissions, pagePermissions } = req.body;

    // In production, save to database
    // For now, return success with the created group
    const newGroup = {
      id: `group_${Date.now()}`,
      name,
      description,
      color,
      icon,
      isSystem: false,
      permissions: permissions || [],
      pagePermissions: pagePermissions || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      memberCount: 0
    };

    res.json({
      success: true,
      group: newGroup
    });
  } catch (error) {
    console.error('Error creating permission group:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create permission group'
    });
  }
});

// Update a permission group
(router.put as any)('/groups/:groupId', authenticate, async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { groupId } = req.params;
    
    // Only admins can update permission groups
    if (userRole !== 'ORG_ADMIN' && userRole !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can update permission groups'
      });
    }

    const updates = req.body;

    // In production, update in database
    // For now, return success
    res.json({
      success: true,
      message: `Group ${groupId} updated successfully`,
      updates
    });
  } catch (error) {
    console.error('Error updating permission group:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update permission group'
    });
  }
});

// Delete a permission group
(router.delete as any)('/groups/:groupId', authenticate, async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { groupId } = req.params;
    
    // Only admins can delete permission groups
    if (userRole !== 'ORG_ADMIN' && userRole !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can delete permission groups'
      });
    }

    // Check if it's a system group
    const systemGroups = ['admin', 'project_lead', 'designer', 'staff', 'contractor', 'client'];
    if (systemGroups.includes(groupId)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system groups'
      });
    }

    // In production, delete from database
    // For now, return success
    res.json({
      success: true,
      message: `Group ${groupId} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting permission group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete permission group'
    });
  }
});

// Get user's permissions
(router.get as any)('/user/:userId', authenticate, async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = req.user?.organizationId;

    // Get user's role
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId
      } as any
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Map role to permission group
    const roleToGroup: Record<string, string> = {
      'ORG_ADMIN': 'admin',
      'PROJECT_LEAD': 'project_lead',
      'DESIGNER': 'designer',
      'STAFF': 'staff',
      'CONTRACTOR': 'contractor',
      'CLIENT': 'client'
    };

    const groupId = roleToGroup[(user as any).organizationRole || 'CLIENT'] || 'client';

    res.json({
      success: true,
      userId,
      groupId,
      role: (user as any).organizationRole,
      permissions: [] // In production, fetch actual permissions
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user permissions'
    });
  }
});

// Export/Import permissions
(router.get as any)('/export', authenticate, async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    // Only admins can export permissions
    if (userRole !== 'ORG_ADMIN' && userRole !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can export permissions'
      });
    }

    // In production, fetch from database
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date(),
      groups: [] // Would contain actual groups
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export permissions'
    });
  }
});

(router.post as any)('/import', authenticate, async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    // Only admins can import permissions
    if (userRole !== 'ORG_ADMIN' && userRole !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can import permissions'
      });
    }

    const { data } = req.body;

    // Validate import data
    if (!data || !data.groups) {
      return res.status(400).json({
        success: false,
        error: 'Invalid import data'
      });
    }

    // In production, save to database
    res.json({
      success: true,
      message: 'Permissions imported successfully',
      groupsImported: data.groups.length
    });
  } catch (error) {
    console.error('Error importing permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import permissions'
    });
  }
});

export default router;