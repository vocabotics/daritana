import { Router } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Get all tasks with pagination and filtering
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      sortBy = 'createdAt', 
      sortOrder = 'DESC',
      status,
      priority,
      projectId,
      assignedToId
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    // Get tasks
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'ASC' ? 'asc' : 'desc'
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single task
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        assignedTo: true,
        createdBy: true,
        subtasks: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        attachments: true
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task
router.post('/', async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional().default(''),
      status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED']).optional().default('TODO'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
      projectId: z.string().optional(),
      assignedToId: z.string().optional(),
      dueDate: z.string().optional(),
      estimatedHours: z.number().optional().default(0),
      tags: z.array(z.string()).optional().default([])
    });

    const data = schema.parse(req.body);

    // Get user's organization from their membership
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!user?.organizationMemberships[0]) {
      return res.status(403).json({ error: 'No active organization membership' });
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        createdById: req.user!.id,
        organizationId: user.organizationMemberships[0].organizationId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      assignedToId: z.string().nullable().optional(),
      dueDate: z.string().nullable().optional(),
      estimatedHours: z.number().nullable().optional(),
      actualHours: z.number().nullable().optional(),
      tags: z.array(z.string()).optional()
    });

    const data = schema.parse(req.body);

    // Check if user has permission to update
    const existingTask = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;