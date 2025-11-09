/**
 * AUTHORITY SUBMISSIONS STORE
 * State management for Malaysian authority submissions (DBKL, MBPJ, MBSA, etc.)
 */

import { create } from 'zustand';
import { authoritySubmissionsService, AuthoritySubmission } from '@/services/architect.service';

interface AuthoritySubmissionsStore {
  // State
  submissions: AuthoritySubmission[];
  currentSubmission: AuthoritySubmission | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: {
    projectId?: string;
    authority?: string;
    status?: string;
    submissionType?: string;
  };

  // Actions
  fetchSubmissions: (projectId?: string) => Promise<void>;
  createSubmission: (submission: Partial<AuthoritySubmission>) => Promise<void>;
  updateSubmission: (id: string, updates: Partial<AuthoritySubmission>) => Promise<void>;
  deleteSubmission: (id: string) => Promise<void>;
  setFilters: (filters: AuthoritySubmissionsStore['filters']) => void;
  setSearchTerm: (term: string) => void;
  clearError: () => void;
}

export const useAuthoritySubmissionsStore = create<AuthoritySubmissionsStore>((set, get) => ({
  // Initial state
  submissions: [],
  currentSubmission: null,
  loading: false,
  error: null,
  searchTerm: '',
  filters: {},

  // Fetch all submissions
  fetchSubmissions: async (projectId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await authoritySubmissionsService.getAll(projectId);
      set({ submissions: response.data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch submissions', loading: false });
    }
  },

  // Create submission
  createSubmission: async (submission: Partial<AuthoritySubmission>) => {
    set({ loading: true, error: null });
    try {
      const response = await authoritySubmissionsService.create(submission);
      set((state) => ({
        submissions: [response.data, ...state.submissions],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to create submission', loading: false });
    }
  },

  // Update submission
  updateSubmission: async (id: string, updates: Partial<AuthoritySubmission>) => {
    set({ loading: true, error: null });
    try {
      const response = await authoritySubmissionsService.update(id, updates);
      set((state) => ({
        submissions: state.submissions.map((s) => (s.id === id ? response.data : s)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update submission', loading: false });
    }
  },

  // Delete submission
  deleteSubmission: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await authoritySubmissionsService.delete(id);
      set((state) => ({
        submissions: state.submissions.filter((s) => s.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete submission', loading: false });
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
