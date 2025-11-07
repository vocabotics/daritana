import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const createReviewSchema = z.object({
  documentId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
});

const updateReviewSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  endTime: z.string().datetime().optional(),
});

// Get all reviews
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { documentId, status, participantId } = req.query;

    const reviews = await prisma.review.findMany({
      where: {
        ...(documentId && { documentId: documentId as string }),
        ...(status && { status: status as any }),
        ...(participantId && {
          participants: {
            some: { userId: participantId as string },
          },
        }),
      },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
            decisions: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single review
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        document: true,
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 100, // Last 100 messages
        },
        decisions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create review
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createReviewSchema.parse(req.body);

    // Verify document exists
    const document = await prisma.document.findUnique({
      where: { id: data.documentId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const review = await prisma.review.create({
      data: {
        documentId: data.documentId,
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        createdBy: req.user!.id,
        status: 'SCHEDULED',
      },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Add creator as owner participant
    await prisma.reviewParticipant.create({
      data: {
        reviewId: review.id,
        userId: req.user!.id,
        role: 'OWNER',
      },
    });

    res.status(201).json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update review
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const data = updateReviewSchema.parse(req.body);

    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check permission (only creator or admin can update)
    if (review.createdBy !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        ...data,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start review session
router.post('/:id/start', async (req: AuthRequest, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        participants: {
          where: { userId: req.user!.id },
        },
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user is a participant
    if (review.participants.length === 0) {
      return res.status(403).json({ error: 'Not a participant in this review' });
    }

    // Check if user has permission to start (owner or reviewer)
    const participant = review.participants[0];
    if (participant.role !== 'OWNER' && participant.role !== 'REVIEWER') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        status: 'ACTIVE',
        startTime: new Date(),
      },
    });

    // Create system message
    await prisma.message.create({
      data: {
        reviewId: req.params.id,
        userId: req.user!.id,
        type: 'SYSTEM',
        content: `Review session started by ${req.user!.username}`,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Start review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End review session
router.post('/:id/end', async (req: AuthRequest, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        participants: {
          where: { userId: req.user!.id },
        },
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check permission
    const participant = review.participants[0];
    if (!participant || (participant.role !== 'OWNER' && participant.role !== 'REVIEWER')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
      },
    });

    // Mark all participants as inactive
    await prisma.reviewParticipant.updateMany({
      where: { reviewId: req.params.id },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    // Create system message
    await prisma.message.create({
      data: {
        reviewId: req.params.id,
        userId: req.user!.id,
        type: 'SYSTEM',
        content: `Review session ended by ${req.user!.username}`,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('End review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add participant to review
router.post('/:id/participants', async (req: AuthRequest, res) => {
  try {
    const { userId, role = 'VIEWER' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check permission (only creator or admin)
    if (review.createdBy !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Check if already participant
    const existing = await prisma.reviewParticipant.findFirst({
      where: {
        reviewId: req.params.id,
        userId,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'User already a participant' });
    }

    const participant = await prisma.reviewParticipant.create({
      data: {
        reviewId: req.params.id,
        userId,
        role: role as any,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(participant);
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record decision
router.post('/:id/decisions', async (req: AuthRequest, res) => {
  try {
    const { type, description } = req.body;

    if (!type || !description) {
      return res.status(400).json({ error: 'Type and description required' });
    }

    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        participants: {
          where: { userId: req.user!.id },
        },
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user is a participant with appropriate role
    const participant = review.participants[0];
    if (!participant || participant.role === 'VIEWER') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const decision = await prisma.decision.create({
      data: {
        reviewId: req.params.id,
        type,
        description,
        madeBy: req.user!.id,
      },
    });

    // Create system message about the decision
    await prisma.message.create({
      data: {
        reviewId: req.params.id,
        userId: req.user!.id,
        type: 'SYSTEM',
        content: `Decision recorded: ${type} - ${description}`,
      },
    });

    res.status(201).json(decision);
  } catch (error) {
    console.error('Record decision error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;