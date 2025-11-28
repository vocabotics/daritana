import { io, Socket } from 'socket.io-client';
import { apiClient } from './api';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  department?: string;
  status: 'online' | 'busy' | 'meeting' | 'away' | 'offline';
  activity?: string;
  currentRoom?: string;
  lastSeen?: Date;
}

export interface VirtualRoom {
  id: string;
  name: string;
  type: 'office' | 'studio' | 'meeting' | 'lounge';
  occupants: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  roomId: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

class VirtualOfficeSimpleService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private currentUser: TeamMember | null = null;
  private teamMembers: Map<string, TeamMember> = new Map();
  private rooms: VirtualRoom[] = [];
  private currentRoom: string = 'main-office';
  private messages: Map<string, ChatMessage[]> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('Already connected to Virtual Office');
      return;
    }

    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:7001';
    
    console.log('Connecting to Virtual Office at', serverUrl);
    
    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to Virtual Office');
      this.isConnected = true;
      this.emit('connected', true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from Virtual Office');
      this.isConnected = false;
      this.emit('connected', false);
    });

    this.socket.on('error', (error: any) => {
      console.error('Virtual Office error:', error);
      this.emit('error', error);
    });

    // Initial connection data
    this.socket.on('virtual-office:connected', (data: {
      currentUser: TeamMember;
      rooms: VirtualRoom[];
      teamMembers: TeamMember[];
      onlineUsers: TeamMember[];
      currentRoom: string;
      messages: ChatMessage[];
    }) => {
      console.log('Virtual Office initialized:', data);
      
      this.currentUser = data.currentUser;
      this.rooms = data.rooms;
      this.currentRoom = data.currentRoom;
      
      // Store team members
      this.teamMembers.clear();
      data.teamMembers.forEach(member => {
        this.teamMembers.set(member.id, member);
      });
      
      // Update online status
      data.onlineUsers.forEach(user => {
        const member = this.teamMembers.get(user.id);
        if (member) {
          member.status = user.status;
          member.currentRoom = user.currentRoom;
        }
      });
      
      // Store initial messages
      this.messages.set(data.currentRoom, data.messages);
      
      this.emit('initialized', {
        user: this.currentUser,
        teamMembers: Array.from(this.teamMembers.values()),
        rooms: this.rooms,
        currentRoom: this.currentRoom,
        messages: data.messages
      });
    });

    // User events
    this.socket.on('virtual-office:user-joined', (user: TeamMember) => {
      console.log('User joined:', user.name);
      const existing = this.teamMembers.get(user.id);
      if (existing) {
        existing.status = 'online';
        existing.currentRoom = user.currentRoom;
      } else {
        this.teamMembers.set(user.id, user);
      }
      this.emit('user-joined', user);
    });

    this.socket.on('virtual-office:user-disconnected', (data: {
      userId: string;
      lastSeen: Date;
    }) => {
      const member = this.teamMembers.get(data.userId);
      if (member) {
        member.status = 'offline';
        member.lastSeen = new Date(data.lastSeen);
      }
      this.emit('user-disconnected', data);
    });

    this.socket.on('virtual-office:presence-updated', (data: {
      userId: string;
      status?: string;
      activity?: string;
    }) => {
      const member = this.teamMembers.get(data.userId);
      if (member) {
        if (data.status) member.status = data.status as any;
        if (data.activity) member.activity = data.activity;
      }
      this.emit('presence-updated', data);
    });

    // Room events
    this.socket.on('virtual-office:room-changed', (data: {
      roomId: string;
      members: TeamMember[];
      messages: ChatMessage[];
    }) => {
      this.currentRoom = data.roomId;
      this.messages.set(data.roomId, data.messages);
      
      // Update room occupants
      const room = this.rooms.find(r => r.id === data.roomId);
      if (room) {
        room.occupants = data.members.map(m => m.id);
      }
      
      this.emit('room-changed', data);
    });

    this.socket.on('virtual-office:user-entered-room', (data: {
      userId: string;
      userName: string;
      roomId: string;
    }) => {
      const room = this.rooms.find(r => r.id === data.roomId);
      if (room && !room.occupants.includes(data.userId)) {
        room.occupants.push(data.userId);
      }
      this.emit('user-entered-room', data);
    });

    this.socket.on('virtual-office:user-left-room', (data: {
      userId: string;
      roomId: string;
    }) => {
      const room = this.rooms.find(r => r.id === data.roomId);
      if (room) {
        room.occupants = room.occupants.filter(id => id !== data.userId);
      }
      this.emit('user-left-room', data);
    });

    // Messages
    this.socket.on('virtual-office:new-message', (message: ChatMessage) => {
      console.log('New message:', message);
      const roomMessages = this.messages.get(message.roomId) || [];
      roomMessages.push(message);
      this.messages.set(message.roomId, roomMessages);
      this.emit('new-message', message);
    });

    this.socket.on('virtual-office:typing-indicator', (data: {
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      this.emit('typing-indicator', data);
    });
  }

  // Public methods
  changeRoom(roomId: string) {
    if (!this.socket) return;
    console.log('Changing room to:', roomId);
    this.socket.emit('virtual-office:change-room', roomId);
  }

  updateStatus(status: string, activity?: string) {
    if (!this.socket) return;
    this.socket.emit('virtual-office:update-status', { status, activity });
  }

  sendMessage(content: string, roomId?: string) {
    if (!this.socket) return;
    console.log('Sending message:', content);
    this.socket.emit('virtual-office:send-message', {
      content,
      roomId: roomId || this.currentRoom
    });
  }

  setTyping(isTyping: boolean) {
    if (!this.socket) return;
    this.socket.emit('virtual-office:typing', isTyping);
  }

  // Getters
  getTeamMembers(): TeamMember[] {
    return Array.from(this.teamMembers.values());
  }

  getRooms(): VirtualRoom[] {
    return this.rooms;
  }

  getCurrentRoom(): string {
    return this.currentRoom;
  }

  getCurrentUser(): TeamMember | null {
    return this.currentUser;
  }

  getMessages(roomId: string): ChatMessage[] {
    return this.messages.get(roomId) || [];
  }

  isOnline(): boolean {
    return this.isConnected;
  }

  // Event emitter
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

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.teamMembers.clear();
    this.rooms = [];
    this.messages.clear();
  }
}

export const virtualOfficeService = new VirtualOfficeSimpleService();