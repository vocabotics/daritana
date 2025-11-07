import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['direct', 'group', 'project', 'department']),
  participants: z.array(z.string()),
  description: z.string().optional(),
  projectId: z.string().optional()
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'file', 'video', 'audio']).default('text'),
  attachments: z.array(z.any()).optional(),
  replyTo: z.string().optional()
});

// Get all chat rooms for the user
router.get('/rooms', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const organizationId = (req as any).user.organizationId;

    // For now, return mock data since we don't have a ChatRoom model yet
    const mockRooms = [
      {
        id: 'room-1',
        name: 'General Discussion',
        type: 'group',
        participants: [userId],
        lastMessage: {
          id: 'msg-1',
          senderId: userId,
          senderName: 'Current User',
          content: 'Welcome to the chat!',
          timestamp: new Date(),
          type: 'text'
        },
        unreadCount: 0,
        isPinned: false,
        createdAt: new Date()
      },
      {
        id: 'room-2',
        name: 'Project Updates',
        type: 'project',
        participants: [userId],
        lastMessage: {
          id: 'msg-2',
          senderId: userId,
          senderName: 'Current User',
          content: 'Project milestone completed',
          timestamp: new Date(Date.now() - 3600000),
          type: 'text'
        },
        unreadCount: 3,
        isPinned: true,
        createdAt: new Date(Date.now() - 86400000)
      }
    ];

    res.json({
      success: true,
      data: mockRooms
    });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat rooms'
    });
  }
});

// Create a new chat room
router.post('/rooms', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const organizationId = (req as any).user.organizationId;
    
    const validatedData = createRoomSchema.parse(req.body);

    // For now, return mock created room
    const newRoom = {
      id: `room-${Date.now()}`,
      ...validatedData,
      participants: [...validatedData.participants, userId],
      unreadCount: 0,
      isPinned: false,
      createdAt: new Date(),
      createdBy: userId
    };

    res.json({
      success: true,
      data: newRoom
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Failed to create chat room'
    });
  }
});

// Get messages for a room
router.get('/rooms/:roomId/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = (req as any).user.id;

    // Mock messages for now
    const mockMessages = [
      {
        id: 'msg-1',
        roomId,
        senderId: userId,
        senderName: 'Current User',
        content: 'Hello everyone!',
        timestamp: new Date(Date.now() - 7200000),
        type: 'text'
      },
      {
        id: 'msg-2',
        roomId,
        senderId: 'user-2',
        senderName: 'Team Member',
        senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        content: 'Hi! How\'s the project going?',
        timestamp: new Date(Date.now() - 6000000),
        type: 'text'
      },
      {
        id: 'msg-3',
        roomId,
        senderId: userId,
        senderName: 'Current User',
        content: 'Making good progress. Just finished the design phase.',
        timestamp: new Date(Date.now() - 5400000),
        type: 'text'
      },
      {
        id: 'msg-4',
        roomId,
        senderId: 'user-3',
        senderName: 'Project Manager',
        senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        content: 'Excellent! Please share the designs when ready.',
        timestamp: new Date(Date.now() - 4800000),
        type: 'text'
      },
      {
        id: 'msg-5',
        roomId,
        senderId: userId,
        senderName: 'Current User',
        content: 'Will do! I\'ll upload them to the project folder.',
        timestamp: new Date(Date.now() - 3600000),
        type: 'text'
      }
    ];

    res.json({
      success: true,
      data: mockMessages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// Send a message
router.post('/rooms/:roomId/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = (req as any).user.id;
    const user = (req as any).user;
    
    const validatedData = sendMessageSchema.parse(req.body);

    const newMessage = {
      id: `msg-${Date.now()}`,
      roomId,
      senderId: userId,
      senderName: user.name || 'Unknown User',
      senderAvatar: user.avatar,
      ...validatedData,
      timestamp: new Date(),
      reactions: {},
      isEdited: false
    };

    // In a real implementation, we would:
    // 1. Save to database
    // 2. Emit via WebSocket to room participants
    // 3. Update last message in room

    res.json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Failed to send message'
    });
  }
});

// Mark messages as read
router.put('/rooms/:roomId/read', authenticate, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = (req as any).user.id;

    // In a real implementation, update read status in database

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
});

// Search messages
router.get('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const { query, roomId, limit = 20 } = req.query;
    const userId = (req as any).user.id;

    // Mock search results
    const results = [];

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search messages'
    });
  }
});

export default router;