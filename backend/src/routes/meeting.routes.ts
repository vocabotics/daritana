import { Router } from 'express'
import { body, query, param } from 'express-validator'
import { authenticate } from '../middleware/auth'
import { validationResult } from 'express-validator'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() })
  }
  next()
}

// All routes require authentication
router.use(authenticate)

// Get meetings
router.get('/', [
  query('projectId').optional().isUUID(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate
], async (req: any, res: any) => {
  try {
    const { projectId, startDate, endDate, status, limit = 20, offset = 0 } = req.query
    const organizationId = req.user.organizationId

    const where: any = { organizationId }
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    
    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) where.startTime.gte = new Date(startDate)
      if (endDate) where.startTime.lte = new Date(endDate)
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { startTime: 'asc' },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true
                }
              }
            }
          }
        }
      }),
      prisma.meeting.count({ where })
    ])

    res.json({
      success: true,
      meetings,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meetings',
      message: error.message
    })
  }
})

// Get meeting by ID
router.get('/:id', [
  param('id').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const organizationId = req.user.organizationId

    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        organizer: true,
        project: true,
        participants: {
          include: {
            user: true
          }
        },
        agenda: true,
        minutes: true
      }
    })

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      })
    }

    res.json({
      success: true,
      meeting
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meeting',
      message: error.message
    })
  }
})

// Create meeting
router.post('/', [
  body('title').notEmpty(),
  body('startTime').isISO8601(),
  body('endTime').isISO8601(),
  body('projectId').optional().isUUID(),
  body('location').optional(),
  body('description').optional(),
  body('agenda').optional().isArray(),
  body('participants').optional().isArray(),
  body('isRecurring').optional().isBoolean(),
  body('recurringPattern').optional(),
  validate
], async (req: any, res: any) => {
  try {
    const organizationId = req.user.organizationId
    const organizerId = req.user.id
    const { participants, agenda, ...meetingData } = req.body

    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        ...meetingData,
        organizationId,
        organizerId,
        status: 'SCHEDULED'
      }
    })

    // Add participants
    if (participants && participants.length > 0) {
      await prisma.meetingParticipant.createMany({
        data: participants.map((userId: string) => ({
          meetingId: meeting.id,
          userId,
          status: 'INVITED'
        }))
      })
    }

    // Add agenda items
    if (agenda && agenda.length > 0) {
      await prisma.meetingAgenda.createMany({
        data: agenda.map((item: any, index: number) => ({
          meetingId: meeting.id,
          title: item.title,
          description: item.description,
          duration: item.duration,
          order: index
        }))
      })
    }

    // Send notifications to participants
    if (participants) {
      for (const userId of participants) {
        await prisma.notification.create({
          data: {
            userId,
            organizationId,
            type: 'MEETING',
            title: 'New Meeting Invitation',
            message: `You've been invited to: ${meetingData.title}`,
            metadata: { meetingId: meeting.id },
            status: 'UNREAD'
          }
        })
      }
    }

    const fullMeeting = await prisma.meeting.findUnique({
      where: { id: meeting.id },
      include: {
        organizer: true,
        participants: {
          include: { user: true }
        },
        agenda: true
      }
    })

    res.status(201).json({
      success: true,
      meeting: fullMeeting
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to create meeting',
      message: error.message
    })
  }
})

// Update meeting
router.put('/:id', [
  param('id').isUUID(),
  body('title').optional(),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('location').optional(),
  body('description').optional(),
  body('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const organizationId = req.user.organizationId

    // Check if meeting exists
    const existing = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      })
    }

    const meeting = await prisma.meeting.update({
      where: { id },
      data: req.body,
      include: {
        organizer: true,
        participants: {
          include: { user: true }
        }
      }
    })

    res.json({
      success: true,
      meeting
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update meeting',
      message: error.message
    })
  }
})

// Add participant to meeting
router.post('/:id/participants', [
  param('id').isUUID(),
  body('userId').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { userId } = req.body
    const organizationId = req.user.organizationId

    // Check if meeting exists
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      })
    }

    // Check if already participant
    const existing = await prisma.meetingParticipant.findFirst({
      where: {
        meetingId: id,
        userId
      }
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'User is already a participant'
      })
    }

    const participant = await prisma.meetingParticipant.create({
      data: {
        meetingId: id,
        userId,
        status: 'INVITED'
      },
      include: {
        user: true
      }
    })

    res.status(201).json({
      success: true,
      participant
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to add participant',
      message: error.message
    })
  }
})

// Update participant status (accept/decline)
router.put('/:id/participants/:userId', [
  param('id').isUUID(),
  param('userId').isUUID(),
  body('status').isIn(['ACCEPTED', 'DECLINED', 'TENTATIVE']),
  validate
], async (req: any, res: any) => {
  try {
    const { id, userId } = req.params
    const { status } = req.body

    const participant = await prisma.meetingParticipant.updateMany({
      where: {
        meetingId: id,
        userId
      },
      data: { status }
    })

    res.json({
      success: true,
      message: 'Participant status updated'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update participant status',
      message: error.message
    })
  }
})

// Add meeting minutes
router.post('/:id/minutes', [
  param('id').isUUID(),
  body('content').notEmpty(),
  body('decisions').optional().isArray(),
  body('actionItems').optional().isArray(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { content, decisions, actionItems } = req.body
    const organizationId = req.user.organizationId
    const recordedBy = req.user.id

    // Check if meeting exists
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      })
    }

    const minutes = await prisma.meetingMinutes.create({
      data: {
        meetingId: id,
        content,
        decisions: decisions || [],
        actionItems: actionItems || [],
        recordedBy
      }
    })

    // Update meeting status
    await prisma.meeting.update({
      where: { id },
      data: { status: 'COMPLETED' }
    })

    res.status(201).json({
      success: true,
      minutes
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to add meeting minutes',
      message: error.message
    })
  }
})

// Delete meeting
router.delete('/:id', [
  param('id').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const organizationId = req.user.organizationId

    // Check if meeting exists
    const existing = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      })
    }

    // Delete related records first
    await prisma.meetingParticipant.deleteMany({
      where: { meetingId: id }
    })

    await prisma.meetingAgenda.deleteMany({
      where: { meetingId: id }
    })

    await prisma.meetingMinutes.deleteMany({
      where: { meetingId: id }
    })

    // Delete meeting
    await prisma.meeting.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete meeting',
      message: error.message
    })
  }
})

// Get upcoming meetings for user
router.get('/my/upcoming', async (req: any, res: any) => {
  try {
    const userId = req.user.id
    const organizationId = req.user.organizationId

    const meetings = await prisma.meeting.findMany({
      where: {
        organizationId,
        startTime: {
          gte: new Date()
        },
        OR: [
          { organizerId: userId },
          {
            participants: {
              some: {
                userId,
                status: { not: 'DECLINED' }
              }
            }
          }
        ]
      },
      take: 10,
      orderBy: { startTime: 'asc' },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    res.json({
      success: true,
      meetings
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming meetings',
      message: error.message
    })
  }
})

export default router