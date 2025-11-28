import { io, Socket } from 'socket.io-client';
import { apiClient } from './api';

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  conversationId: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file' | 'video';
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  replyTo?: ChatMessage;
  reactions?: {
    emoji: string;
    userId: string;
    userName: string;
  }[];
}

export interface ChatConversation {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'channel';
  participants: {
    id: string;
    userId: string;
    user?: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      status?: string;
    };
    role?: string;
    joinedAt: Date;
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  organizationId: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  conversationId: string;
  isTyping: boolean;
}

class ChatService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private currentConversationId: string | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  // Connect to chat WebSocket
  connect(token: string) {
    if (this.socket?.connected) {
      console.log('Chat already connected');
      return;
    }

    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:7001';
    
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

    this.socket.on('connect', () => {
      console.log('✅ Chat connected');
      this.isConnected = true;
      this.emit('connected', true);
      
      // Rejoin current conversation if any
      if (this.currentConversationId) {
        this.joinConversation(this.currentConversationId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Chat disconnected');
      this.isConnected = false;
      this.emit('connected', false);
    });

    this.socket.on('chat:message', (message: ChatMessage) => {
      console.log('New message:', message);
      this.emit('new-message', message);
    });

    this.socket.on('chat:typing', (data: TypingIndicator) => {
      this.emit('typing-indicator', data);
    });

    this.socket.on('chat:message-status', (data: { messageId: string; status: string }) => {
      this.emit('message-status', data);
    });

    this.socket.on('chat:reaction', (data: { messageId: string; reaction: any }) => {
      this.emit('message-reaction', data);
    });

    this.socket.on('chat:conversation-updated', (conversation: ChatConversation) => {
      this.emit('conversation-updated', conversation);
    });
  }

  // API Methods
  async getConversations(): Promise<ChatConversation[]> {
    try {
      const response = await apiClient.get('/api/chat/conversations');
      if (response.data.success) {
        return response.data.data.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          participants: conv.participants?.map((p: any) => ({
            ...p,
            joinedAt: new Date(p.joinedAt)
          }))
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  async getConversation(id: string): Promise<ChatConversation | null> {
    try {
      const response = await apiClient.get(`/api/chat/conversations/${id}`);
      if (response.data.success) {
        const conv = response.data.data;
        return {
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          participants: conv.participants?.map((p: any) => ({
            ...p,
            joinedAt: new Date(p.joinedAt)
          }))
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  }

  async createConversation(data: {
    name?: string;
    type: 'direct' | 'group' | 'channel';
    participants: string[];
    projectId?: string;
  }): Promise<ChatConversation | null> {
    try {
      const response = await apiClient.post('/api/chat/conversations', data);
      if (response.data.success) {
        const conv = response.data.data;
        return {
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt)
        };
      }
      return null;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  async getMessages(conversationId: string, params?: {
    limit?: number;
    before?: string;
    after?: string;
  }): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get(`/api/chat/conversations/${conversationId}/messages`, {
        params
      });
      if (response.data.success) {
        return response.data.data.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // WebSocket Methods
  joinConversation(conversationId: string) {
    if (!this.socket) return;
    
    // Leave previous conversation
    if (this.currentConversationId && this.currentConversationId !== conversationId) {
      this.leaveConversation(this.currentConversationId);
    }
    
    this.currentConversationId = conversationId;
    this.socket.emit('chat:join-conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    if (!this.socket) return;
    this.socket.emit('chat:leave-conversation', conversationId);
    
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
  }

  sendMessage(conversationId: string, content: string, type: string = 'text', attachments?: any[]) {
    if (!this.socket) return;
    
    const message = {
      conversationId,
      content,
      type,
      attachments,
      timestamp: new Date()
    };
    
    this.socket.emit('chat:send-message', message);
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    if (!this.socket) return;
    
    // Clear existing timeout
    const timeoutKey = `${conversationId}-typing`;
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey)!);
      this.typingTimeouts.delete(timeoutKey);
    }
    
    this.socket.emit('chat:typing', {
      conversationId,
      isTyping
    });
    
    // Auto-stop typing after 3 seconds
    if (isTyping) {
      const timeout = setTimeout(() => {
        this.sendTypingIndicator(conversationId, false);
      }, 3000);
      this.typingTimeouts.set(timeoutKey, timeout);
    }
  }

  markAsRead(conversationId: string, messageId: string) {
    if (!this.socket) return;
    this.socket.emit('chat:mark-read', {
      conversationId,
      messageId
    });
  }

  addReaction(messageId: string, emoji: string) {
    if (!this.socket) return;
    this.socket.emit('chat:add-reaction', {
      messageId,
      emoji
    });
  }

  removeReaction(messageId: string, emoji: string) {
    if (!this.socket) return;
    this.socket.emit('chat:remove-reaction', {
      messageId,
      emoji
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

  // Utility methods
  isOnline(): boolean {
    return this.isConnected;
  }

  getCurrentConversationId(): string | null {
    return this.currentConversationId;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentConversationId = null;
    this.listeners.clear();
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  // Create or get direct conversation with a user
  async getOrCreateDirectConversation(userId: string): Promise<ChatConversation | null> {
    try {
      // First check if conversation exists
      const conversations = await this.getConversations();
      const existing = conversations.find(
        conv => conv.type === 'direct' && 
        conv.participants.some(p => p.userId === userId)
      );
      
      if (existing) {
        return existing;
      }
      
      // Create new conversation
      return this.createConversation({
        type: 'direct',
        participants: [userId]
      });
    } catch (error) {
      console.error('Error getting/creating direct conversation:', error);
      return null;
    }
  }
}

export const chatService = new ChatService();