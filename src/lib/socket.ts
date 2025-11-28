import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:7001';

    // HTTP-Only cookies are sent automatically with WebSocket handshake
    this.socket = io(socketUrl, {
      withCredentials: true, // IMPORTANT: Send cookies with WebSocket connection
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server forced disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle authentication errors
    this.socket.on('auth_error', () => {
      console.error('Socket authentication failed - cookies may be expired');
      // Cookies are HTTP-Only and managed by the server
      // User should re-authenticate if this occurs
    });

    // Real-time event handlers
    this.socket.on('notification', (notification) => {
      console.log('New notification:', notification);
      // Dispatch to notification store
      window.dispatchEvent(new CustomEvent('socket:notification', { detail: notification }));
    });

    this.socket.on('project_update', (update) => {
      console.log('Project update:', update);
      window.dispatchEvent(new CustomEvent('socket:project_update', { detail: update }));
    });

    this.socket.on('task_update', (update) => {
      console.log('Task update:', update);
      window.dispatchEvent(new CustomEvent('socket:task_update', { detail: update }));
    });

    this.socket.on('user_presence', (presence) => {
      console.log('User presence update:', presence);
      window.dispatchEvent(new CustomEvent('socket:user_presence', { detail: presence }));
    });

    this.socket.on('chat_message', (message) => {
      console.log('Chat message:', message);
      window.dispatchEvent(new CustomEvent('socket:chat_message', { detail: message }));
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Presence methods
  joinRoom(roomId: string): void {
    this.emit('join_room', { roomId });
  }

  leaveRoom(roomId: string): void {
    this.emit('leave_room', { roomId });
  }

  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): void {
    this.emit('update_presence', { status });
  }

  // Chat methods
  sendMessage(roomId: string, message: string, type: 'text' | 'image' | 'file' = 'text'): void {
    this.emit('send_message', {
      roomId,
      message,
      type,
      timestamp: new Date().toISOString(),
    });
  }

  // Project collaboration methods
  joinProject(projectId: string): void {
    this.emit('join_project', { projectId });
  }

  leaveProject(projectId: string): void {
    this.emit('leave_project', { projectId });
  }

  updateCursor(projectId: string, position: { x: number; y: number }): void {
    this.emit('cursor_update', { projectId, position });
  }

  startEditing(projectId: string, elementId: string): void {
    this.emit('start_editing', { projectId, elementId });
  }

  stopEditing(projectId: string, elementId: string): void {
    this.emit('stop_editing', { projectId, elementId });
  }
}

// Singleton instance
export const socketManager = new SocketManager();

// Convenience exports
export const connectSocket = () => socketManager.connect();
export const disconnectSocket = () => socketManager.disconnect();
export const getSocket = () => socketManager.getSocket();
export const emitSocket = (event: string, data: any) => socketManager.emit(event, data);
export const onSocket = (event: string, callback: (data: any) => void) => socketManager.on(event, callback);
export const offSocket = (event: string, callback?: (data: any) => void) => socketManager.off(event, callback);

export default socketManager;