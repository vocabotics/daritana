/**
 * CCC APPLICATIONS STORE
 * State management for Certificate of Completion & Compliance applications
 */

import { create } from 'zustand';
import { cccApplicationsService, CCCApplication } from '@/services/architect.service';

interface CCCApplicationsStore {
  // State
  applications: CCCApplication[];
  currentApplication: CCCApplication | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: {
    projectId?: string;
    localAuthority?: string;
    status?: string;
  };

  // Actions
  fetchApplications: (projectId?: string) => Promise<void>;
  createApplication: (application: Partial<CCCApplication>) => Promise<void>;
  updateApplication: (id: string, updates: Partial<CCCApplication>) => Promise<void>;
  setFilters: (filters: CCCApplicationsStore['filters']) => void;
  setSearchTerm: (term: string) => void;
  clearError: () => void;
}

export const useCCCApplicationsStore = create<CCCApplicationsStore>((set, get) => ({
  // Initial state
  applications: [],
  currentApplication: null,
  loading: false,
  error: null,
  searchTerm: '',
  filters: {},

  // Fetch all applications
  fetchApplications: async (projectId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await cccApplicationsService.getAll(projectId);
      set({ applications: response.data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch CCC applications', loading: false });
    }
  },

  // Create application
  createApplication: async (application: Partial<CCCApplication>) => {
    set({ loading: true, error: null });
    try {
      const response = await cccApplicationsService.create(application);
      set((state) => ({
        applications: [response.data, ...state.applications],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to create application', loading: false });
    }
  },

  // Update application
  updateApplication: async (id: string, updates: Partial<CCCApplication>) => {
    set({ loading: true, error: null });
    try {
      const response = await cccApplicationsService.update(id, updates);
      set((state) => ({
        applications: state.applications.map((a) => (a.id === id ? response.data : a)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update application', loading: false });
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters });
  },

  // Set search term
  setSearchTerm: (term) => {
    set({ searchTerm: term });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
