import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createVideoRoomSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['meeting', 'standup', 'casual', 'presentation']),
  maxParticipants: z.number().min(2).max(100).default(10),
  description: z.string().optional(),
  scheduledAt: z.string().optional()
});

// Get all video rooms
router.get('/rooms', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const organizationId = (req as any).user.organizationId;

    // Mock video rooms
    const mockRooms = [
      {
        id: 'video-1',
        name: 'Daily Standup',
        type: 'standup',
        participants: [],
        isActive: false,
        maxParticipants: 10,
        host: userId,
        createdAt: new Date()
      },
      {
        id: 'video-2',
        name: 'Design Review',
        type: 'meeting',
        participants: ['user-1', 'user-2'],
        isActive: true,
        maxParticipants: 20,
        host: 'user-1',
        startTime: new Date(Date.now() - 1800000),
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 'video-3',
        name: 'Coffee Break',
        type: 'casual',
        participants: [],
        isActive: false,
        maxParticipants: 5,
        host: userId,
        createdAt: new Date(Date.now() - 7200000)
      }
    ];

    res.json({
      success: true,
      data: mockRooms
    });
  } catch (error) {
    console.error('Error fetching video rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch video rooms'
    });
  }
});

// Create a video room
router.post('/rooms', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = createVideoRoomSchema.parse(req.body);

    const newRoom = {
      id: `video-${Date.now()}`,
      ...validatedData,
      participants: [],
      isActive: false,
      host: userId,
      createdAt: new Date(),
      createdBy: userId
    };

    res.json({
      success: true,
      data: newRoom
    });
  } catch (error) {
    console.error('Error creating video room:', error);
    res.status(500).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Failed to create video room'
    });
  }
});

// Join a video room
router.post('/rooms/:roomId/join', authenticate, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = (req as any).user.id;

    // Generate WebRTC credentials
    // In production, you would use a service like Twilio, Agora, or Daily.co
    const webrtcConfig = {
      token: `token-${userId}-${roomId}-${Date.now()}`,
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302'
        },
        // Add TURN servers for production
      ],
      roomId,
      userId
    };

    res.json({
      success: true,
      data: webrtcConfig
    });
  } catch (error) {
    console.error('Error joining video room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join video room'
    });
  }
});

// Leave a video room
router.post('/rooms/:roomId/leave', authenticate, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = (req as any).user.id;

    // Update room participants

    res.json({
      success: true,
      message: 'Left video room successfully'
    });
  } catch (error) {
    console.error('Error leaving video room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave video room'
    });
  }
});

// Get room participants
router.get('/rooms/:roomId/participants', authenticate, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    // Mock participants
    const participants = [
      {
        id: 'user-1',
        name: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        joinedAt: new Date(Date.now() - 600000)
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        isMuted: true,
        isCameraOff: false,
        isScreenSharing: false,
        joinedAt: new Date(Date.now() - 300000)
      }
    ];

    res.json({
      success: true,
      data: participants
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch participants'
    });
  }
});

export default router;