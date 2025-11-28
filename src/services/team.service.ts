import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

// SECURITY: Create axios instance with HTTP-Only cookie authentication
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HTTP-Only cookies with all requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add organization context interceptor (cookies handle auth automatically)
apiClient.interceptors.request.use(
  (config) => {
    // Get organization ID from auth store instead of localStorage
    const organizationId = useAuthStore.getState().organization?.id;

    if (organizationId) {
      config.headers['X-Organization-Id'] = organizationId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // SECURITY: Cookies cleared by backend on logout
      // Just redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types matching backend response
export interface TeamMemberResponse {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  department?: string;
  title?: string;
  isActive: boolean;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    avatar?: string;
    position?: string;
    department?: string;
    phone?: string;
    bio?: string;
    lastActiveAt?: string;
    isActive: boolean;
    onlineStatus?: 'online' | 'offline';
    projectCount?: number;
    activeTasks?: number;
  };
}

export interface TeamAnalytics {
  summary: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    utilizationRate: number;
  };
  distribution: {
    byRole: Array<{ role: string; count: number }>;
    byDepartment: Array<{ department: string; count: number }>;
  };
  recentJoiners: TeamMemberResponse[];
  topPerformers: Array<{
    user: any;
    completedTasks: number;
  }>;
  utilization: Array<{
    user: any;
    utilization: number;
    estimatedHours: number;
  }>;
}

export interface TeamWorkload {
  workload: Array<{
    member: any;
    role: string;
    department?: string;
    workload: {
      activeTasks: number;
      projectsCount: number;
      overdueTasksCount: number;
      completedThisMonth: number;
      estimatedHours: number;
      level: 'LOW' | 'MEDIUM' | 'HIGH';
    };
  }>;
  summary: {
    averageActiveTasks: number;
    totalActiveTasks: number;
    overloadedMembers: number;
    availableMembers: number;
  };
}

// Team Service
export const teamService = {
  // ==================== MEMBERS ====================
  async getMembers(params?: {
    role?: string;
    department?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const response = await apiClient.get('/team/members', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      throw error;
    }
  },

  async getMemberById(id: string) {
    try {
      const response = await apiClient.get(`/team/members/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch team member:', error);
      throw error;
    }
  },

  async updateMember(id: string, data: {
    role?: string;
    permissions?: string[];
    department?: string;
    title?: string;
    isActive?: boolean;
  }) {
    try {
      const response = await apiClient.put(`/team/members/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update team member:', error);
      throw error;
    }
  },

  async removeMember(id: string) {
    try {
      const response = await apiClient.delete(`/team/members/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to remove team member:', error);
      throw error;
    }
  },

  // ==================== ANALYTICS ====================
  async getAnalytics() {
    try {
      const response = await apiClient.get('/team/analytics');
      return response.data as TeamAnalytics;
    } catch (error) {
      console.error('Failed to fetch team analytics:', error);
      throw error;
    }
  },

  async getWorkload() {
    try {
      const response = await apiClient.get('/team/workload');
      return response.data as TeamWorkload;
    } catch (error) {
      console.error('Failed to fetch team workload:', error);
      throw error;
    }
  },

  // ==================== PRESENCE ====================
  async getPresence() {
    try {
      const response = await apiClient.get('/team/presence');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch team presence:', error);
      throw error;
    }
  },

  async updatePresence(status: 'online' | 'away' | 'busy') {
    try {
      const response = await apiClient.post('/team/presence', { status });
      return response.data;
    } catch (error) {
      console.error('Failed to update presence:', error);
      throw error;
    }
  },

  async setStatusMessage(message: string) {
    try {
      const response = await apiClient.post('/team/presence/status', { message });
      return response.data;
    } catch (error) {
      console.error('Failed to set status message:', error);
      throw error;
    }
  },

  async getOnlineUsers() {
    try {
      const response = await apiClient.get('/team/presence/online');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch online users:', error);
      throw error;
    }
  },

  // ==================== CHAT ====================
  async getChannels() {
    try {
      const response = await apiClient.get('/team/channels');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      throw error;
    }
  },

  async getMessages(params?: {
    channelId?: string;
    before?: string;
    limit?: number;
  }) {
    try {
      const response = await apiClient.get('/team/messages', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  },

  async sendMessage(data: {
    content: string;
    channelId?: string;
    receiverId?: string;
    projectId?: string;
  }) {
    try {
      const response = await apiClient.post('/team/messages', data);
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  async updateMessage(id: string, content: string) {
    try {
      const response = await apiClient.put(`/team/messages/${id}`, { content });
      return response.data;
    } catch (error) {
      console.error('Failed to update message:', error);
      throw error;
    }
  },

  async deleteMessage(id: string) {
    try {
      const response = await apiClient.delete(`/team/messages/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  },

  async startDirectMessage(userId: string) {
    try {
      const response = await apiClient.post(`/team/direct-messages/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to start direct message:', error);
      throw error;
    }
  },

  async searchMessages(query: string) {
    try {
      const response = await apiClient.get('/team/messages/search', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search messages:', error);
      throw error;
    }
  },

  // ==================== ACTIVITY ====================
  async getUserActivity(userId: string) {
    try {
      const response = await apiClient.get(`/team/activity/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
      throw error;
    }
  },

  async getActivityAnalytics() {
    try {
      const response = await apiClient.get('/team/activity/analytics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch activity analytics:', error);
      throw error;
    }
  },

  // ==================== HELPERS ====================
  // Transform backend response to frontend format
  transformMember(member: TeamMemberResponse) {
    return {
      id: member.id,
      userId: member.userId,
      organizationId: member.organizationId,
      role: member.role,
      permissions: member.permissions,
      isActive: member.isActive,
      joinedAt: new Date(member.joinedAt),
      user: {
        id: member.user.id,
        name: member.user.name || `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || member.user.email,
        email: member.user.email,
        profileImage: member.user.avatar,
        isOnline: member.user.onlineStatus === 'online',
        lastSeen: member.user.lastActiveAt ? new Date(member.user.lastActiveAt) : undefined,
      }
    };
  }
};

export default teamService;