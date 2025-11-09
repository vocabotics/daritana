import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all support tickets (admin only)
(router.get as any)('/', authenticate, async (req: any, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. System admin required.'
      });
    }

    const { status, priority, category, companyId, page = 1, limit = 20 } = req.query;
    
    const where: any = {};
    
    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (category && category !== 'all') where.category = category;
    if (companyId) where.companyId = companyId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.supportTicket.count({ where })
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch support tickets'
    });
  }
});

// Get support tickets for a specific organization
(router.get as any)('/organization/:organizationId', authenticate, async (req: any, res: Response) => {
  try {
    const { organizationId } = req.params;
    const user = (req as any).user;
    
    // Users can only access tickets for their own organization unless they're system admin
    if (user.role !== 'SYSTEM_ADMIN' && user.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const { status, priority, category, page = 1, limit = 20 } = req.query;
    
    const where: any = { organizationId };
    
    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (category && category !== 'all') where.category = category;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.supportTicket.count({ where })
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching organization support tickets:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch support tickets'
    });
  }
});

// Get support ticket by ID
(router.get as any)('/:id', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    // Users can only access tickets for their own organization unless they're system admin
    if (user.role !== 'SYSTEM_ADMIN' && user.organizationId !== ticket.organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch support ticket'
    });
  }
});

// Create new support ticket
(router.post as any)('/', authenticate, async (req: any, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      tags
    } = req.body;

    const user = (req as any).user;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    if (!user.organizationId) {
      return res.status(400).json({
        success: false,
        error: 'User must belong to an organization'
      });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        title,
        description,
        category,
        priority: priority || 'medium',
        tags: tags || [],
        status: 'open',
        organizationId: user.organizationId,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create support ticket'
    });
  }
});

// Update support ticket
(router.put as any)('/:id', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = (req as any).user;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    // Users can only update tickets for their own organization unless they're system admin
    if (user.role !== 'SYSTEM_ADMIN' && user.organizationId !== ticket.organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.organizationId;
    delete updates.userId;

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Support ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update support ticket'
    });
  }
});

// Add message to support ticket
(router.post as any)('/:id/messages', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { message, isInternal = false } = req.body;
    const user = (req as any).user;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    // Users can only add messages to tickets for their own organization unless they're system admin
    if (user.role !== 'SYSTEM_ADMIN' && user.organizationId !== ticket.organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const ticketMessage = await prisma.supportTicketMessage.create({
      data: {
        message,
        isInternal,
        ticketId: id,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Update ticket status to 'in_progress' if it was 'open'
    if (ticket.status === 'open') {
      await prisma.supportTicket.update({
        where: { id },
        data: {
          status: 'in_progress',
          updatedAt: new Date()
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      ticketMessage
    });
  } catch (error) {
    console.error('Error adding message to support ticket:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add message'
    });
  }
});

// Assign ticket to support staff
(router.patch as any)('/:id/assign', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;
    const user = (req as any).user;

    if (!assignedToId) {
      return res.status(400).json({
        success: false,
        error: 'Assigned user ID is required'
      });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    // Only system admins can assign tickets
    if (user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. System admin required.'
      });
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: {
        assignedToId,
        updatedAt: new Date()
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error assigning support ticket:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to assign ticket'
    });
  }
});

// Change ticket status
(router.patch as any)('/:id/status', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = (req as any).user;

    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required'
      });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    // Users can only change status of tickets for their own organization unless they're system admin
    if (user.role !== 'SYSTEM_ADMIN' && user.organizationId !== ticket.organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update ticket status'
    });
  }
});

// Delete support ticket (admin only)
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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    // Delete ticket and all related messages in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.supportTicketMessage.deleteMany({
        where: { ticketId: id }
      });

      await tx.supportTicket.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'Support ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete support ticket'
    });
  }
});

// Get support ticket statistics
(router.get as any)('/stats/overview', authenticate, async (req: any, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. System admin required.'
      });
    }

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      avgResponseTime
    ] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'open' } }),
      prisma.supportTicket.count({ where: { status: 'in_progress' } }),
      prisma.supportTicket.count({ where: { status: 'resolved' } }),
      prisma.supportTicket.count({ where: { status: 'closed' } }),
      prisma.supportTicket.count({ where: { priority: 'critical' } }),
      prisma.supportTicket.aggregate({
        _avg: {
          responseTime: true
        }
      })
    ]);

    const stats = {
      total: totalTickets,
      open: openTickets,
      inProgress: inProgressTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
      critical: criticalTickets,
      avgResponseTime: avgResponseTime._avg.responseTime || 0
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching support ticket statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;
