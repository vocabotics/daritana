import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../server';

interface VirtualOfficeSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  currentRoom?: string;
  status?: 'online' | 'busy' | 'meeting' | 'away' | 'offline';
}

interface VirtualRoom {
  id: string;
  name: string;
  type: 'office' | 'lounge' | 'studio' | 'meeting' | 'break' | 'game';
  capacity: number;
  currentOccupants: Set<string>;
  ambientSound?: string;
  backgroundImage?: string;
  isLocked: boolean;
  host?: string;
}

interface TeamMemberPresence {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'online' | 'busy' | 'meeting' | 'away' | 'offline';
  currentActivity?: string;
  location?: 'office' | 'home' | 'site' | 'traveling';
  currentRoom?: string;
  lastSeen: Date;
  mood?: 'productive' | 'focused' | 'creative' | 'collaborative' | 'break';
  department?: string;
  projects?: string[];
}

class VirtualOfficeManager {
  private io: SocketIOServer;
  private rooms: Map<string, VirtualRoom> = new Map();
  private presence: Map<string, TeamMemberPresence> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(io: SocketIOServer) {
    this.io = io;
    this.initializeRooms();
  }

  private initializeRooms() {
    // Create default virtual rooms
    const defaultRooms: VirtualRoom[] = [
      {
        id: 'main-office',
        name: 'Main Office',
        type: 'office',
        capacity: 50,
        currentOccupants: new Set(),
        backgroundImage: '/images/office-main.jpg',
        ambientSound: 'office-chatter',
        isLocked: false
      },
      {
        id: 'design-studio',
        name: 'Design Studio',
        type: 'studio',
        capacity: 20,
        currentOccupants: new Set(),
        backgroundImage: '/images/design-studio.jpg',
        ambientSound: 'creative-music',
        isLocked: false
      },
      {
        id: 'meeting-room-1',
        name: 'Meeting Room 1',
        type: 'meeting',
        capacity: 10,
        currentOccupants: new Set(),
        backgroundImage: '/images/meeting-room.jpg',
        isLocked: false
      },
      {
        id: 'coffee-lounge',
        name: 'Coffee Lounge',
        type: 'lounge',
        capacity: 15,
        currentOccupants: new Set(),
        backgroundImage: '/images/coffee-lounge.jpg',
        ambientSound: 'cafe-ambience',
        isLocked: false
      },
      {
        id: 'quiet-zone',
        name: 'Quiet Zone',
        type: 'office',
        capacity: 10,
        currentOccupants: new Set(),
        backgroundImage: '/images/quiet-zone.jpg',
        ambientSound: 'white-noise',
        isLocked: false
      },
      {
        id: 'game-room',
        name: 'Game Room',
        type: 'game',
        capacity: 8,
        currentOccupants: new Set(),
        backgroundImage: '/images/game-room.jpg',
        ambientSound: 'arcade-sounds',
        isLocked: false
      }
    ];

    defaultRooms.forEach(room => {
      this.rooms.set(room.id, room);
    });
  }

  async handleConnection(socket: VirtualOfficeSocket) {
    const userId = socket.userId!;
    const user = socket.user!;

    // Store socket mapping
    this.userSockets.set(userId, socket.id);

    // Get user details from database
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projectMemberships: {
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        organizationMembers: {
          include: {
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!dbUser) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    // Create presence data
    const presence: TeamMemberPresence = {
      userId,
      name: dbUser.name || `${dbUser.firstName} ${dbUser.lastName}`,
      email: dbUser.email,
      role: dbUser.position || dbUser.role,
      avatar: dbUser.avatar,
      status: 'online',
      currentActivity: 'Just joined',
      location: 'office',
      currentRoom: 'main-office',
      lastSeen: new Date(),
      mood: 'productive',
      department: dbUser.department || 'General',
      projects: dbUser.projectMemberships?.map(pm => pm.project.name) || []
    };

    // Store presence
    this.presence.set(userId, presence);

    // Join default room
    await this.joinRoom(socket, 'main-office');

    // Send initial data to the user
    socket.emit('virtual-office:init', {
      rooms: Array.from(this.rooms.values()).map(room => ({
        ...room,
        currentOccupants: Array.from(room.currentOccupants)
      })),
      presence: Array.from(this.presence.values()),
      currentRoom: 'main-office'
    });

    // Notify others of new presence
    socket.broadcast.emit('virtual-office:user-joined', presence);

    // Setup event handlers
    this.setupEventHandlers(socket);
  }

  private setupEventHandlers(socket: VirtualOfficeSocket) {
    // Change room
    socket.on('virtual-office:change-room', async (roomId: string) => {
      await this.changeRoom(socket, roomId);
    });

    // Update status
    socket.on('virtual-office:update-status', async (data: {
      status: TeamMemberPresence['status'];
      currentActivity?: string;
      mood?: TeamMemberPresence['mood'];
      location?: TeamMemberPresence['location'];
    }) => {
      const userId = socket.userId!;
      const presence = this.presence.get(userId);
      
      if (presence) {
        presence.status = data.status;
        if (data.currentActivity) presence.currentActivity = data.currentActivity;
        if (data.mood) presence.mood = data.mood;
        if (data.location) presence.location = data.location;
        presence.lastSeen = new Date();

        // Broadcast update
        this.io.emit('virtual-office:presence-update', {
          userId,
          ...data
        });
      }
    });

    // Send chat message
    socket.on('virtual-office:send-message', async (data: {
      roomId: string;
      content: string;
      type?: 'text' | 'image' | 'file';
      fileUrl?: string;
      fileName?: string;
    }) => {
      const userId = socket.userId!;
      const presence = this.presence.get(userId);
      
      if (!presence || presence.currentRoom !== data.roomId) {
        socket.emit('error', { message: 'Not in this room' });
        return;
      }

      // For now, skip database storage and just create message object
      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        senderId: userId,
        content: data.content,
        type: data.type || 'text',
        createdAt: new Date(),
        metadata: data.fileUrl ? {
          fileUrl: data.fileUrl,
          fileName: data.fileName
        } : undefined
      };

      // Broadcast to room
      this.io.to(`room:${data.roomId}`).emit('virtual-office:new-message', {
        id: message.id,
        senderId: userId,
        senderName: presence.name,
        senderAvatar: presence.avatar,
        content: data.content,
        timestamp: message.createdAt,
        type: data.type || 'text',
        roomId: data.roomId,
        fileUrl: data.fileUrl,
        fileName: data.fileName
      });
    });

    // Start video call
    socket.on('virtual-office:start-call', async (data: {
      roomId: string;
      type: 'video' | 'audio';
      targetUserId?: string; // For direct calls
    }) => {
      const userId = socket.userId!;
      const presence = this.presence.get(userId);
      
      if (!presence) return;

      // Update status to meeting
      presence.status = 'meeting';
      
      // Create call session
      const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      if (data.targetUserId) {
        // Direct call
        const targetSocketId = this.userSockets.get(data.targetUserId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('virtual-office:incoming-call', {
            callId,
            callerId: userId,
            callerName: presence.name,
            callerAvatar: presence.avatar,
            type: data.type
          });
        }
      } else {
        // Room call
        socket.to(`room:${data.roomId}`).emit('virtual-office:call-started', {
          callId,
          hostId: userId,
          hostName: presence.name,
          type: data.type,
          roomId: data.roomId
        });
      }

      socket.emit('virtual-office:call-created', { callId });
    });

    // WebRTC signaling
    socket.on('virtual-office:signal', (data: {
      targetUserId: string;
      signal: any;
      callId: string;
    }) => {
      const targetSocketId = this.userSockets.get(data.targetUserId);
      if (targetSocketId) {
        this.io.to(targetSocketId).emit('virtual-office:signal', {
          userId: socket.userId,
          signal: data.signal,
          callId: data.callId
        });
      }
    });

    // Screen share
    socket.on('virtual-office:screen-share', (data: {
      roomId: string;
      isSharing: boolean;
    }) => {
      const userId = socket.userId!;
      const presence = this.presence.get(userId);
      
      if (presence && presence.currentRoom === data.roomId) {
        socket.to(`room:${data.roomId}`).emit('virtual-office:screen-share-status', {
          userId,
          userName: presence.name,
          isSharing: data.isSharing
        });
      }
    });

    // Typing indicator
    socket.on('virtual-office:typing', (data: {
      roomId: string;
      isTyping: boolean;
    }) => {
      const userId = socket.userId!;
      const presence = this.presence.get(userId);
      
      if (presence && presence.currentRoom === data.roomId) {
        socket.to(`room:${data.roomId}`).emit('virtual-office:typing-indicator', {
          userId,
          userName: presence.name,
          isTyping: data.isTyping
        });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private async joinRoom(socket: VirtualOfficeSocket, roomId: string) {
    const room = this.rooms.get(roomId);
    const userId = socket.userId!;
    const presence = this.presence.get(userId);

    if (!room || !presence) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check capacity
    if (room.currentOccupants.size >= room.capacity && !room.currentOccupants.has(userId)) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    // Join socket room
    socket.join(`room:${roomId}`);
    room.currentOccupants.add(userId);
    presence.currentRoom = roomId;

    // Notify room members
    socket.to(`room:${roomId}`).emit('virtual-office:user-entered-room', {
      userId,
      userName: presence.name,
      roomId
    });

    // Send room details
    const roomMembers = Array.from(room.currentOccupants)
      .map(id => this.presence.get(id))
      .filter(Boolean);

    socket.emit('virtual-office:room-joined', {
      roomId,
      room: {
        ...room,
        currentOccupants: Array.from(room.currentOccupants)
      },
      members: roomMembers
    });
  }

  private async changeRoom(socket: VirtualOfficeSocket, newRoomId: string) {
    const userId = socket.userId!;
    const presence = this.presence.get(userId);
    
    if (!presence) return;

    const oldRoomId = presence.currentRoom;
    
    // Leave old room
    if (oldRoomId) {
      const oldRoom = this.rooms.get(oldRoomId);
      if (oldRoom) {
        oldRoom.currentOccupants.delete(userId);
        socket.leave(`room:${oldRoomId}`);
        
        // Notify old room members
        socket.to(`room:${oldRoomId}`).emit('virtual-office:user-left-room', {
          userId,
          userName: presence.name,
          roomId: oldRoomId
        });
      }
    }

    // Join new room
    await this.joinRoom(socket, newRoomId);
  }

  private handleDisconnect(socket: VirtualOfficeSocket) {
    const userId = socket.userId!;
    const presence = this.presence.get(userId);

    if (presence) {
      // Leave current room
      if (presence.currentRoom) {
        const room = this.rooms.get(presence.currentRoom);
        if (room) {
          room.currentOccupants.delete(userId);
          socket.to(`room:${presence.currentRoom}`).emit('virtual-office:user-left-room', {
            userId,
            userName: presence.name,
            roomId: presence.currentRoom
          });
        }
      }

      // Update presence to offline
      presence.status = 'offline';
      presence.lastSeen = new Date();

      // Broadcast disconnect
      socket.broadcast.emit('virtual-office:user-offline', {
        userId,
        lastSeen: presence.lastSeen
      });
    }

    // Remove socket mapping
    this.userSockets.delete(userId);
  }

  // Get current state for admin monitoring
  getCurrentState() {
    return {
      rooms: Array.from(this.rooms.entries()).map(([id, room]) => ({
        id,
        ...room,
        currentOccupants: Array.from(room.currentOccupants)
      })),
      presence: Array.from(this.presence.values()),
      activeUsers: this.userSockets.size
    };
  }
}

export function setupVirtualOffice(io: SocketIOServer) {
  const manager = new VirtualOfficeManager(io);

  // Add virtual office namespace
  const virtualOfficeNamespace = io.of('/virtual-office');
  
  virtualOfficeNamespace.use(async (socket: VirtualOfficeSocket, next) => {
    // Authentication middleware (reuse from main socket)
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify token and get user data
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      socket.userId = decoded.userId;
      socket.user = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role
      };

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  virtualOfficeNamespace.on('connection', (socket: VirtualOfficeSocket) => {
    console.log(`User ${socket.user?.username} connected to Virtual Office`);
    manager.handleConnection(socket);
  });

  // Admin API endpoint to get virtual office state
  return {
    getState: () => manager.getCurrentState()
  };
}