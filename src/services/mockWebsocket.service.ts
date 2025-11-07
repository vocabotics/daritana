// Mock WebSocket service for simulating real-time features
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

class MockWebSocketService {
  private listeners: Map<string, Set<Function>> = new Map();
  private presenceData: Map<string, UserPresence> = new Map();
  private currentUserId: string | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private isConnected = false;

  // Mock users for demo
  private mockUsers: UserPresence[] = [
    {
      userId: '1',
      name: 'Sarah Chen',
      email: 'sarah@daritana.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      status: 'online',
      location: 'office',
      lastSeen: new Date(),
      currentProject: 'KLCC Tower Design',
      currentPage: 'Dashboard'
    },
    {
      userId: '2',
      name: 'Ahmad Rahman',
      email: 'ahmad@daritana.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      status: 'busy',
      location: 'on-site',
      lastSeen: new Date(),
      currentProject: 'Penang Heritage Restoration',
      currentPage: 'Timeline'
    },
    {
      userId: '3',
      name: 'Lisa Wong',
      email: 'lisa@daritana.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
      status: 'online',
      location: 'home',
      lastSeen: new Date(),
      currentProject: 'Mont Kiara Residence',
      currentPage: 'Design Brief'
    },
    {
      userId: '4',
      name: 'Raj Kumar',
      email: 'raj@daritana.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      status: 'away',
      location: 'office',
      lastSeen: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      currentProject: 'Cyberjaya Tech Park',
      currentPage: 'Budget'
    },
    {
      userId: '5',
      name: 'Mei Ling',
      email: 'mei@daritana.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      status: 'online',
      location: 'office',
      lastSeen: new Date(),
      currentProject: 'Johor Waterfront',
      currentPage: 'Kanban'
    }
  ];

  connect(userId: string, token: string) {
    if (this.isConnected) return;

    this.currentUserId = userId;
    this.isConnected = true;

    // Simulate connection delay
    setTimeout(() => {
      this.emit('connection', { status: 'connected' });
      
      // Load mock users
      this.mockUsers.forEach(user => {
        if (user.userId !== userId) {
          this.presenceData.set(user.userId, user);
        }
      });

      // Send initial presence list
      this.emit('presence:list', Array.from(this.presenceData.values()));

      // Start simulating activity
      this.startSimulation();
    }, 500);
  }

  private startSimulation() {
    // Simulate random user activities
    this.intervalId = setInterval(() => {
      const users = Array.from(this.presenceData.values());
      if (users.length === 0) return;

      // Random user status change
      if (Math.random() > 0.7) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const statuses: ('online' | 'away' | 'busy')[] = ['online', 'away', 'busy'];
        randomUser.status = statuses[Math.floor(Math.random() * statuses.length)];
        randomUser.lastSeen = new Date();
        this.emit('presence:update', randomUser);
      }

      // Random user location change
      if (Math.random() > 0.9) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const locations = ['office', 'home', 'on-site', 'remote'];
        randomUser.location = locations[Math.floor(Math.random() * locations.length)];
        this.emit('presence:update', randomUser);
      }

      // Simulate new user joining
      if (Math.random() > 0.95 && users.length < 8) {
        const newUser: UserPresence = {
          userId: `new-${Date.now()}`,
          name: 'Guest User',
          email: 'guest@daritana.com',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
          status: 'online',
          location: 'office',
          lastSeen: new Date(),
          currentPage: 'Dashboard'
        };
        this.presenceData.set(newUser.userId, newUser);
        this.emit('presence:user_joined', newUser);
      }

      // Simulate user leaving
      if (Math.random() > 0.98 && users.length > 2) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        this.presenceData.delete(randomUser.userId);
        this.emit('presence:user_left', { userId: randomUser.userId, name: randomUser.name });
      }
    }, 5000);
  }

  updateUserStatus(status: 'online' | 'away' | 'busy' | 'offline') {
    // Mock implementation
    this.emit('presence:status', { status });
  }

  updateUserLocation(location: string, page?: string) {
    // Mock implementation
    this.emit('presence:location', { location, page });
  }

  joinProject(projectId: string) {
    // Mock implementation
  }

  leaveProject(projectId: string) {
    // Mock implementation
  }

  sendUpdate(update: any) {
    // Mock implementation
    setTimeout(() => {
      this.emit('update', { ...update, timestamp: new Date() });
    }, 100);
  }

  sendCursorPosition(x: number, y: number, context: string) {
    // Mock implementation
  }

  startTyping(context: string) {
    // Mock implementation
  }

  stopTyping(context: string) {
    // Mock implementation
  }

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
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.presenceData.clear();
    this.listeners.clear();
    this.isConnected = false;
  }

  isConnected(): boolean {
    return this.isConnected;
  }
}

// Use mock service for now
export const wsService = new MockWebSocketService();
export default wsService;