import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import teamService from '@/services/team.service';

// Types for team management
export interface TeamMember {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
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
  receiverId?: string;
  channelId?: string;
  projectId?: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  attachments?: any[];
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

interface TeamStore {
  // Team data
  members: TeamMember[];
  invitations: TeamInvitation[];
  presence: TeamPresence[];
  channels: ChatChannel[];
  messages: ChatMessage[];
  currentChannel: string | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingMembers: boolean;
  isLoadingChannels: boolean;
  isLoadingMessages: boolean;
  isLoadingInvitations: boolean;
  error: string | null;
  
  // API methods - Members
  fetchMembers: (params?: { search?: string; role?: string; isActive?: boolean }) => Promise<void>;
  getMemberById: (id: string) => Promise<TeamMember | null>;
  updateMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  updateMemberPermissions: (id: string, permissions: string[]) => Promise<void>;
  deactivateMember: (id: string, reason?: string) => Promise<void>;
  reactivateMember: (id: string) => Promise<void>;
  
  // API methods - Invitations
  fetchInvitations: (params?: { status?: string }) => Promise<void>;
  createInvitation: (invitation: { email: string; role: string; message?: string }) => Promise<void>;
  bulkInvite: (invitations: Array<{ email: string; role: string; message?: string }>) => Promise<void>;
  resendInvitation: (id: string) => Promise<void>;
  cancelInvitation: (id: string) => Promise<void>;
  acceptInvitation: (token: string) => Promise<void>;
  declineInvitation: (token: string) => Promise<void>;
  
  // API methods - Presence
  fetchTeamPresence: () => Promise<void>;
  updatePresence: (status: 'online' | 'away' | 'busy') => Promise<void>;
  updateCurrentPage: (page: string) => Promise<void>;
  setTyping: (channelId: string, isTyping: boolean) => Promise<void>;
  
  // API methods - Chat
  fetchChannels: () => Promise<void>;
  createChannel: (channel: { name: string; description?: string; type: 'public' | 'private'; projectId?: string; members?: string[] }) => Promise<void>;
  updateChannel: (id: string, updates: Partial<ChatChannel>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  joinChannel: (id: string) => Promise<void>;
  leaveChannel: (id: string) => Promise<void>;
  
  // API methods - Messages
  fetchMessages: (params: { channelId?: string; receiverId?: string; projectId?: string; before?: string; limit?: number }) => Promise<void>;
  sendMessage: (message: { content: string; channelId?: string; receiverId?: string; projectId?: string; attachments?: any[] }) => Promise<void>;
  editMessage: (id: string, content: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  createDirectMessage: (userId: string, content: string) => Promise<void>;
  getDirectMessageHistory: (userId: string, params?: { before?: string; limit?: number }) => Promise<void>;
  
  // API methods - Activity
  fetchActivityFeed: (params?: { projectId?: string; userId?: string; type?: string }) => Promise<any>;
  logActivity: (activity: { type: string; description: string; projectId?: string; resourceId?: string; resourceType?: string; metadata?: any }) => Promise<void>;
  
  // Convenience methods
  getTeamOverview: () => Promise<any>;
  getTeamStats: () => Promise<any>;
  searchTeamMembers: (query: string) => Promise<TeamMember[]>;
  getOnlineMembers: () => Promise<TeamPresence[]>;
  getUnreadMessages: () => Promise<number>;
  
  // UI state
  setCurrentChannel: (channelId: string | null) => void;
  
  // Getters
  getMembersByRole: (role: string) => TeamMember[];
  getActiveMembers: () => TeamMember[];
  getOnlineMembersCount: () => number;
  getChannelById: (id: string) => ChatChannel | undefined;
  getDirectChannels: () => ChatChannel[];
  getPublicChannels: () => ChatChannel[];
  getPrivateChannels: () => ChatChannel[];
  getUnreadChannelsCount: () => number;
  
  // Utility methods
  clearError: () => void;
  reset: () => void;
}

// Default empty data for initial state
const defaultMembers: TeamMember[] = [];

const defaultChannels: ChatChannel[] = [];

const defaultPresence: TeamPresence[] = [];

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      // Team data
      members: defaultMembers,
      invitations: [],
      presence: defaultPresence,
      channels: defaultChannels,
      messages: [],
      currentChannel: null,
      
      // Loading states
      isLoading: false,
      isLoadingMembers: false,
      isLoadingChannels: false,
      isLoadingMessages: false,
      isLoadingInvitations: false,
      error: null,
      
      // API methods - Members
      fetchMembers: async (params) => {
        set({ isLoadingMembers: true, error: null });
        try {
          const response = await teamService.getMembers(params);
          const transformedMembers = response.members?.map((m: any) => teamService.transformMember(m)) || [];
          set({ 
            members: transformedMembers.length > 0 ? transformedMembers : defaultMembers,
            isLoadingMembers: false 
          });
        } catch (error) {
          console.error('Failed to fetch members:', error);
          set({ 
            members: defaultMembers, // Fallback to default data
            error: 'Failed to fetch members - using mock data',
            isLoadingMembers: false 
          });
        }
      },
      
      getMemberById: async (id) => {
        try {
          const member = await teamService.getMemberById(id);
          return member ? teamService.transformMember(member) : null;
        } catch (error) {
          console.error('Failed to get member:', error);
          return get().members.find(m => m.userId === id || m.id === id) || null;
        }
      },
      
      updateMember: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const updatedMember = await teamService.updateMember(id, updates);
          const transformed = teamService.transformMember(updatedMember);
          set((state) => ({
            members: state.members.map(member => 
              (member.userId === id || member.id === id) ? transformed : member
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to update member:', error);
          // Fallback to local update
          set((state) => ({
            members: state.members.map(member => 
              (member.userId === id || member.id === id) ? { ...member, ...updates } : member
            ),
            error: 'Updated locally - sync pending',
            isLoading: false
          }));
        }
      },
      
      removeMember: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await teamService.removeMember(id);
          set((state) => ({
            members: state.members.filter(member => member.userId !== id && member.id !== id),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to remove member:', error);
          set({ 
            error: 'Failed to remove member',
            isLoading: false 
          });
        }
      },
      
      updateMemberPermissions: async (id, permissions) => {
        set({ isLoading: true, error: null });
        try {
          const updatedMember = await teamService.updateMember(id, { permissions });
          const transformed = teamService.transformMember(updatedMember);
          set((state) => ({
            members: state.members.map(member => 
              (member.userId === id || member.id === id) ? transformed : member
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to update member permissions:', error);
          set({ 
            error: 'Failed to update permissions',
            isLoading: false 
          });
        }
      },
      
      deactivateMember: async (id, reason) => {
        set({ isLoading: true, error: null });
        try {
          const updatedMember = await teamService.updateMember(id, { isActive: false });
          const transformed = teamService.transformMember(updatedMember);
          set((state) => ({
            members: state.members.map(member => 
              (member.userId === id || member.id === id) ? transformed : member
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to deactivate member:', error);
          set({ 
            error: 'Failed to deactivate member',
            isLoading: false 
          });
        }
      },
      
      reactivateMember: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const updatedMember = await teamService.updateMember(id, { isActive: true });
          const transformed = teamService.transformMember(updatedMember);
          set((state) => ({
            members: state.members.map(member => 
              (member.userId === id || member.id === id) ? transformed : member
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to reactivate member:', error);
          set({ 
            error: 'Failed to reactivate member',
            isLoading: false 
          });
        }
      },
      
      // API methods - Invitations
      fetchInvitations: async (params) => {
        set({ isLoadingInvitations: true, error: null });
        try {
          // Invitations API not yet implemented in backend
          set({ 
            invitations: [],
            isLoadingInvitations: false 
          });
        } catch (error) {
          console.error('Failed to fetch invitations:', error);
          set({ 
            invitations: [],
            error: 'Failed to fetch invitations',
            isLoadingInvitations: false 
          });
        }
      },
      
      createInvitation: async (invitation) => {
        set({ isLoading: true, error: null });
        try {
          // Invitations API not yet implemented in backend
          set({ 
            error: 'Invitations feature coming soon',
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to create invitation:', error);
          set({ 
            error: 'Failed to create invitation',
            isLoading: false 
          });
        }
      },
      
      bulkInvite: async (invitations) => {
        set({ isLoading: true, error: null });
        try {
          // Bulk invitations not yet implemented in backend
          set({ 
            error: 'Bulk invitations feature coming soon',
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to bulk invite:', error);
          set({ 
            error: 'Failed to send invitations',
            isLoading: false 
          });
        }
      },
      
      resendInvitation: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // Invitations not yet implemented in backend
          set({ 
            error: 'Invitations feature coming soon',
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to resend invitation:', error);
          set({ 
            error: 'Failed to resend invitation',
            isLoading: false 
          });
        }
      },
      
      cancelInvitation: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // Invitations not yet implemented in backend
          set((state) => ({
            invitations: state.invitations.filter(inv => inv.id !== id),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to cancel invitation:', error);
          set({ 
            error: 'Failed to cancel invitation',
            isLoading: false 
          });
        }
      },
      
      acceptInvitation: async (token) => {
        set({ isLoading: true, error: null });
        try {
          // Invitations not yet implemented in backend
          set({ 
            error: 'Invitations feature coming soon',
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to accept invitation:', error);
          set({ 
            error: 'Failed to accept invitation',
            isLoading: false 
          });
        }
      },
      
      declineInvitation: async (token) => {
        set({ isLoading: true, error: null });
        try {
          // Invitations not yet implemented in backend
          set({ 
            error: 'Invitations feature coming soon',
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to decline invitation:', error);
          set({ 
            error: 'Failed to decline invitation',
            isLoading: false 
          });
        }
      },
      
      // API methods - Presence
      fetchTeamPresence: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await teamService.getPresence();
          set({ 
            presence: response.presence || defaultPresence,
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to fetch team presence:', error);
          set({ 
            presence: defaultPresence,
            error: 'Failed to fetch presence - using mock data',
            isLoading: false 
          });
        }
      },
      
      updatePresence: async (status) => {
        try {
          await teamService.updatePresence(status);
          // Update local presence
          const currentUserId = localStorage.getItem('userId') || 'current-user';
          set((state) => ({
            presence: state.presence.map(p => 
              p.userId === currentUserId ? { ...p, status, lastSeen: new Date() } : p
            )
          }));
        } catch (error) {
          console.error('Failed to update presence:', error);
        }
      },
      
      updateCurrentPage: async (page) => {
        try {
          // Current page tracking not yet implemented in backend
          const currentUserId = localStorage.getItem('userId') || 'current-user';
          set((state) => ({
            presence: state.presence.map(p => 
              p.userId === currentUserId ? { ...p, currentPage: page, lastSeen: new Date() } : p
            )
          }));
        } catch (error) {
          console.error('Failed to update current page:', error);
        }
      },
      
      setTyping: async (channelId, isTyping) => {
        try {
          // Typing status not yet implemented in backend
          const currentUserId = localStorage.getItem('userId') || 'current-user';
          set((state) => ({
            presence: state.presence.map(p => 
              p.userId === currentUserId ? { ...p, isTyping } : p
            )
          }));
        } catch (error) {
          console.error('Failed to set typing status:', error);
        }
      },
      
      // API methods - Chat
      fetchChannels: async () => {
        set({ isLoadingChannels: true, error: null });
        try {
          const response = await teamService.getChannels();
          set({ 
            channels: response.channels || defaultChannels,
            isLoadingChannels: false 
          });
        } catch (error) {
          console.error('Failed to fetch channels:', error);
          set({ 
            channels: defaultChannels,
            error: 'Failed to fetch channels - using mock data',
            isLoadingChannels: false 
          });
        }
      },
      
      createChannel: async (channel) => {
        set({ isLoading: true, error: null });
        try {
          // Chat channels not yet implemented in backend
          const newChannel = {
            id: Date.now().toString(),
            ...channel,
            createdAt: new Date(),
            members: channel.members || [],
            createdBy: localStorage.getItem('userId') || 'current-user'
          };
          set((state) => ({
            channels: [...state.channels, newChannel],
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to create channel:', error);
          set({ 
            error: 'Failed to create channel',
            isLoading: false 
          });
        }
      },
      
      updateChannel: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          // Chat channels not yet implemented in backend
          set((state) => ({
            channels: state.channels.map(channel => 
              channel.id === id ? { ...channel, ...updates } : channel
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to update channel:', error);
          set({ 
            error: 'Failed to update channel',
            isLoading: false 
          });
        }
      },
      
      deleteChannel: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // Chat channels not yet implemented in backend
          set((state) => ({
            channels: state.channels.filter(channel => channel.id !== id),
            currentChannel: state.currentChannel === id ? null : state.currentChannel,
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to delete channel:', error);
          set({ 
            error: 'Failed to delete channel',
            isLoading: false 
          });
        }
      },
      
      joinChannel: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // Chat channels not yet implemented in backend
          const currentUserId = localStorage.getItem('userId') || 'current-user';
          set((state) => ({
            channels: state.channels.map(channel => 
              channel.id === id 
                ? { ...channel, members: [...channel.members, currentUserId] }
                : channel
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to join channel:', error);
          set({ 
            error: 'Failed to join channel',
            isLoading: false 
          });
        }
      },
      
      leaveChannel: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // Chat channels not yet implemented in backend
          const currentUserId = localStorage.getItem('userId') || 'current-user';
          set((state) => ({
            channels: state.channels.map(channel => 
              channel.id === id 
                ? { ...channel, members: channel.members.filter(m => m !== currentUserId) }
                : channel
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to leave channel:', error);
          set({ 
            error: 'Failed to leave channel',
            isLoading: false 
          });
        }
      },
      
      // API methods - Messages
      fetchMessages: async (params) => {
        set({ isLoadingMessages: true, error: null });
        try {
          const response = await teamService.getMessages(params);
          set({ 
            messages: response.messages || [],
            isLoadingMessages: false 
          });
        } catch (error) {
          console.error('Failed to fetch messages:', error);
          set({ 
            messages: [],
            error: 'Failed to fetch messages',
            isLoadingMessages: false 
          });
        }
      },
      
      sendMessage: async (message) => {
        set({ isLoading: true, error: null });
        try {
          const response = await teamService.sendMessage(message);
          set((state) => ({
            messages: [...state.messages, response.message],
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to send message:', error);
          set({ 
            error: 'Failed to send message',
            isLoading: false 
          });
        }
      },
      
      editMessage: async (id, content) => {
        set({ isLoading: true, error: null });
        try {
          const response = await teamService.updateMessage(id, content);
          set((state) => ({
            messages: state.messages.map(msg => 
              msg.id === id ? response.message : msg
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to edit message:', error);
          set({ 
            error: 'Failed to edit message',
            isLoading: false 
          });
        }
      },
      
      deleteMessage: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await teamService.deleteMessage(id);
          set((state) => ({
            messages: state.messages.filter(msg => msg.id !== id),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to delete message:', error);
          set({ 
            error: 'Failed to delete message',
            isLoading: false 
          });
        }
      },
      
      addReaction: async (messageId, emoji) => {
        try {
          // Message reactions not yet implemented in backend
          const currentUserId = localStorage.getItem('userId') || 'current-user';
          set((state) => ({
            messages: state.messages.map(msg => {
              if (msg.id === messageId) {
                const reactions = msg.reactions || [];
                const existingReaction = reactions.find(r => r.emoji === emoji);
                
                if (existingReaction) {
                  return {
                    ...msg,
                    reactions: reactions.map(r => 
                      r.emoji === emoji 
                        ? { ...r, users: [...r.users, currentUserId] }
                        : r
                    )
                  };
                } else {
                  return {
                    ...msg,
                    reactions: [...reactions, { emoji, users: [currentUserId] }]
                  };
                }
              }
              return msg;
            })
          }));
        } catch (error) {
          console.error('Failed to add reaction:', error);
        }
      },
      
      removeReaction: async (messageId, emoji) => {
        try {
          // Message reactions not yet implemented in backend
          const currentUserId = localStorage.getItem('userId') || 'current-user';
          set((state) => ({
            messages: state.messages.map(msg => {
              if (msg.id === messageId) {
                const reactions = (msg.reactions || []).map(r => 
                  r.emoji === emoji 
                    ? { ...r, users: r.users.filter(u => u !== currentUserId) }
                    : r
                ).filter(r => r.users.length > 0);
                
                return { ...msg, reactions };
              }
              return msg;
            })
          }));
        } catch (error) {
          console.error('Failed to remove reaction:', error);
        }
      },
      
      createDirectMessage: async (userId, content) => {
        set({ isLoading: true, error: null });
        try {
          const response = await teamService.startDirectMessage(userId);
          // Then send the message
          const messageResponse = await teamService.sendMessage({
            content,
            receiverId: userId
          });
          set((state) => ({
            messages: [...state.messages, messageResponse.message],
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to create direct message:', error);
          set({ 
            error: 'Failed to send direct message',
            isLoading: false 
          });
        }
      },
      
      getDirectMessageHistory: async (userId, params) => {
        set({ isLoadingMessages: true, error: null });
        try {
          // Direct messages not yet fully implemented
          const response = await teamService.getMessages({
            ...params,
            receiverId: userId
          });
          set({ 
            messages: response.messages || [],
            isLoadingMessages: false 
          });
        } catch (error) {
          console.error('Failed to get direct message history:', error);
          set({ 
            messages: [],
            error: 'Failed to fetch message history',
            isLoadingMessages: false 
          });
        }
      },
      
      // API methods - Activity
      fetchActivityFeed: async (params) => {
        try {
          // Activity feed not yet implemented in backend
          return [];
        } catch (error) {
          console.error('Failed to fetch activity feed:', error);
          return [];
        }
      },
      
      logActivity: async (activity) => {
        try {
          // Activity logging not yet implemented in backend
          console.log('Activity logged:', activity);
        } catch (error) {
          console.error('Failed to log activity:', error);
        }
      },
      
      // Convenience methods
      getTeamOverview: async () => {
        try {
          const [members, analytics, workload] = await Promise.all([
            teamService.getMembers({ isActive: true }),
            teamService.getAnalytics(),
            teamService.getWorkload()
          ]);
          return {
            members: members.members?.map((m: any) => teamService.transformMember(m)) || get().members,
            analytics,
            workload
          };
        } catch (error) {
          console.error('Failed to get team overview:', error);
          return {
            members: get().members,
            presence: get().presence,
            channels: get().channels
          };
        }
      },
      
      getTeamStats: async () => {
        try {
          const analytics = await teamService.getAnalytics();
          return analytics;
        } catch (error) {
          console.error('Failed to get team stats:', error);
          return null;
        }
      },
      
      searchTeamMembers: async (query) => {
        try {
          const response = await teamService.getMembers({ search: query, limit: 10 });
          return response.members?.map((m: any) => teamService.transformMember(m)) || [];
        } catch (error) {
          console.error('Failed to search team members:', error);
          return get().members.filter(m => 
            m.user.name.toLowerCase().includes(query.toLowerCase()) ||
            m.user.email.toLowerCase().includes(query.toLowerCase())
          );
        }
      },
      
      getOnlineMembers: async () => {
        try {
          const response = await teamService.getOnlineUsers();
          return response.users || get().presence.filter(p => p.status === 'online');
        } catch (error) {
          console.error('Failed to get online members:', error);
          return get().presence.filter(p => p.status === 'online');
        }
      },
      
      getUnreadMessages: async () => {
        try {
          // Unread messages not yet implemented in backend
          return get().channels.reduce((sum, channel) => sum + (channel.unreadCount || 0), 0);
        } catch (error) {
          console.error('Failed to get unread messages:', error);
          return get().channels.reduce((sum, channel) => sum + (channel.unreadCount || 0), 0);
        }
      },
      
      // UI state
      setCurrentChannel: (channelId) => set({ currentChannel: channelId }),
      
      // Getters
      getMembersByRole: (role) => {
        return get().members.filter(member => member.role === role);
      },
      
      getActiveMembers: () => {
        return get().members.filter(member => member.isActive);
      },
      
      getOnlineMembersCount: () => {
        return get().presence.filter(p => p.status === 'online').length;
      },
      
      getChannelById: (id) => {
        return get().channels.find(channel => channel.id === id);
      },
      
      getDirectChannels: () => {
        return get().channels.filter(channel => channel.type === 'direct');
      },
      
      getPublicChannels: () => {
        return get().channels.filter(channel => channel.type === 'public');
      },
      
      getPrivateChannels: () => {
        return get().channels.filter(channel => channel.type === 'private');
      },
      
      getUnreadChannelsCount: () => {
        return get().channels.reduce((sum, channel) => sum + (channel.unreadCount || 0), 0);
      },
      
      // Utility methods
      clearError: () => set({ error: null }),
      
      reset: () => set({
        members: [],
        invitations: [],
        presence: [],
        channels: [],
        messages: [],
        currentChannel: null,
        isLoading: false,
        isLoadingMembers: false,
        isLoadingChannels: false,
        isLoadingMessages: false,
        isLoadingInvitations: false,
        error: null
      })
    }),
    {
      name: 'team-store',
      partialize: (state) => ({
        currentChannel: state.currentChannel,
        // Don't persist API data, only user preferences
      }),
    }
  )
);