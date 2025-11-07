import { io, Socket } from 'socket.io-client';
import { connectSocket, getSocket, disconnectSocket } from './api';

// Types for real-time events
export interface RealtimeNotification {
  id: string;
  type: 'PROJECT_UPDATE' | 'TASK_ASSIGNED' | 'MESSAGE' | 'COMMENT' | 'MENTION' | 'SYSTEM' | 'COMPLIANCE_ALERT';
  title: string;
  message: string;
  data?: any;
  userId: string;
  organizationId: string;
  projectId?: string;
  isRead: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  channelId?: string;
  projectId?: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
  isEdited?: boolean;
  timestamp: Date;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  currentPage?: string;
  isTyping?: boolean;
  typingIn?: string; // Channel or conversation ID
}

export interface LiveCursor {
  userId: string;
  userName: string;
  userColor: string;
  x: number;
  y: number;
  page: string;
  timestamp: Date;
}

export interface CollaborativeEdit {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  operation: 'INSERT' | 'DELETE' | 'UPDATE' | 'FORMAT';
  position: number;
  content: string;
  timestamp: Date;
  version: number;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  type: 'STATUS_CHANGE' | 'TASK_UPDATE' | 'MILESTONE_REACHED' | 'BUDGET_ALERT' | 'DEADLINE_APPROACHING';
  title: string;
  description: string;
  data: any;
  userId: string;
  timestamp: Date;
}

// Event handler types
type NotificationHandler = (notification: RealtimeNotification) => void;
type MessageHandler = (message: ChatMessage) => void;
type PresenceHandler = (presence: PresenceUpdate) => void;
type CursorHandler = (cursor: LiveCursor) => void;
type EditHandler = (edit: CollaborativeEdit) => void;
type ProjectUpdateHandler = (update: ProjectUpdate) => void;
type ErrorHandler = (error: any) => void;

interface EventHandlers {
  notifications: NotificationHandler[];
  messages: MessageHandler[];
  presence: PresenceHandler[];
  cursors: CursorHandler[];
  edits: EditHandler[];
  projectUpdates: ProjectUpdateHandler[];
  errors: ErrorHandler[];
}

class WebSocketService {
  private socket: Socket | null = null;
  private handlers: EventHandlers = {
    notifications: [],
    messages: [],
    presence: [],
    cursors: [],
    edits: [],
    projectUpdates: [],
    errors: []
  };
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentUser: { id: string; name: string } | null = null;
  private currentOrganization: string | null = null;

  // ==================== CONNECTION MANAGEMENT ====================

  async connect(user: { id: string; name: string }, organizationId: string) {
    if (this.isConnected && this.socket) {
      return this.socket;
    }

    this.currentUser = user;
    this.currentOrganization = organizationId;

    try {
      this.socket = connectSocket();
      
      if (this.socket) {
        this.setupEventListeners();
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Join user and organization rooms
        this.socket.emit('join-user-room', user.id);
        this.socket.emit('join-organization-room', organizationId);
        
        console.log('WebSocket connected successfully');
        return this.socket;
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleConnectionError(error);
    }

    return null;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentUser = null;
    this.currentOrganization = null;
    console.log('WebSocket disconnected');
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.handleDisconnection(reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleConnectionError(error);
    });

    // Real-time data events
    this.socket.on('notification', (data: RealtimeNotification) => {
      this.handlers.notifications.forEach(handler => handler(data));
    });

    this.socket.on('message', (data: ChatMessage) => {
      this.handlers.messages.forEach(handler => handler(data));
    });

    this.socket.on('presence-update', (data: PresenceUpdate) => {
      this.handlers.presence.forEach(handler => handler(data));
    });

    this.socket.on('cursor-update', (data: LiveCursor) => {
      this.handlers.cursors.forEach(handler => handler(data));
    });

    this.socket.on('collaborative-edit', (data: CollaborativeEdit) => {
      this.handlers.edits.forEach(handler => handler(data));
    });

    this.socket.on('project-update', (data: ProjectUpdate) => {
      this.handlers.projectUpdates.forEach(handler => handler(data));
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handlers.errors.forEach(handler => handler(error));
    });
  }

  private handleDisconnection(reason: string) {
    if (reason === 'io server disconnect' || reason === 'io client disconnect') {
      // Manual disconnection, don't reconnect
      return;
    }

    // Attempt reconnection
    this.attemptReconnection();
  }

  private handleConnectionError(error: any) {
    this.handlers.errors.forEach(handler => handler(error));
    this.attemptReconnection();
  }

  private attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.currentUser && this.currentOrganization) {
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect(this.currentUser, this.currentOrganization);
      }
    }, delay);
  }

  // ==================== EVENT SUBSCRIPTIONS ====================

  onNotification(handler: NotificationHandler) {
    this.handlers.notifications.push(handler);
    return () => {
      const index = this.handlers.notifications.indexOf(handler);
      if (index > -1) {
        this.handlers.notifications.splice(index, 1);
      }
    };
  }

  onMessage(handler: MessageHandler) {
    this.handlers.messages.push(handler);
    return () => {
      const index = this.handlers.messages.indexOf(handler);
      if (index > -1) {
        this.handlers.messages.splice(index, 1);
      }
    };
  }

  onPresence(handler: PresenceHandler) {
    this.handlers.presence.push(handler);
    return () => {
      const index = this.handlers.presence.indexOf(handler);
      if (index > -1) {
        this.handlers.presence.splice(index, 1);
      }
    };
  }

  onCursor(handler: CursorHandler) {
    this.handlers.cursors.push(handler);
    return () => {
      const index = this.handlers.cursors.indexOf(handler);
      if (index > -1) {
        this.handlers.cursors.splice(index, 1);
      }
    };
  }

  onEdit(handler: EditHandler) {
    this.handlers.edits.push(handler);
    return () => {
      const index = this.handlers.edits.indexOf(handler);
      if (index > -1) {
        this.handlers.edits.splice(index, 1);
      }
    };
  }

  onProjectUpdate(handler: ProjectUpdateHandler) {
    this.handlers.projectUpdates.push(handler);
    return () => {
      const index = this.handlers.projectUpdates.indexOf(handler);
      if (index > -1) {
        this.handlers.projectUpdates.splice(index, 1);
      }
    };
  }

  onError(handler: ErrorHandler) {
    this.handlers.errors.push(handler);
    return () => {
      const index = this.handlers.errors.indexOf(handler);
      if (index > -1) {
        this.handlers.errors.splice(index, 1);
      }
    };
  }

  // ==================== MESSAGING ====================

  sendMessage(message: {
    content: string;
    receiverId?: string;
    channelId?: string;
    projectId?: string;
    type?: 'text' | 'file' | 'image';
    attachments?: any[];
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send-message', message);
    }
  }

  joinChannel(channelId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-channel', channelId);
    }
  }

  leaveChannel(channelId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-channel', channelId);
    }
  }

  // ==================== PRESENCE ====================

  updatePresence(status: 'online' | 'away' | 'busy') {
    if (this.socket && this.isConnected) {
      this.socket.emit('update-presence', { status });
    }
  }

  updateCurrentPage(page: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update-page', { page });
    }
  }

  setTyping(channelId: string, isTyping: boolean) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { channelId, isTyping });
    }
  }

  // ==================== LIVE CURSORS ====================

  updateCursor(x: number, y: number, page: string) {
    if (this.socket && this.isConnected && this.currentUser) {
      this.socket.emit('cursor-move', {
        x,
        y,
        page,
        userId: this.currentUser.id,
        userName: this.currentUser.name
      });
    }
  }

  joinCollaborativeSession(documentId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-collaborative-session', { documentId });
    }
  }

  leaveCollaborativeSession(documentId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-collaborative-session', { documentId });
    }
  }

  // ==================== COLLABORATIVE EDITING ====================

  sendEdit(edit: {
    documentId: string;
    operation: 'INSERT' | 'DELETE' | 'UPDATE' | 'FORMAT';
    position: number;
    content: string;
    version: number;
  }) {
    if (this.socket && this.isConnected && this.currentUser) {
      this.socket.emit('collaborative-edit', {
        ...edit,
        userId: this.currentUser.id,
        userName: this.currentUser.name
      });
    }
  }

  requestLock(documentId: string, section: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('request-lock', { documentId, section });
    }
  }

  releaseLock(documentId: string, section: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('release-lock', { documentId, section });
    }
  }

  // ==================== PROJECT COLLABORATION ====================

  joinProject(projectId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-project', { projectId });
    }
  }

  leaveProject(projectId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-project', { projectId });
    }
  }

  broadcastProjectUpdate(update: {
    projectId: string;
    type: string;
    title: string;
    description: string;
    data: any;
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('project-update', update);
    }
  }

  // ==================== NOTIFICATIONS ====================

  markNotificationAsRead(notificationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark-notification-read', { notificationId });
    }
  }

  subscribeToNotifications(types: string[]) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-notifications', { types });
    }
  }

  unsubscribeFromNotifications(types: string[]) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe-notifications', { types });
    }
  }

  // ==================== UTILITY METHODS ====================

  isSocketConnected(): boolean {
    return this.isConnected && this.socket !== null;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      currentUser: this.currentUser,
      currentOrganization: this.currentOrganization
    };
  }

  // ==================== ROOM MANAGEMENT ====================

  joinRoom(roomId: string, roomType: 'user' | 'organization' | 'project' | 'channel') {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-room', { roomId, roomType });
    }
  }

  leaveRoom(roomId: string, roomType: 'user' | 'organization' | 'project' | 'channel') {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-room', { roomId, roomType });
    }
  }

  // ==================== PING/HEARTBEAT ====================

  ping() {
    if (this.socket && this.isConnected) {
      const start = Date.now();
      this.socket.emit('ping', { timestamp: start }, (response: any) => {
        const latency = Date.now() - start;
        console.log(`Ping: ${latency}ms`);
      });
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Export types for use in components
export type {
  RealtimeNotification,
  ChatMessage,
  PresenceUpdate,
  LiveCursor,
  CollaborativeEdit,
  ProjectUpdate,
  NotificationHandler,
  MessageHandler,
  PresenceHandler,
  CursorHandler,
  EditHandler,
  ProjectUpdateHandler,
  ErrorHandler
};

export default websocketService;