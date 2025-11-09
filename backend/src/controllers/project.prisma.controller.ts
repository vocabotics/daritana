import { Request, Response } from 'express';
import { prisma } from '../server';


export class ProjectController {
  static async getAllProjects(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'DESC' } = req.query;
      
      // Get the authenticated user's organization
      const authReq = req as any;
      const userId = authReq.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Get user's active organization membership
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: userId,
          isActive: true
        }
      });
      
      if (!membership) {
        return res.status(403).json({ error: 'No active organization membership found' });
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const projects = await prisma.project.findMany({
        where: {
          organizationId: membership.organizationId
        },
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder?.toString().toLowerCase() },
        include: {
          tasks: {
            select: {
              id: true,
              status: true,
            }
          }
        }
      });
      
      const total = await prisma.project.count({
        where: {
          organizationId: membership.organizationId
        }
      });
      
      res.json({
        success: true,
        data: {
          projects,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }

  static async getProjectById(req: Request, res: Response) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: {
          tasks: true,
        }
      });
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json({ success: true, data: { project } });
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  }

  static async createProject(req: Request, res: Response) {
    try {
      // Get the authenticated user's organization
      const authReq = req as any;
      const userId = authReq.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Get user's active organization membership
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: userId,
          isActive: true
        }
      });
      
      if (!membership) {
        // If no membership, create a default organization for the user
        // First get or create a basic plan
        let basicPlan = await prisma.subscriptionPlan.findFirst({
          where: { name: 'Basic' }
        });
        
        if (!basicPlan) {
          basicPlan = await prisma.subscriptionPlan.create({
            data: {
              name: 'Basic',
              description: 'Basic plan for getting started',
              price: 0,
              currency: 'MYR',
              interval: 'MONTHLY',
              features: ['5 Projects', '10 Users', 'Basic Support'],
              maxProjects: 5,
              maxUsers: 10,
              maxStorage: 1073741824, // 1GB
              isActive: true
            }
          });
        }
        
        const defaultOrg = await prisma.organization.create({
          data: {
            name: `${authReq.user.firstName || 'User'}'s Organization`,
            slug: `org-${userId.slice(0, 8)}`,
            email: authReq.user.email,
            status: 'ACTIVE',
            planId: basicPlan.id,
            members: {
              create: {
                userId: userId,
                role: 'OWNER',
                isActive: true
              }
            }
          }
        });
        
        const newMembership = await prisma.organizationMember.findFirst({
          where: {
            userId: userId,
            organizationId: defaultOrg.id
          }
        });
        
        if (newMembership) {
          Object.assign(membership, newMembership);
        }
      }
      
      // Ensure we have a valid organization ID
      let organizationId = membership?.organizationId;
      
      if (!organizationId) {
        // Create a default organization if none exists
        // First get or create a basic plan
        let basicPlan = await prisma.subscriptionPlan.findFirst({
          where: { name: 'Basic' }
        });
        
        if (!basicPlan) {
          basicPlan = await prisma.subscriptionPlan.create({
            data: {
              name: 'Basic',
              description: 'Basic plan for getting started',
              price: 0,
              currency: 'MYR',
              interval: 'MONTHLY',
              features: ['5 Projects', '10 Users', 'Basic Support'],
              maxProjects: 5,
              maxUsers: 10,
              maxStorage: 1073741824, // 1GB
              isActive: true
            }
          });
        }
        
        const defaultOrg = await prisma.organization.create({
          data: {
            name: `${authReq.user.firstName || 'User'}'s Organization`,
            slug: `org-${userId.slice(0, 8)}`,
            email: authReq.user.email,
            status: 'ACTIVE',
            planId: basicPlan.id,
            members: {
              create: {
                userId: userId,
                role: 'OWNER',
                isActive: true
              }
            }
          }
        });
        organizationId = defaultOrg.id;
      }
      
      // Check if client exists, if not create one
      let clientId = req.body.clientId || userId;
      const clientExists = await prisma.user.findUnique({
        where: { id: clientId }
      });
      
      if (!clientExists) {
        clientId = userId; // Use current user as client if specified client doesn't exist
      }
      
      // Prepare project data with required fields
      const projectData: any = {
        name: req.body.name,
        description: req.body.description || '',
        status: req.body.status?.toUpperCase() || 'PLANNING',
        priority: req.body.priority?.toUpperCase() || 'MEDIUM',
        
        // Required dates - use provided or default to current date and 3 months later
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        endDate: req.body.endDate ? new Date(req.body.endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        
        // Financial fields
        estimatedBudget: req.body.budget ? parseFloat(req.body.budget) : null,
        
        // Location fields
        siteAddress: req.body.address || '',
        siteCity: req.body.city || 'Kuala Lumpur',
        siteState: req.body.state || 'Wilayah Persekutuan',
        siteCountry: req.body.country || 'Malaysia',
        
        // Project type (if provided)
        type: req.body.type || null,
        
        // Relations
        organizationId: organizationId,
        clientId: clientId
      };
      
      // Create project
      const project = await prisma.project.create({
        data: projectData,
      });
      
      res.status(201).json({ success: true, data: { project } });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project', details: error });
    }
  }

  static async updateProject(req: Request, res: Response) {
    try {
      // Convert status and priority to uppercase for Prisma enum
      const data = { ...req.body };
      if (data.status) {
        data.status = data.status.toUpperCase().replace('_', '_');
      }
      if (data.priority) {
        data.priority = data.priority.toUpperCase();
      }
      
      const project = await prisma.project.update({
        where: { id: req.params.id },
        data,
      });
      
      res.json({ success: true, data: { project } });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }

  static async deleteProject(req: Request, res: Response) {
    try {
      await prisma.project.delete({
        where: { id: req.params.id },
      });
      
      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }

  static async searchProjects(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: q as string, mode: 'insensitive' } },
            { description: { contains: q as string, mode: 'insensitive' } },
          ]
        },
        take: 10
      });
      
      res.json({ success: true, data: { projects } });
    } catch (error) {
      console.error('Error searching projects:', error);
      res.status(500).json({ error: 'Failed to search projects' });
    }
  }

  static async getDashboardStatistics(req: Request, res: Response) {
    try {
      const totalProjects = await prisma.project.count();
      const activeProjects = await prisma.project.count({
        where: { status: 'IN_PROGRESS' }
      });
      const completedProjects = await prisma.project.count({
        where: { status: 'COMPLETED' }
      });
      
      res.json({
        success: true,
        data: {
          totalProjects,
          activeProjects,
          completedProjects
        }
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }

  static async getProjectTeam(req: Request, res: Response) {
    try {
      res.json({ success: true, data: { team: [] } });
    } catch (error) {
      console.error('Error fetching project team:', error);
      res.status(500).json({ error: 'Failed to fetch project team' });
    }
  }

  static async getProjectStatistics(req: Request, res: Response) {
    try {
      res.json({ success: true, data: { statistics: {} } });
    } catch (error) {
      console.error('Error fetching project statistics:', error);
      res.status(500).json({ error: 'Failed to fetch project statistics' });
    }
  }

  static async updateProjectProgress(req: Request, res: Response) {
    try {
      res.json({ success: true, message: 'Progress updated' });
    } catch (error) {
      console.error('Error updating project progress:', error);
      res.status(500).json({ error: 'Failed to update project progress' });
    }
  }
}