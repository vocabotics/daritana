import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Global search endpoint
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, type } = req.query;
    const query = (q as string)?.toLowerCase() || '';
    const userId = req.user?.id;

    if (!query || query.length < 2) {
      return res.json({
        projects: [],
        tasks: [],
        users: [],
        documents: [],
        total: 0
      });
    }

    // Get user's organization membership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true }
    });

    if (!membership) {
      return res.status(403).json({ error: 'No organization membership found' });
    }

    const organizationId = membership.organizationId;

    // Perform searches based on type or all if no type specified
    const results: any = {
      projects: [],
      tasks: [],
      users: [],
      documents: [],
      total: 0
    };

    // Search projects
    if (!type || type === 'projects') {
      const projects = await prisma.project.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
            { type: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          client: true,
          createdBy: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          }
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
      });
      results.projects = projects;
    }

    // Search tasks
    if (!type || type === 'tasks') {
      const tasks = await prisma.task.findMany({
        where: {
          project: {
            organizationId
          },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          }
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
      });
      results.tasks = tasks;
    }

    // Search users in the same organization
    if (!type || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          organizationMembers: {
            some: {
              organizationId
            }
          },
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { profile: {
              is: {
                OR: [
                  { firstName: { contains: query, mode: 'insensitive' } },
                  { lastName: { contains: query, mode: 'insensitive' } }
                ]
              }
            }}
          ]
        },
        select: {
          id: true,
          email: true,
          profile: true,
          organizationMembers: {
            where: { organizationId },
            select: {
              role: true
            }
          }
        },
        take: 10
      });
      results.users = users;
    }

    // Search documents
    if (!type || type === 'documents') {
      const documents = await prisma.document.findMany({
        where: {
          project: {
            organizationId
          },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          uploadedBy: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      results.documents = documents;
    }

    // Calculate total results
    results.total = 
      results.projects.length + 
      results.tasks.length + 
      results.users.length + 
      results.documents.length;

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search suggestions endpoint
router.get('/search/suggestions', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const query = (q as string)?.toLowerCase() || '';
    const userId = req.user?.id;

    if (!query || query.length < 2) {
      return res.json([]);
    }

    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true }
    });

    if (!membership) {
      return res.status(403).json({ error: 'No organization membership found' });
    }

    const organizationId = membership.organizationId;

    // Get quick suggestions from projects and tasks
    const projectSuggestions = await prisma.project.findMany({
      where: {
        organizationId,
        name: { contains: query, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true
      },
      take: 5
    });

    const taskSuggestions = await prisma.task.findMany({
      where: {
        project: {
          organizationId
        },
        title: { contains: query, mode: 'insensitive' }
      },
      select: {
        id: true,
        title: true
      },
      take: 5
    });

    const suggestions = [
      ...projectSuggestions.map(p => ({
        type: 'project',
        id: p.id,
        text: p.name,
        icon: 'folder'
      })),
      ...taskSuggestions.map(t => ({
        type: 'task',
        id: t.id,
        text: t.title,
        icon: 'check-square'
      }))
    ];

    res.json(suggestions);
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

export default router;