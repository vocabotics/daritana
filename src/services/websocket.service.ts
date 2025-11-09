import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface UserPresence {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  location?: string;
  lastSeen: Date;
  currentProject?: string;
  currentPage?: string;
}

interface RealtimeUpdate {
  type: 'project' | 'task' | 'file' | 'comment' | 'notification';
  action: 'create' | 'update' | 'delete';
  data: any;
  userId: string;
  timestamp: Date;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();
  private presenceData: Map<string, UserPresence> = new Map();
  private currentUserId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.currentUserId = userId;
    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:7001';

    // SECURITY: Use HTTP-Only cookies for authentication (no token parameter)
    this.socket = io(serverUrl, {
      withCredentials: true, // Send HTTP-Only cookies with WebSocket handshake
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to real-time server');
      this.reconnectAttempts = 0;
      this.updateUserStatus('online');
      this.emit('connection', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from real-time server:', reason);
      this.emit('connection', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        // Disabled toast to prevent spam
        console.warn('Unable to connect to real-time server after', this.maxReconnectAttempts, 'attempts');
      }
    });

    // Presence events
    this.socket.on('presence:update', (data: UserPresence) => {
      this.presenceData.set(data.userId, data);
      this.emit('presence:update', data);
    });

    this.socket.on('presence:user_joined', (data: UserPresence) => {
      this.presenceData.set(data.userId, data);
      this.emit('presence:user_joined', data);
      
      if (data.userId !== this.currentUserId) {
        toast.success(`${data.name} is now online`, {
          duration: 3000,
          icon: '👋',
        });
      }
    });

    this.socket.on('presence:user_left', (data: { userId: string; name: string }) => {
      const presence = this.presenceData.get(data.userId);
      if (presence) {
        presence.status = 'offline';
        presence.lastSeen = new Date();
      }
      this.emit('presence:user_left', data);
    });

    this.socket.on('presence:list', (users: UserPresence[]) => {
      this.presenceData.clear();
      users.forEach(user => {
        this.presenceData.set(user.userId, user);
      });
      this.emit('presence:list', users);
    });

    // Real-time updates
    this.socket.on('update', (update: RealtimeUpdate) => {
      this.emit('update', update);
      this.emit(`update:${update.type}`, update);
      
      // Show notification for important updates
      if (update.userId !== this.currentUserId) {
        this.showUpdateNotification(update);
      }
    });

    // Collaboration events
    this.socket.on('cursor:move', (data: any) => {
      this.emit('cursor:move', data);
    });

    this.socket.on('selection:change', (data: any) => {
      this.emit('selection:change', data);
    });

    this.socket.on('comment:add', (data: any) => {
      this.emit('comment:add', data);
    });

    // Typing indicators
    this.socket.on('typing:start', (data: { userId: string; name: string; context: string }) => {
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data: { userId: string; context: string }) => {
      this.emit('typing:stop', data);
    });

    // Notifications
    this.socket.on('notification', (notification: any) => {
      this.emit('notification', notification);
      
      if (notification.priority === 'high') {
        toast.error(notification.message, {
          duration: 5000,
          icon: '🔔',
        });
      } else {
        toast.info(notification.message, {
          duration: 3000,
        });
      }
    });
  }

  private showUpdateNotification(update: RealtimeUpdate) {
    const messages: Record<string, string> = {
      'project:create': 'New project created',
      'project:update': 'Project updated',
      'task:create': 'New task added',
      'task:update': 'Task updated',
      'task:complete': 'Task completed',
      'file:upload': 'New file uploaded',
      'comment:add': 'New comment added',
    };

    const key = `${update.type}:${update.action}`;
    const message = messages[key];

    if (message) {
      toast.info(message, {
        duration: 3000,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to relevant page
            this.emit('navigate', update);
          },
        },
      });
    }
  }

  // Public methods
  updateUserStatus(status: 'online' | 'away' | 'busy' | 'offline') {
    this.socket?.emit('presence:status', { status });
  }

  updateUserLocation(location: string, page?: string) {
    this.socket?.emit('presence:location', { location, page });
  }

  joinProject(projectId: string) {
    this.socket?.emit('project:join', { projectId });
  }

  leaveProject(projectId: string) {
    this.socket?.emit('project:leave', { projectId });
  }

  sendUpdate(update: Omit<RealtimeUpdate, 'userId' | 'timestamp'>) {
    this.socket?.emit('update', update);
  }

  sendCursorPosition(x: number, y: number, context: string) {
    this.socket?.emit('cursor:move', { x, y, context });
  }

  startTyping(context: string) {
    this.socket?.emit('typing:start', { context });
  }

  stopTyping(context: string) {
    this.socket?.emit('typing:stop', { context });
  }

  // Get current online users
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.presenceData.values()).filter(
      user => user.status !== 'offline'
    );
  }

  getOnlineUsersCount(): number {
    return this.getOnlineUsers().length;
  }

  getUserPresence(userId: string): UserPresence | undefined {
    return this.presenceData.get(userId);
  }

  getProjectUsers(projectId: string): UserPresence[] {
    return Array.from(this.presenceData.values()).filter(
      user => user.currentProject === projectId && user.status !== 'offline'
    );
  }

  // Event handling
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.presenceData.clear();
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();
export default wsService;