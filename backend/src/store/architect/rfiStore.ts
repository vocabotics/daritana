import { create } from 'zustand';
import { RFI, RFIFilters, RFIStatistics, RFIAttachment } from '@/types/architect';
import { rfiService } from '@/services/architect/rfi.service';

interface RFIStore {
  // State
  rfis: RFI[];
  currentRFI: RFI | null;
  statistics: RFIStatistics | null;
  filters: RFIFilters;
  loading: boolean;
  error: string | null;
  searchTerm: string;

  // Actions
  fetchRFIs: (filters?: RFIFilters) => Promise<void>;
  fetchRFI: (id: string) => Promise<void>;
  createRFI: (rfi: Omit<RFI, 'id' | 'dateCreated' | 'rfiNumber'>) => Promise<RFI>;
  updateRFI: (id: string, updates: Partial<RFI>) => Promise<void>;
  respondToRFI: (id: string, response: string, attachments?: File[]) => Promise<void>;
  uploadAttachment: (rfiId: string, file: File) => Promise<RFIAttachment>;
  fetchStatistics: (projectId?: string) => Promise<void>;
  setFilters: (filters: RFIFilters) => void;
  clearFilters: () => void;
  setSearchTerm: (term: string) => void;
  clearError: () => void;
}

export const useRFIStore = create<RFIStore>((set, get) => ({
  // Initial state
  rfis: [],
  currentRFI: null,
  statistics: null,
  filters: {},
  loading: false,
  error: null,
  searchTerm: '',

  // Fetch all RFIs
  fetchRFIs: async (filters?: RFIFilters) => {
    set({ loading: true, error: null });
    try {
      const rfis = await rfiService.getRFIs(filters || get().filters);
      set({ rfis, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch RFIs', loading: false });
      console.error(error);
    }
  },

  // Fetch single RFI
  fetchRFI: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const rfi = await rfiService.getRFI(id);
      set({ currentRFI: rfi, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch RFI', loading: false });
      console.error(error);
    }
  },

  // Create new RFI
  createRFI: async (rfi: Omit<RFI, 'id' | 'dateCreated' | 'rfiNumber'>) => {
    set({ loading: true, error: null });
    try {
      const newRFI = await rfiService.createRFI(rfi);
      set((state) => ({
        rfis: [newRFI, ...state.rfis],
        loading: false,
      }));
      return newRFI;
    } catch (error) {
      set({ error: 'Failed to create RFI', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Update RFI
  updateRFI: async (id: string, updates: Partial<RFI>) => {
    set({ loading: true, error: null });
    try {
      const updatedRFI = await rfiService.updateRFI(id, updates);
      set((state) => ({
        rfis: state.rfis.map(rfi => rfi.id === id ? updatedRFI : rfi),
        currentRFI: state.currentRFI?.id === id ? updatedRFI : state.currentRFI,
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update RFI', loading: false });
      console.error(error);
    }
  },

  // Respond to RFI
  respondToRFI: async (id: string, response: string, attachments?: File[]) => {
    set({ loading: true, error: null });
    try {
      const updatedRFI = await rfiService.respondToRFI(id, response, attachments);
      set((state) => ({
        rfis: state.rfis.map(rfi => rfi.id === id ? updatedRFI : rfi),
        currentRFI: state.currentRFI?.id === id ? updatedRFI : state.currentRFI,
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to respond to RFI', loading: false });
      console.error(error);
    }
  },

  // Upload attachment
  uploadAttachment: async (rfiId: string, file: File) => {
    set({ loading: true, error: null });
    try {
      const attachment = await rfiService.uploadAttachment(rfiId, file);
      set((state) => {
        const updatedRFIs = state.rfis.map(rfi => {
          if (rfi.id === rfiId) {
            return {
              ...rfi,
              attachments: [...rfi.attachments, attachment],
            };
          }
          return rfi;
        });

        const updatedCurrentRFI = state.currentRFI?.id === rfiId
          ? { ...state.currentRFI, attachments: [...state.currentRFI.attachments, attachment] }
          : state.currentRFI;

        return {
          rfis: updatedRFIs,
          currentRFI: updatedCurrentRFI,
          loading: false,
        };
      });
      return attachment;
    } catch (error) {
      set({ error: 'Failed to upload attachment', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Fetch statistics
  fetchStatistics: async (projectId?: string) => {
    try {
      const statistics = await rfiService.getStatistics(projectId);
      set({ statistics });
    } catch (error) {
      console.error('Failed to fetch RFI statistics:', error);
    }
  },

  // Set filters
  setFilters: (filters: RFIFilters) => {
    set({ filters });
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: {} });
  },

  // Set search term
  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));