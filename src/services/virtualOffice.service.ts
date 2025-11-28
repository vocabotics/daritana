import { io, Socket } from 'socket.io-client';
import { apiClient } from './api';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'busy' | 'meeting' | 'away' | 'offline';
  currentActivity?: string;
  location?: 'office' | 'home' | 'site' | 'traveling';
  department?: string;
  projects?: string[];
  lastSeen?: Date;
  timezone?: string;
  mood?: 'productive' | 'focused' | 'creative' | 'collaborative' | 'break';
  currentRoom?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  reactions?: { emoji: string; users: string[] }[];
  threadId?: string;
  edited?: boolean;
  fileUrl?: string;
  fileName?: string;
  roomId?: string;
}

export interface VirtualRoom {
  id: string;
  name: string;
  type: 'office' | 'lounge' | 'studio' | 'meeting' | 'break' | 'game';
  capacity: number;
  currentOccupants: string[];
  ambientSound?: string;
  backgroundImage?: string;
  activities?: string[];
  isLocked?: boolean;
  host?: string;
}

export interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  target?: string;
  timestamp: Date;
  type: 'project' | 'task' | 'design' | 'meeting' | 'achievement' | 'status';
}

class VirtualOfficeService {
  private socket: Socket | null = null;
  private namespace: Socket | null = null;
  private currentRoom: string | null = null;
  private teamMembers: Map<string, TeamMember> = new Map();
  private rooms: Map<string, VirtualRoom> = new Map();
  private messageHistory: Map<string, ChatMessage[]> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnected: boolean = false;

  // Connect to Virtual Office namespace
  connect(token: string) {
    if (this.namespace?.connected) {
      return;
    }

    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:7001';
    
    // Connect to virtual office namespace
    this.namespace = io(`${serverUrl}/virtual-office`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
    this.loadTeamMembers();
  }

  private setupEventHandlers() {
    if (!this.namespace) return;

    // Connection events
    this.namespace.on('connect', () => {
      console.log('✅ Connected to Virtual Office');
      this.isConnected = true;
      this.emit('connected', true);
    });

    this.namespace.on('disconnect', () => {
      console.log('❌ Disconnected from Virtual Office');
      this.isConnected = false;
      this.emit('connected', false);
    });

    // Initial data
    this.namespace.on('virtual-office:init', (data: {
      rooms: VirtualRoom[];
      presence: TeamMember[];
      currentRoom: string;
    }) => {
      // Store rooms
      this.rooms.clear();
      data.rooms.forEach(room => {
        this.rooms.set(room.id, room);
      });

      // Store team presence
      this.teamMembers.clear();
      data.presence.forEach(member => {
        this.teamMembers.set(member.id, member);
      });

      this.currentRoom = data.currentRoom;
      this.emit('initialized', data);
    });

    // User joined
    this.namespace.on('virtual-office:user-joined', (member: TeamMember) => {
      this.teamMembers.set(member.id, member);
      this.emit('user-joined', member);
    });

    // User offline
    this.namespace.on('virtual-office:user-offline', (data: {
      userId: string;
      lastSeen: Date;
    }) => {
      const member = this.teamMembers.get(data.userId);
      if (member) {
        member.status = 'offline';
        member.lastSeen = new Date(data.lastSeen);
      }
      this.emit('user-offline', data);
    });

    // Presence update
    this.namespace.on('virtual-office:presence-update', (data: {
      userId: string;
      status?: TeamMember['status'];
      currentActivity?: string;
      mood?: TeamMember['mood'];
      location?: TeamMember['location'];
    }) => {
      const member = this.teamMembers.get(data.userId);
      if (member) {
        if (data.status) member.status = data.status;
        if (data.currentActivity) member.currentActivity = data.currentActivity;
        if (data.mood) member.mood = data.mood;
        if (data.location) member.location = data.location;
      }
      this.emit('presence-update', data);
    });

    // Room events
    this.namespace.on('virtual-office:room-joined', (data: {
      roomId: string;
      room: VirtualRoom;
      members: TeamMember[];
    }) => {
      this.currentRoom = data.roomId;
      this.rooms.set(data.roomId, data.room);
      this.emit('room-joined', data);
    });

    this.namespace.on('virtual-office:user-entered-room', (data: {
      userId: string;
      userName: string;
      roomId: string;
    }) => {
      const room = this.rooms.get(data.roomId);
      if (room && !room.currentOccupants.includes(data.userId)) {
        room.currentOccupants.push(data.userId);
      }
      this.emit('user-entered-room', data);
    });

    this.namespace.on('virtual-office:user-left-room', (data: {
      userId: string;
      userName: string;
      roomId: string;
    }) => {
      const room = this.rooms.get(data.roomId);
      if (room) {
        room.currentOccupants = room.currentOccupants.filter(id => id !== data.userId);
      }
      this.emit('user-left-room', data);
    });

    // Chat messages
    this.namespace.on('virtual-office:new-message', (message: ChatMessage) => {
      const roomId = message.roomId || this.currentRoom;
      if (roomId) {
        if (!this.messageHistory.has(roomId)) {
          this.messageHistory.set(roomId, []);
        }
        this.messageHistory.get(roomId)!.push(message);
      }
      this.emit('new-message', message);
    });

    // Typing indicators
    this.namespace.on('virtual-office:typing-indicator', (data: {
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      this.emit('typing-indicator', data);
    });

    // Call events
    this.namespace.on('virtual-office:incoming-call', (data: {
      callId: string;
      callerId: string;
      callerName: string;
      callerAvatar?: string;
      type: 'video' | 'audio';
    }) => {
      this.emit('incoming-call', data);
    });

    this.namespace.on('virtual-office:call-started', (data: {
      callId: string;
      hostId: string;
      hostName: string;
      type: 'video' | 'audio';
      roomId: string;
    }) => {
      this.emit('call-started', data);
    });

    this.namespace.on('virtual-office:call-created', (data: {
      callId: string;
    }) => {
      this.emit('call-created', data);
    });

    // WebRTC signaling
    this.namespace.on('virtual-office:signal', (data: {
      userId: string;
      signal: any;
      callId: string;
    }) => {
      this.emit('webrtc-signal', data);
    });

    // Screen share
    this.namespace.on('virtual-office:screen-share-status', (data: {
      userId: string;
      userName: string;
      isSharing: boolean;
    }) => {
      this.emit('screen-share-status', data);
    });
  }

  // Load team members from API
  private async loadTeamMembers() {
    try {
      const response = await apiClient.get('/virtual-office/team-members');
      if (response.data.success) {
        response.data.data.forEach((member: any) => {
          this.teamMembers.set(member.id, {
            ...member,
            lastSeen: member.lastSeen ? new Date(member.lastSeen) : undefined
          });
        });
        this.emit('team-members-loaded', Array.from(this.teamMembers.values()));
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  }

  // Public methods
  changeRoom(roomId: string) {
    if (!this.namespace) return;
    this.namespace.emit('virtual-office:change-room', roomId);
  }

  updateStatus(data: {
    status?: TeamMember['status'];
    currentActivity?: string;
    mood?: TeamMember['mood'];
    location?: TeamMember['location'];
  }) {
    if (!this.namespace) return;
    this.namespace.emit('virtual-office:update-status', data);
  }

  sendMessage(data: {
    roomId?: string;
    content: string;
    type?: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
  }) {
    if (!this.namespace) return;
    this.namespace.emit('virtual-office:send-message', {
      roomId: data.roomId || this.currentRoom,
      ...data
    });
  }

  startCall(data: {
    roomId?: string;
    type: 'video' | 'audio';
    targetUserId?: string;
  }) {
    if (!this.namespace) return;
    this.namespace.emit('virtual-office:start-call', {
      roomId: data.roomId || this.currentRoom,
      ...data
    });
  }

  sendSignal(data: {
    targetUserId: string;
    signal: any;
    callId: string;
  }) {
    if (!this.namespace) return;
    this.namespace.emit('virtual-office:signal', data);
  }

  toggleScreenShare(isSharing: boolean) {
    if (!this.namespace || !this.currentRoom) return;
    this.namespace.emit('virtual-office:screen-share', {
      roomId: this.currentRoom,
      isSharing
    });
  }

  setTyping(isTyping: boolean) {
    if (!this.namespace || !this.currentRoom) return;
    this.namespace.emit('virtual-office:typing', {
      roomId: this.currentRoom,
      isTyping
    });
  }

  // Event emitter methods
  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data?: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Getters
  getTeamMembers(): TeamMember[] {
    return Array.from(this.teamMembers.values());
  }

  getRooms(): VirtualRoom[] {
    return Array.from(this.rooms.values());
  }

  getCurrentRoom(): string | null {
    return this.currentRoom;
  }

  getMessageHistory(roomId: string): ChatMessage[] {
    return this.messageHistory.get(roomId) || [];
  }

  isOnline(): boolean {
    return this.isConnected;
  }

  disconnect() {
    if (this.namespace) {
      this.namespace.disconnect();
      this.namespace = null;
    }
    this.isConnected = false;
    this.teamMembers.clear();
    this.rooms.clear();
    this.messageHistory.clear();
  }
}

export const virtualOfficeService = new VirtualOfficeService();