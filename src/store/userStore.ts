import { create } from 'zustand';
import { usersApi } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  organizationId: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  department?: string;
  skills?: string[];
  costPerHour?: number;
  avatar?: string;
}

interface UserStore {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchUsers: (params?: any) => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  searchUsers: (query: string, options?: any) => Promise<User[]>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  
  // Local state management
  setUsers: (users: User[]) => void;
  setCurrentUser: (user: User | null) => void;
  clearError: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,

  fetchUsers: async (params?: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersApi.getAll(params);
      if (response.data) {
        set({ users: response.data.data || response.data || [], isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch users', isLoading: false });
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchUserById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersApi.getById(id);
      if (response.data) {
        const user = response.data.user || response.data;
        set({ currentUser: user, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch user', isLoading: false });
      }
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  searchUsers: async (query: string, options?: any) => {
    try {
      const response = await usersApi.search(query, options);
      if (response.data) {
        return response.data.users || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  },

  updateProfile: async (data: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersApi.updateProfile(data);
      if (response.data) {
        const updatedUser = response.data.user || response.data;
        set((state) => ({
          currentUser: state.currentUser?.id === updatedUser.id ? updatedUser : state.currentUser,
          users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
          isLoading: false
        }));
      } else {
        set({ error: response.error || 'Failed to update profile', isLoading: false });
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setUsers: (users: User[]) => set({ users }),
  setCurrentUser: (user: User | null) => set({ currentUser: user }),
  clearError: () => set({ error: null })
}));