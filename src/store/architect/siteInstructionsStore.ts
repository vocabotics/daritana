/**
 * SITE INSTRUCTIONS STORE
 * State management for site instruction register
 */

import { create } from 'zustand';
import { siteInstructionsService, SiteInstruction } from '@/services/architect.service';

interface SiteInstructionsStore {
  instructions: SiteInstruction[];
  currentInstruction: SiteInstruction | null;
  loading: boolean;
  error: string | null;

  fetchInstructions: (projectId?: string) => Promise<void>;
  createInstruction: (instruction: Partial<SiteInstruction>) => Promise<void>;
  updateInstruction: (id: string, updates: Partial<SiteInstruction>) => Promise<void>;
  deleteInstruction: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSiteInstructionsStore = create<SiteInstructionsStore>((set) => ({
  instructions: [],
  currentInstruction: null,
  loading: false,
  error: null,

  fetchInstructions: async (projectId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await siteInstructionsService.getAll(projectId);
      set({ instructions: response.data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch site instructions', loading: false });
    }
  },

  createInstruction: async (instruction: Partial<SiteInstruction>) => {
    set({ loading: true, error: null });
    try {
      const response = await siteInstructionsService.create(instruction);
      set((state) => ({
        instructions: [response.data, ...state.instructions],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to create site instruction', loading: false });
    }
  },

  updateInstruction: async (id: string, updates: Partial<SiteInstruction>) => {
    set({ loading: true, error: null });
    try {
      const response = await siteInstructionsService.update(id, updates);
      set((state) => ({
        instructions: state.instructions.map((i) => (i.id === id ? response.data : i)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update site instruction', loading: false });
    }
  },

  deleteInstruction: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await siteInstructionsService.delete(id);
      set((state) => ({
        instructions: state.instructions.filter((i) => i.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete site instruction', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
