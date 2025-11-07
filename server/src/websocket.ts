import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import http from 'http';

interface UserPresence {
  userId: string;
  socketId: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  location?: string;
  lastSeen: Date;
  currentProject?: string;
  currentPage?: string;
}

class WebSocketServer {
  private io: Server | null = null;
  private userPresence: Map<string, UserPresence> = new Map();
  private socketToUser: Map<string, string> = new Map();

  initialize(server: http.Server) {
    this.io = new Server(server, {
      cors: {
        origin: ['http://localhost:5174', 'http://localhost:5173', 'http://127.0.0.1:5174'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log('🔌 WebSocket server initialized');
  }

  private setupMiddleware() {
    if (!this.io) return;

    // Authentication middleware
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        socket.data.userId = decoded.id;
        socket.data.email = decoded.email;
        socket.data.role = decoded.role;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`✅ User connected: ${socket.data.email} (${socket.id})`);

      // Initialize user presence
      const userPresence: UserPresence = {
        userId: socket.data.userId,
        socketId: socket.id,
        name: socket.data.email.split('@')[0], // Temporary, should get from DB
        email: socket.data.email,
        status: 'online',
        lastSeen: new Date(),
        location: 'office',
      };

      this.userPresence.set(socket.data.userId, userPresence);
      this.socketToUser.set(socket.id, socket.data.userId);

      // Notify others about new user
      socket.broadcast.emit('presence:user_joined', {
        userId: userPresence.userId,
        name: userPresence.name,
        email: userPresence.email,
        status: userPresence.status,
        location: userPresence.location,
      });

      // Send current online users to the new connection
      const onlineUsers = Array.from(this.userPresence.values());
      socket.emit('presence:list', onlineUsers);

      // Handle presence updates
      socket.on('presence:status', (data: { status: string }) => {
        const user = this.userPresence.get(socket.data.userId);
        if (user) {
          user.status = data.status as any;
          user.lastSeen = new Date();
          this.io?.emit('presence:update', user);
        }
      });

      socket.on('presence:location', (data: { location: string; page?: string }) => {
        const user = this.userPresence.get(socket.data.userId);
        if (user) {
          user.location = data.location;
          user.currentPage = data.page;
          user.lastSeen = new Date();
          this.io?.emit('presence:update', user);
        }
      });

      // Handle project context
      socket.on('project:join', (data: { projectId: string }) => {
        socket.join(`project:${data.projectId}`);
        const user = this.userPresence.get(socket.data.userId);
        if (user) {
          user.currentProject = data.projectId;
          this.io?.emit('presence:update', user);
        }
      });

      socket.on('project:leave', (data: { projectId: string }) => {
        socket.leave(`project:${data.projectId}`);
        const user = this.userPresence.get(socket.data.userId);
        if (user) {
          user.currentProject = undefined;
          this.io?.emit('presence:update', user);
        }
      });

      // Handle real-time updates
      socket.on('update', (data: any) => {
        // Broadcast to all users in the same project
        if (data.projectId) {
          socket.to(`project:${data.projectId}`).emit('update', {
            ...data,
            userId: socket.data.userId,
            timestamp: new Date(),
          });
        } else {
          // Global update
          socket.broadcast.emit('update', {
            ...data,
            userId: socket.data.userId,
            timestamp: new Date(),
          });
        }
      });

      // Handle cursor movements for collaboration
      socket.on('cursor:move', (data: { x: number; y: number; context: string }) => {
        socket.broadcast.emit('cursor:move', {
          ...data,
          userId: socket.data.userId,
          name: this.userPresence.get(socket.data.userId)?.name,
        });
      });

      // Handle typing indicators
      socket.on('typing:start', (data: { context: string }) => {
        socket.broadcast.emit('typing:start', {
          userId: socket.data.userId,
          name: this.userPresence.get(socket.data.userId)?.name,
          context: data.context,
        });
      });

      socket.on('typing:stop', (data: { context: string }) => {
        socket.broadcast.emit('typing:stop', {
          userId: socket.data.userId,
          context: data.context,
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.data.email} (${socket.id})`);
        
        const userId = this.socketToUser.get(socket.id);
        if (userId) {
          const user = this.userPresence.get(userId);
          if (user) {
            // Update status to offline
            user.status = 'offline';
            user.lastSeen = new Date();
            
            // Notify others
            socket.broadcast.emit('presence:user_left', {
              userId: user.userId,
              name: user.name,
            });
            
            // Remove from maps after a delay (in case of reconnection)
            setTimeout(() => {
              // Check if user hasn't reconnected
              const currentUser = this.userPresence.get(userId);
              if (currentUser && currentUser.socketId === socket.id) {
                this.userPresence.delete(userId);
              }
            }, 5000);
          }
          
          this.socketToUser.delete(socket.id);
        }
      });
    });
  }

  // Utility methods for sending notifications from other parts of the app
  sendNotification(userId: string, notification: any) {
    const user = this.userPresence.get(userId);
    if (user && this.io) {
      this.io.to(user.socketId).emit('notification', notification);
    }
  }

  broadcastUpdate(update: any) {
    if (this.io) {
      this.io.emit('update', {
        ...update,
        timestamp: new Date(),
      });
    }
  }

  getOnlineUsers(): UserPresence[] {
    return Array.from(this.userPresence.values()).filter(u => u.status !== 'offline');
  }

  getOnlineUsersCount(): number {
    return this.getOnlineUsers().length;
  }
}

export const wsServer = new WebSocketServer();
export default wsServer;