import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAuthToken } from '@/lib/auth';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Helper function for API calls
const apiCall = async (endpoint: string, options?: RequestInit) => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  content: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  type: 'DISCUSSION' | 'ARTICLE' | 'QUESTION' | 'ANNOUNCEMENT' | 'SHOWCASE' | 'EVENT' | 'JOB' | 'RESOURCE';
  title: string;
  content: string;
  excerpt?: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  images?: string[];
  attachments?: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'HIDDEN' | 'MODERATED';
  isPinned: boolean;
  isFeatured: boolean;
  tags: string[];
  category?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    comments: number;
    likes: number;
    shares: number;
  };
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'PUBLIC' | 'PRIVATE' | 'SECRET';
  category?: string;
  tags: string[];
  banner?: string;
  avatar?: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  memberCount: number;
  postCount: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members: number;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'DESIGN' | 'TECHNICAL' | 'CREATIVE' | 'BUSINESS' | 'MIXED';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  category?: string;
  tags: string[];
  banner?: string;
  attachments?: string[];
  rules?: string;
  prizes?: any;
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  participantCount: number;
  status: 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'JUDGING' | 'COMPLETED' | 'CANCELLED';
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    submissions: number;
  };
}

interface CommunityStore {
  // Data
  posts: Post[];
  groups: Group[];
  challenges: Challenge[];
  currentPost: Post | null;
  currentGroup: Group | null;
  currentChallenge: Challenge | null;
  
  // Loading states
  postsLoading: boolean;
  groupsLoading: boolean;
  challengesLoading: boolean;
  
  // Error states
  error: string | null;
  
  // Post actions
  fetchPosts: (params?: { page?: number; limit?: number; type?: string; category?: string }) => Promise<void>;
  fetchPost: (id: string) => Promise<void>;
  createPost: (data: Partial<Post>) => Promise<void>;
  updatePost: (id: string, data: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  sharePost: (id: string, message?: string, platform?: string) => Promise<void>;
  commentOnPost: (id: string, content: string) => Promise<void>;
  
  // Group actions
  fetchGroups: (params?: { page?: number; limit?: number; type?: string; category?: string }) => Promise<void>;
  createGroup: (data: Partial<Group>) => Promise<void>;
  joinGroup: (id: string) => Promise<void>;
  leaveGroup: (id: string) => Promise<void>;
  
  // Challenge actions
  fetchChallenges: (params?: { page?: number; limit?: number; status?: string; type?: string }) => Promise<void>;
  fetchChallenge: (id: string) => Promise<void>;
  createChallenge: (data: Partial<Challenge>) => Promise<void>;
  submitToChallenge: (id: string, data: any) => Promise<void>;
  
  // Utility
  clearError: () => void;
}

export const useCommunityStore = create<CommunityStore>()(
  persist(
    (set, get) => ({
      // Initial state
      posts: [],
      groups: [],
      challenges: [],
      currentPost: null,
      currentGroup: null,
      currentChallenge: null,
      postsLoading: false,
      groupsLoading: false,
      challengesLoading: false,
      error: null,
      
      // Post actions
      fetchPosts: async (params) => {
        set({ postsLoading: true, error: null });
        try {
          const queryParams = new URLSearchParams();
          if (params?.page) queryParams.append('page', params.page.toString());
          if (params?.limit) queryParams.append('limit', params.limit.toString());
          if (params?.type) queryParams.append('type', params.type);
          if (params?.category) queryParams.append('category', params.category);
          
          const response = await apiCall(`/community/posts?${queryParams}`);
          set({ posts: response.data, postsLoading: false });
        } catch (error) {
          set({ error: error.message, postsLoading: false });
        }
      },
      
      fetchPost: async (id) => {
        set({ postsLoading: true, error: null });
        try {
          const response = await apiCall(`/community/posts/${id}`);
          set({ currentPost: response.data, postsLoading: false });
        } catch (error) {
          set({ error: error.message, postsLoading: false });
        }
      },
      
      createPost: async (data) => {
        set({ error: null });
        try {
          const response = await apiCall('/community/posts', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          set((state) => ({ posts: [response.data, ...state.posts] }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },
      
      updatePost: async (id, data) => {
        set({ error: null });
        try {
          const response = await apiCall(`/community/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });
          set((state) => ({
            posts: state.posts.map((post) => post.id === id ? response.data : post),
            currentPost: state.currentPost?.id === id ? response.data : state.currentPost,
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },
      
      deletePost: async (id) => {
        set({ error: null });
        try {
          await apiCall(`/community/posts/${id}`, { method: 'DELETE' });
          set((state) => ({
            posts: state.posts.filter((post) => post.id !== id),
            currentPost: state.currentPost?.id === id ? null : state.currentPost,
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },
      
      likePost: async (id) => {
        set({ error: null });
        try {
          const response = await apiCall(`/community/posts/${id}/like`, {
            method: 'POST',
          });
          // Update the post with the new like status
          set((state) => ({
            posts: state.posts.map((post) => {
              if (post.id === id) {
                return {
                  ...post,
                  likeCount: response.data.liked 
                    ? post.likeCount + 1 
                    : Math.max(0, post.likeCount - 1),
                };
              }
              return post;
            }),
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      sharePost: async (id, message, platform) => {
        set({ error: null });
        try {
          await apiCall(`/community/posts/${id}/share`, {
            method: 'POST',
            body: JSON.stringify({ message, platform }),
          });
          // Update share count
          set((state) => ({
            posts: state.posts.map((post) => {
              if (post.id === id) {
                return { ...post, shareCount: post.shareCount + 1 };
              }
              return post;
            }),
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      commentOnPost: async (id, content) => {
        set({ error: null });
        try {
          const response = await apiCall(`/community/posts/${id}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
          });
          // Update comment count
          set((state) => ({
            posts: state.posts.map((post) => {
              if (post.id === id) {
                return { ...post, commentCount: post.commentCount + 1 };
              }
              return post;
            }),
            currentPost: state.currentPost?.id === id 
              ? { 
                  ...state.currentPost, 
                  commentCount: state.currentPost.commentCount + 1,
                  comments: [...(state.currentPost.comments || []), response.data]
                } 
              : state.currentPost,
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      // Group actions
      fetchGroups: async (params) => {
        set({ groupsLoading: true, error: null });
        try {
          const queryParams = new URLSearchParams();
          if (params?.page) queryParams.append('page', params.page.toString());
          if (params?.limit) queryParams.append('limit', params.limit.toString());
          if (params?.type) queryParams.append('type', params.type);
          if (params?.category) queryParams.append('category', params.category);
          
          const response = await apiCall(`/community/groups?${queryParams}`);
          set({ groups: response.data, groupsLoading: false });
        } catch (error) {
          set({ error: error.message, groupsLoading: false });
        }
      },
      
      createGroup: async (data) => {
        set({ error: null });
        try {
          const response = await apiCall('/community/groups', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          set((state) => ({ groups: [response.data, ...state.groups] }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },
      
      joinGroup: async (id) => {
        set({ error: null });
        try {
          await apiCall(`/community/groups/${id}/join`, {
            method: 'POST',
          });
          // Update member count
          set((state) => ({
            groups: state.groups.map((group) => {
              if (group.id === id) {
                return { ...group, memberCount: group.memberCount + 1 };
              }
              return group;
            }),
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      leaveGroup: async (id) => {
        set({ error: null });
        try {
          await apiCall(`/community/groups/${id}/leave`, {
            method: 'POST',
          });
          // Update member count
          set((state) => ({
            groups: state.groups.map((group) => {
              if (group.id === id) {
                return { ...group, memberCount: Math.max(0, group.memberCount - 1) };
              }
              return group;
            }),
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      // Challenge actions
      fetchChallenges: async (params) => {
        set({ challengesLoading: true, error: null });
        try {
          const queryParams = new URLSearchParams();
          if (params?.page) queryParams.append('page', params.page.toString());
          if (params?.limit) queryParams.append('limit', params.limit.toString());
          if (params?.status) queryParams.append('status', params.status);
          if (params?.type) queryParams.append('type', params.type);
          
          const response = await apiCall(`/community/challenges?${queryParams}`);
          set({ challenges: response.data, challengesLoading: false });
        } catch (error) {
          set({ error: error.message, challengesLoading: false });
        }
      },
      
      fetchChallenge: async (id) => {
        set({ challengesLoading: true, error: null });
        try {
          const response = await apiCall(`/community/challenges/${id}`);
          set({ currentChallenge: response.data, challengesLoading: false });
        } catch (error) {
          set({ error: error.message, challengesLoading: false });
        }
      },
      
      createChallenge: async (data) => {
        set({ error: null });
        try {
          const response = await apiCall('/community/challenges', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          set((state) => ({ challenges: [response.data, ...state.challenges] }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },
      
      submitToChallenge: async (id, data) => {
        set({ error: null });
        try {
          await apiCall(`/community/challenges/${id}/submit`, {
            method: 'POST',
            body: JSON.stringify(data),
          });
          // Update participant count
          set((state) => ({
            challenges: state.challenges.map((challenge) => {
              if (challenge.id === id) {
                return { ...challenge, participantCount: challenge.participantCount + 1 };
              }
              return challenge;
            }),
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },
      
      // Utility
      clearError: () => set({ error: null }),
    }),
    {
      name: 'community-store',
      partialize: (state) => ({
        // Don't persist loading states or errors
        posts: state.posts,
        groups: state.groups,
        challenges: state.challenges,
      }),
    }
  )
);