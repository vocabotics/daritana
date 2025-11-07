import { io, Socket } from 'socket.io-client';
import { apiClient } from './api';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'video' | 'audio';
  attachments?: any[];
  reactions?: { [emoji: string]: string[] };
  isEdited?: boolean;
  replyTo?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'project' | 'department';
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isPinned?: boolean;
  avatar?: string;
  description?: string;
  createdAt: Date;
}

export interface VideoRoom {
  id: string;
  name: string;
  participants: string[];
  isActive: boolean;
  maxParticipants: number;
  host: string;
  startTime?: Date;
  type: 'meeting' | 'standup' | 'casual' | 'presentation';
}

class TeamChatService {
  private socket: Socket | null = null;
  private currentRoom: string | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private typingHandlers: ((data: { userId: string; isTyping: boolean }) => void)[] = [];
  private presenceHandlers: ((data: any) => void)[] = [];
  
  // Local storage for messages (cache)
  private messageCache: Map<string, ChatMessage[]> = new Map();
  private roomCache: Map<string, ChatRoom> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5004';
      
      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Chat service connected');
        this.setupEventHandlers();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Chat connection error:', error);
        reject(error);
      });
    });
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Message events
    this.socket.on('message:new', (message: ChatMessage) => {
      // Add to cache
      if (this.currentRoom) {
        const messages = this.messageCache.get(this.currentRoom) || [];
        messages.push(message);
        this.messageCache.set(this.currentRoom, messages);
      }
      
      // Notify handlers
      this.messageHandlers.forEach(handler => handler(message));
    });

    // Typing indicators
    this.socket.on('typing:start', (data) => {
      this.typingHandlers.forEach(handler => handler({ ...data, isTyping: true }));
    });

    this.socket.on('typing:stop', (data) => {
      this.typingHandlers.forEach(handler => handler({ ...data, isTyping: false }));
    });

    // Presence updates
    this.socket.on('presence:update', (data) => {
      this.presenceHandlers.forEach(handler => handler(data));
    });

    // Room updates
    this.socket.on('room:update', (room: ChatRoom) => {
      this.roomCache.set(room.id, room);
    });
  }

  // Chat room management
  async getChatRooms(): Promise<ChatRoom[]> {
    try {
      const response = await apiClient.get('/api/chat/rooms');
      const rooms = response.data.data || [];
      
      // Cache rooms
      rooms.forEach((room: ChatRoom) => {
        this.roomCache.set(room.id, room);
      });
      
      return rooms;
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
      // Return cached rooms if available
      return Array.from(this.roomCache.values());
    }
  }

  async createChatRoom(data: {
    name: string;
    type: ChatRoom['type'];
    participants: string[];
    description?: string;
  }): Promise<ChatRoom> {
    try {
      const response = await apiClient.post('/api/chat/rooms', data);
      const room = response.data.data;
      
      // Cache the new room
      this.roomCache.set(room.id, room);
      
      // Join the room automatically
      this.joinRoom(room.id);
      
      return room;
    } catch (error) {
      console.error('Failed to create chat room:', error);
      throw error;
    }
  }

  joinRoom(roomId: string) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    // Leave current room if any
    if (this.currentRoom) {
      this.socket.emit('room:leave', { roomId: this.currentRoom });
    }

    // Join new room
    this.currentRoom = roomId;
    this.socket.emit('room:join', { roomId });
  }

  async getMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    // Check cache first
    const cached = this.messageCache.get(roomId);
    if (cached && cached.length > 0) {
      return cached;
    }

    try {
      const response = await apiClient.get(`/api/chat/rooms/${roomId}/messages`, {
        params: { limit }
      });
      
      const messages = response.data.data || [];
      
      // Cache messages
      this.messageCache.set(roomId, messages);
      
      return messages;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  sendMessage(roomId: string, content: string, type: ChatMessage['type'] = 'text') {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    const message = {
      roomId,
      content,
      type,
      timestamp: new Date()
    };

    this.socket.emit('message:send', message);
  }

  sendTypingIndicator(roomId: string, isTyping: boolean) {
    if (!this.socket) return;
    
    this.socket.emit(isTyping ? 'typing:start' : 'typing:stop', { roomId });
  }

  // Video room management
  async getVideoRooms(): Promise<VideoRoom[]> {
    try {
      const response = await apiClient.get('/api/video/rooms');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch video rooms:', error);
      return [];
    }
  }

  async createVideoRoom(data: {
    name: string;
    type: VideoRoom['type'];
    maxParticipants?: number;
  }): Promise<VideoRoom> {
    try {
      const response = await apiClient.post('/api/video/rooms', data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create video room:', error);
      throw error;
    }
  }

  async joinVideoRoom(roomId: string): Promise<{ token: string; iceServers: any[] }> {
    try {
      const response = await apiClient.post(`/api/video/rooms/${roomId}/join`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to join video room:', error);
      throw error;
    }
  }

  // Event handlers
  onMessage(handler: (message: ChatMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onTyping(handler: (data: { userId: string; isTyping: boolean }) => void) {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }

  onPresence(handler: (data: any) => void) {
    this.presenceHandlers.push(handler);
    return () => {
      this.presenceHandlers = this.presenceHandlers.filter(h => h !== handler);
    };
  }

  // Mock data for development (will be replaced with real data)
  async getMockChatRooms(): Promise<ChatRoom[]> {
    return [
      {
        id: 'room-1',
        name: 'KLCC Tower Team',
        type: 'project',
        participants: ['1', '3', '4'],
        lastMessage: {
          id: 'msg-1',
          senderId: '1',
          senderName: 'Sarah Chen',
          senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          content: 'Great work on the facade design!',
          timestamp: new Date(Date.now() - 300000),
          type: 'text'
        },
        unreadCount: 2,
        isPinned: true,
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        id: 'room-2',
        name: 'Design Team',
        type: 'department',
        participants: ['1', '3', '5'],
        lastMessage: {
          id: 'msg-2',
          senderId: '3',
          senderName: 'Maria Santos',
          senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
          content: 'New material samples arrived!',
          timestamp: new Date(Date.now() - 900000),
          type: 'text'
        },
        unreadCount: 0,
        isPinned: false,
        createdAt: new Date(Date.now() - 172800000)
      }
    ];
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageHandlers = [];
    this.typingHandlers = [];
    this.presenceHandlers = [];
    this.currentRoom = null;
  }
}

export const teamChatService = new TeamChatService();