import { apiClient } from './api';
import { User } from '@/types';

// Extended types for team collaboration
export interface TeamMember {
  id: string;
  userId: string;
  organizationId: string;
  role: 'MEMBER' | 'PROJECT_LEAD' | 'SENIOR_ARCHITECT' | 'ORG_ADMIN';
  permissions: string[];
  isActive: boolean;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
}

export interface TeamPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  currentPage?: string;
  isTyping?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string; // For direct messages
  channelId?: string; // For channel messages
  projectId?: string; // For project-specific messages
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
  isEdited?: boolean;
  editedAt?: Date;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  projectId?: string;
  members: string[];
  createdBy: string;
  createdAt: Date;
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  invitedByUser: {
    name: string;
    email: string;
  };
}

// ==================== TEAM MEMBERS API ====================

export const teamMembersAPI = {
  async getAll(params?: { 
    search?: string; 
    role?: string; 
    isActive?: boolean;
    page?: number; 
    limit?: number; 
  }) {
    const response = await apiClient.get('/team/members', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/team/members/${id}`);
    return response.data;
  },

  async update(id: string, updates: Partial<TeamMember>) {
    const response = await apiClient.put(`/team/members/${id}`, updates);
    return response.data;
  },

  async remove(id: string) {
    const response = await apiClient.delete(`/team/members/${id}`);
    return response.data;
  },

  async updatePermissions(id: string, permissions: string[]) {
    const response = await apiClient.put(`/team/members/${id}/permissions`, { permissions });
    return response.data;
  },

  async deactivate(id: string, reason?: string) {
    const response = await apiClient.post(`/team/members/${id}/deactivate`, { reason });
    return response.data;
  },

  async reactivate(id: string) {
    const response = await apiClient.post(`/team/members/${id}/reactivate`);
    return response.data;
  }
};

// ==================== TEAM INVITATIONS API ====================

export const teamInvitationsAPI = {
  async getAll(params?: { 
    status?: string; 
    page?: number; 
    limit?: number; 
  }) {
    const response = await apiClient.get('/invitations', { params });
    return response.data;
  },

  async create(invitation: {
    email: string;
    role: string;
    message?: string;
  }) {
    const response = await apiClient.post('/invitations', invitation);
    return response.data;
  },

  async bulkInvite(invitations: Array<{
    email: string;
    role: string;
    message?: string;
  }>) {
    const response = await apiClient.post('/invitations/bulk', { invitations });
    return response.data;
  },

  async resend(id: string) {
    const response = await apiClient.post(`/invitations/${id}/resend`);
    return response.data;
  },

  async cancel(id: string) {
    const response = await apiClient.delete(`/invitations/${id}`);
    return response.data;
  },

  async accept(token: string) {
    const response = await apiClient.post(`/invitations/accept`, { token });
    return response.data;
  },

  async decline(token: string) {
    const response = await apiClient.post(`/invitations/decline`, { token });
    return response.data;
  }
};

// ==================== PRESENCE API ====================

export const presenceAPI = {
  async getTeamPresence() {
    const response = await apiClient.get('/team/presence');
    return response.data;
  },

  async updatePresence(status: 'online' | 'away' | 'busy') {
    const response = await apiClient.post('/team/presence', { status });
    return response.data;
  },

  async updateCurrentPage(page: string) {
    const response = await apiClient.post('/team/presence/page', { page });
    return response.data;
  },

  async setTyping(channelId: string, isTyping: boolean) {
    const response = await apiClient.post('/team/presence/typing', { channelId, isTyping });
    return response.data;
  }
};

// ==================== CHAT API ====================

export const chatAPI = {
  // Channels
  async getChannels() {
    const response = await apiClient.get('/team/chat/channels');
    return response.data;
  },

  async createChannel(channel: {
    name: string;
    description?: string;
    type: 'public' | 'private';
    projectId?: string;
    members?: string[];
  }) {
    const response = await apiClient.post('/team/chat/channels', channel);
    return response.data;
  },

  async updateChannel(id: string, updates: Partial<ChatChannel>) {
    const response = await apiClient.put(`/team/chat/channels/${id}`, updates);
    return response.data;
  },

  async deleteChannel(id: string) {
    const response = await apiClient.delete(`/team/chat/channels/${id}`);
    return response.data;
  },

  async joinChannel(id: string) {
    const response = await apiClient.post(`/team/chat/channels/${id}/join`);
    return response.data;
  },

  async leaveChannel(id: string) {
    const response = await apiClient.post(`/team/chat/channels/${id}/leave`);
    return response.data;
  },

  // Messages
  async getMessages(params: {
    channelId?: string;
    receiverId?: string; // For direct messages
    projectId?: string;
    before?: string; // Message ID for pagination
    limit?: number;
  }) {
    const response = await apiClient.get('/team/chat/messages', { params });
    return response.data;
  },

  async sendMessage(message: {
    content: string;
    channelId?: string;
    receiverId?: string;
    projectId?: string;
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
  }) {
    const response = await apiClient.post('/team/chat/messages', message);
    return response.data;
  },

  async editMessage(id: string, content: string) {
    const response = await apiClient.put(`/team/chat/messages/${id}`, { content });
    return response.data;
  },

  async deleteMessage(id: string) {
    const response = await apiClient.delete(`/team/chat/messages/${id}`);
    return response.data;
  },

  async addReaction(messageId: string, emoji: string) {
    const response = await apiClient.post(`/team/chat/messages/${messageId}/reactions`, { emoji });
    return response.data;
  },

  async removeReaction(messageId: string, emoji: string) {
    const response = await apiClient.delete(`/team/chat/messages/${messageId}/reactions/${emoji}`);
    return response.data;
  },

  // Direct messages
  async createDirectMessage(userId: string, content: string) {
    const response = await apiClient.post('/team/chat/direct', {
      receiverId: userId,
      content
    });
    return response.data;
  },

  async getDirectMessageHistory(userId: string, params?: {
    before?: string;
    limit?: number;
  }) {
    const response = await apiClient.get(`/team/chat/direct/${userId}`, { params });
    return response.data;
  }
};

// ==================== TEAM ACTIVITY API ====================

export const teamActivityAPI = {
  async getActivityFeed(params?: {
    projectId?: string;
    userId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/team/activity', { params });
    return response.data;
  },

  async logActivity(activity: {
    type: string;
    description: string;
    projectId?: string;
    resourceId?: string;
    resourceType?: string;
    metadata?: any;
  }) {
    const response = await apiClient.post('/team/activity', activity);
    return response.data;
  }
};

// ==================== COMBINED TEAM API ====================

export const teamAPI = {
  members: teamMembersAPI,
  invitations: teamInvitationsAPI,
  presence: presenceAPI,
  chat: chatAPI,
  activity: teamActivityAPI,

  // Convenience methods
  async getTeamOverview() {
    const [members, presence, channels] = await Promise.all([
      teamMembersAPI.getAll({ isActive: true }),
      presenceAPI.getTeamPresence(),
      chatAPI.getChannels()
    ]);

    return {
      members: members.members || [],
      presence: presence.presence || [],
      channels: channels.channels || []
    };
  },

  async getTeamStats() {
    const response = await apiClient.get('/team/stats');
    return response.data;
  },

  async searchTeamMembers(query: string) {
    const response = await teamMembersAPI.getAll({ search: query, limit: 10 });
    return response.members || [];
  },

  async getOnlineMembers() {
    const presence = await presenceAPI.getTeamPresence();
    return (presence.presence || []).filter((p: TeamPresence) => p.status === 'online');
  },

  async getUnreadMessages() {
    const channels = await chatAPI.getChannels();
    const totalUnread = (channels.channels || []).reduce(
      (sum: number, channel: ChatChannel) => sum + (channel.unreadCount || 0), 
      0
    );
    return totalUnread;
  }
};

export default teamAPI;