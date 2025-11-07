import { Router } from 'express';
import { prisma } from '../server';
import { authenticateMultiTenant } from '../middleware/multi-tenant-auth';

const router = Router();

// Get meetings
router.get('/', authenticateMultiTenant, async (req, res) => {
  try {
    const { organizationId, userId } = req as any;
    const { startDate, endDate, projectId } = req.query;

    const where: any = { organizationId };
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }
    
    if (projectId) {
      where.projectId = projectId;
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    // Format organizer names
    const formattedMeetings = meetings.map(meeting => ({
      ...meeting,
      organizer: meeting.organizer ? {
        ...meeting.organizer,
        name: meeting.organizer.name || `${meeting.organizer.firstName} ${meeting.organizer.lastName}`
      } : null,
      participants: meeting.participants.map(p => ({
        ...p,
        user: p.user ? {
          ...p.user,
          name: p.user.name || `${p.user.firstName} ${p.user.lastName}`
        } : null
      }))
    }));

    res.json({ success: true, data: formattedMeetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get single meeting
router.get('/:id', authenticateMultiTenant, async (req, res) => {
  try {
    const { organizationId } = req as any;
    const { id } = req.params;

    const meeting = await prisma.meeting.findFirst({
      where: { id, organizationId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        project: true
      }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ success: true, data: meeting });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// Create meeting
router.post('/', authenticateMultiTenant, async (req, res) => {
  try {
    const { organizationId, userId } = req as any;
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      meetingUrl, 
      projectId,
      type = 'INTERNAL',
      participants = []
    } = req.body;

    const meeting = await prisma.meeting.create({
      data: {
        organizationId,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        meetingUrl,
        projectId,
        type,
        organizerId: userId,
        status: 'SCHEDULED'
      }
    });

    // Add participants
    if (participants.length > 0) {
      await prisma.meetingParticipant.createMany({
        data: participants.map((userId: string) => ({
          meetingId: meeting.id,
          userId,
          role: 'ATTENDEE',
          status: 'PENDING'
        }))
      });
    }

    // Fetch complete meeting data
    const completeMeeting = await prisma.meeting.findUnique({
      where: { id: meeting.id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    res.json({ success: true, data: completeMeeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Update meeting
router.patch('/:id', authenticateMultiTenant, async (req, res) => {
  try {
    const { organizationId } = req as any;
    const { id } = req.params;
    const updates = req.body;

    // Convert date strings to Date objects if present
    if (updates.startTime) updates.startTime = new Date(updates.startTime);
    if (updates.endTime) updates.endTime = new Date(updates.endTime);

    const meeting = await prisma.meeting.update({
      where: { id },
      data: updates,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    res.json({ success: true, data: meeting });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// Delete meeting
router.delete('/:id', authenticateMultiTenant, async (req, res) => {
  try {
    const { organizationId } = req as any;
    const { id } = req.params;

    await prisma.meeting.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Add participant
router.post('/:id/participants', authenticateMultiTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'ATTENDEE' } = req.body;

    const participant = await prisma.meetingParticipant.create({
      data: {
        meetingId: id,
        userId,
        role,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json({ success: true, data: participant });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// Remove participant
router.delete('/:id/participants/:userId', authenticateMultiTenant, async (req, res) => {
  try {
    const { id, userId } = req.params;

    await prisma.meetingParticipant.delete({
      where: {
        meetingId_userId: {
          meetingId: id,
          userId
        }
      }
    });

    res.json({ success: true, message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// Update participant status
router.patch('/:id/participants/:userId', authenticateMultiTenant, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { status } = req.body;

    const participant = await prisma.meetingParticipant.update({
      where: {
        meetingId_userId: {
          meetingId: id,
          userId
        }
      },
      data: { status }
    });

    res.json({ success: true, data: participant });
  } catch (error) {
    console.error('Error updating participant status:', error);
    res.status(500).json({ error: 'Failed to update participant status' });
  }
});

export default router;