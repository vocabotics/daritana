import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../server';

interface VirtualOfficeSocket extends Socket {
  userId?: string;
  userName?: string;
  userEmail?: string;
  currentRoom?: string;
}

// Simple in-memory state management
class VirtualOfficeManager {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private userPresence: Map<string, any> = new Map(); // userId -> presence data
  private rooms: Map<string, Set<string>> = new Map(); // roomId -> Set of userIds
  private messages: Map<string, any[]> = new Map(); // roomId -> messages

  constructor(io: SocketIOServer) {
    this.io = io;
    this.initializeDefaultRooms();
  }

  private initializeDefaultRooms() {
    // Create default rooms
    const defaultRooms = [
      'main-office',
      'design-studio',
      'meeting-room-1',
      'coffee-lounge',
      'quiet-zone'
    ];

    defaultRooms.forEach(roomId => {
      this.rooms.set(roomId, new Set());
      this.messages.set(roomId, []);
    });
  }

  async handleConnection(socket: VirtualOfficeSocket) {
    const userId = socket.userId!;
    console.log(`[Virtual Office] User ${socket.userName} (${userId}) connected`);

    // Store socket mapping
    this.userSockets.set(userId, socket.id);

    // Get user details from database
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          avatar: true,
          position: true,
          department: true,
          role: true
        }
      });

      if (!dbUser) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // Create simple presence data
      const presence = {
        id: userId,
        name: dbUser.name || `${dbUser.firstName} ${dbUser.lastName}` || dbUser.email,
        email: dbUser.email,
        avatar: dbUser.avatar,
        role: dbUser.position || dbUser.role,
        department: dbUser.department || 'General',
        status: 'online',
        currentRoom: 'main-office',
        lastSeen: new Date()
      };

      // Store presence
      this.userPresence.set(userId, presence);

      // Join default room
      socket.join('room:main-office');
      socket.currentRoom = 'main-office';
      const mainOfficeUsers = this.rooms.get('main-office') || new Set();
      mainOfficeUsers.add(userId);

      // Get all team members from the same organization
      const orgMembers = await this.getTeamMembers(userId);

      // Send initial state to the connected user
      socket.emit('virtual-office:connected', {
        currentUser: presence,
        rooms: this.getRoomsList(),
        teamMembers: orgMembers,
        onlineUsers: Array.from(this.userPresence.values()),
        currentRoom: 'main-office',
        messages: this.messages.get('main-office') || []
      });

      // Notify others
      socket.broadcast.emit('virtual-office:user-joined', presence);

      // Setup event handlers
      this.setupEventHandlers(socket);

    } catch (error) {
      console.error('[Virtual Office] Error setting up user:', error);
      socket.emit('error', { message: 'Failed to initialize virtual office' });
    }
  }

  private setupEventHandlers(socket: VirtualOfficeSocket) {
    const userId = socket.userId!;

    // Change room
    socket.on('virtual-office:change-room', (newRoomId: string) => {
      const oldRoom = socket.currentRoom;
      
      if (oldRoom) {
        socket.leave(`room:${oldRoom}`);
        const oldRoomUsers = this.rooms.get(oldRoom);
        if (oldRoomUsers) {
          oldRoomUsers.delete(userId);
        }
        socket.to(`room:${oldRoom}`).emit('virtual-office:user-left-room', {
          userId,
          roomId: oldRoom
        });
      }

      socket.join(`room:${newRoomId}`);
      socket.currentRoom = newRoomId;
      const newRoomUsers = this.rooms.get(newRoomId) || new Set();
      newRoomUsers.add(userId);
      this.rooms.set(newRoomId, newRoomUsers);

      const presence = this.userPresence.get(userId);
      if (presence) {
        presence.currentRoom = newRoomId;
      }

      // Get room members
      const roomMembers = Array.from(newRoomUsers).map(id => this.userPresence.get(id)).filter(Boolean);
      
      socket.emit('virtual-office:room-changed', {
        roomId: newRoomId,
        members: roomMembers,
        messages: this.messages.get(newRoomId) || []
      });

      socket.to(`room:${newRoomId}`).emit('virtual-office:user-entered-room', {
        userId,
        userName: socket.userName,
        roomId: newRoomId
      });
    });

    // Update status
    socket.on('virtual-office:update-status', (data: { status: string; activity?: string }) => {
      const presence = this.userPresence.get(userId);
      if (presence) {
        presence.status = data.status;
        if (data.activity) presence.activity = data.activity;
        presence.lastSeen = new Date();

        this.io.emit('virtual-office:presence-updated', {
          userId,
          ...data
        });
      }
    });

    // Send message
    socket.on('virtual-office:send-message', (data: { content: string; roomId?: string }) => {
      const roomId = data.roomId || socket.currentRoom || 'main-office';
      const presence = this.userPresence.get(userId);
      
      if (!presence) return;

      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        senderId: userId,
        senderName: presence.name,
        senderAvatar: presence.avatar,
        content: data.content,
        roomId,
        timestamp: new Date(),
        type: 'text'
      };

      // Store message
      const roomMessages = this.messages.get(roomId) || [];
      roomMessages.push(message);
      if (roomMessages.length > 100) {
        roomMessages.shift(); // Keep only last 100 messages
      }
      this.messages.set(roomId, roomMessages);

      // Broadcast to room
      this.io.to(`room:${roomId}`).emit('virtual-office:new-message', message);
    });

    // Typing indicator
    socket.on('virtual-office:typing', (isTyping: boolean) => {
      const roomId = socket.currentRoom;
      if (roomId) {
        socket.to(`room:${roomId}`).emit('virtual-office:typing-indicator', {
          userId,
          userName: socket.userName,
          isTyping
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Virtual Office] User ${socket.userName} disconnected`);
      
      // Remove from current room
      if (socket.currentRoom) {
        const roomUsers = this.rooms.get(socket.currentRoom);
        if (roomUsers) {
          roomUsers.delete(userId);
        }
      }

      // Update presence
      const presence = this.userPresence.get(userId);
      if (presence) {
        presence.status = 'offline';
        presence.lastSeen = new Date();
      }

      // Remove socket mapping
      this.userSockets.delete(userId);

      // Notify others
      socket.broadcast.emit('virtual-office:user-disconnected', {
        userId,
        lastSeen: new Date()
      });
    });
  }

  private async getTeamMembers(userId: string) {
    try {
      // Get user's organization
      const userOrg = await prisma.organizationMember.findFirst({
        where: { userId, isActive: true },
        include: {
          organization: {
            include: {
              members: {
                where: { isActive: true },
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      name: true,
                      firstName: true,
                      lastName: true,
                      avatar: true,
                      position: true,
                      department: true,
                      role: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!userOrg) return [];

      return userOrg.organization.members.map(member => ({
        id: member.user.id,
        name: member.user.name || `${member.user.firstName} ${member.user.lastName}` || member.user.email,
        email: member.user.email,
        avatar: member.user.avatar,
        role: member.user.position || member.role,
        department: member.user.department || 'General',
        status: this.userPresence.has(member.user.id) ? 
          this.userPresence.get(member.user.id).status : 'offline'
      }));
    } catch (error) {
      console.error('[Virtual Office] Error getting team members:', error);
      return [];
    }
  }

  private getRoomsList() {
    return [
      {
        id: 'main-office',
        name: 'Main Office',
        type: 'office',
        occupants: Array.from(this.rooms.get('main-office') || [])
      },
      {
        id: 'design-studio',
        name: 'Design Studio',
        type: 'studio',
        occupants: Array.from(this.rooms.get('design-studio') || [])
      },
      {
        id: 'meeting-room-1',
        name: 'Meeting Room 1',
        type: 'meeting',
        occupants: Array.from(this.rooms.get('meeting-room-1') || [])
      },
      {
        id: 'coffee-lounge',
        name: 'Coffee Lounge',
        type: 'lounge',
        occupants: Array.from(this.rooms.get('coffee-lounge') || [])
      },
      {
        id: 'quiet-zone',
        name: 'Quiet Zone',
        type: 'office',
        occupants: Array.from(this.rooms.get('quiet-zone') || [])
      }
    ];
  }

  getCurrentState() {
    return {
      rooms: this.getRoomsList(),
      onlineUsers: Array.from(this.userPresence.values()),
      totalUsers: this.userPresence.size,
      messages: {
        total: Array.from(this.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0)
      }
    };
  }
}

export function setupVirtualOfficeSimple(io: SocketIOServer) {
  const manager = new VirtualOfficeManager(io);

  // Add middleware for authentication
  io.use(async (socket: VirtualOfficeSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      socket.userId = decoded.userId;
      socket.userName = decoded.username || decoded.email;
      socket.userEmail = decoded.email;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Handle connections
  io.on('connection', async (socket: VirtualOfficeSocket) => {
    // Only handle virtual office events if user is authenticated
    if (socket.userId) {
      await manager.handleConnection(socket);
    }
  });

  return manager;
}