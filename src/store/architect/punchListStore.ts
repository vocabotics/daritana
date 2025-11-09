import { create } from 'zustand';
import { PunchItem, PunchPhoto, PunchComment, PunchListFilters, PunchStatistics } from '@/types/architect';
import { punchListService } from '@/services/architect/punchList.service';

interface PunchListStore {
  // State
  punchItems: PunchItem[];
  currentPunchItem: PunchItem | null;
  statistics: PunchStatistics | null;
  filters: PunchListFilters;
  loading: boolean;
  error: string | null;

  // Actions
  fetchPunchItems: (filters?: PunchListFilters) => Promise<void>;
  fetchPunchItem: (id: string) => Promise<void>;
  createPunchItem: (item: Omit<PunchItem, 'id' | 'itemNumber' | 'createdAt'>) => Promise<PunchItem>;
  updatePunchItem: (id: string, updates: Partial<PunchItem>) => Promise<void>;
  uploadPhotos: (itemId: string, photos: File[], type: PunchPhoto['type']) => Promise<PunchPhoto[]>;
  addComment: (itemId: string, comment: Omit<PunchComment, 'id' | 'timestamp'>) => Promise<PunchComment>;
  updateStatus: (id: string, status: PunchItem['status'], verifiedBy?: string) => Promise<void>;
  fetchStatistics: (projectId?: string) => Promise<void>;
  exportReport: (projectId: string, format: 'pdf' | 'excel') => Promise<string>;
  setFilters: (filters: PunchListFilters) => void;
  clearFilters: () => void;
  clearError: () => void;
}

export const usePunchListStore = create<PunchListStore>((set, get) => ({
  // Initial state
  punchItems: [],
  currentPunchItem: null,
  statistics: null,
  filters: {},
  loading: false,
  error: null,

  // Fetch all punch items
  fetchPunchItems: async (filters?: PunchListFilters) => {
    set({ loading: true, error: null });
    try {
      const punchItems = await punchListService.getPunchItems(filters || get().filters);
      set({ punchItems, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch punch items', loading: false });
      console.error(error);
    }
  },

  // Fetch single punch item
  fetchPunchItem: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const punchItem = await punchListService.getPunchItem(id);
      set({ currentPunchItem: punchItem, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch punch item', loading: false });
      console.error(error);
    }
  },

  // Create new punch item
  createPunchItem: async (item: Omit<PunchItem, 'id' | 'itemNumber' | 'createdAt'>) => {
    set({ loading: true, error: null });
    try {
      const newPunchItem = await punchListService.createPunchItem(item);
      set((state) => ({
        punchItems: [newPunchItem, ...state.punchItems],
        loading: false,
      }));
      return newPunchItem;
    } catch (error) {
      set({ error: 'Failed to create punch item', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Update punch item
  updatePunchItem: async (id: string, updates: Partial<PunchItem>) => {
    set({ loading: true, error: null });
    try {
      const updatedPunchItem = await punchListService.updatePunchItem(id, updates);
      set((state) => ({
        punchItems: state.punchItems.map(item => item.id === id ? updatedPunchItem : item),
        currentPunchItem: state.currentPunchItem?.id === id ? updatedPunchItem : state.currentPunchItem,
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update punch item', loading: false });
      console.error(error);
    }
  },

  // Upload photos
  uploadPhotos: async (itemId: string, photos: File[], type: PunchPhoto['type']) => {
    set({ loading: true, error: null });
    try {
      const newPhotos = await punchListService.uploadPhotos(itemId, photos, type);
      set((state) => {
        const updatedPunchItems = state.punchItems.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              photos: [...item.photos, ...newPhotos],
            };
          }
          return item;
        });

        const updatedCurrentPunchItem = state.currentPunchItem?.id === itemId
          ? { ...state.currentPunchItem, photos: [...state.currentPunchItem.photos, ...newPhotos] }
          : state.currentPunchItem;

        return {
          punchItems: updatedPunchItems,
          currentPunchItem: updatedCurrentPunchItem,
          loading: false,
        };
      });
      return newPhotos;
    } catch (error) {
      set({ error: 'Failed to upload photos', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Add comment
  addComment: async (itemId: string, comment: Omit<PunchComment, 'id' | 'timestamp'>) => {
    set({ loading: true, error: null });
    try {
      const newComment = await punchListService.addComment(itemId, comment);
      set((state) => {
        const updatedPunchItems = state.punchItems.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              comments: [...item.comments, newComment],
            };
          }
          return item;
        });

        const updatedCurrentPunchItem = state.currentPunchItem?.id === itemId
          ? { ...state.currentPunchItem, comments: [...state.currentPunchItem.comments, newComment] }
          : state.currentPunchItem;

        return {
          punchItems: updatedPunchItems,
          currentPunchItem: updatedCurrentPunchItem,
          loading: false,
        };
      });
      return newComment;
    } catch (error) {
      set({ error: 'Failed to add comment', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Update status
  updateStatus: async (id: string, status: PunchItem['status'], verifiedBy?: string) => {
    set({ loading: true, error: null });
    try {
      const updatedPunchItem = await punchListService.updateStatus(id, status, verifiedBy);
      set((state) => ({
        punchItems: state.punchItems.map(item => item.id === id ? updatedPunchItem : item),
        currentPunchItem: state.currentPunchItem?.id === id ? updatedPunchItem : state.currentPunchItem,
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update status', loading: false });
      console.error(error);
    }
  },

  // Fetch statistics
  fetchStatistics: async (projectId?: string) => {
    try {
      const statistics = await punchListService.getStatistics(projectId);
      set({ statistics });
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  },

  // Export report
  exportReport: async (projectId: string, format: 'pdf' | 'excel') => {
    set({ loading: true, error: null });
    try {
      const reportUrl = await punchListService.exportReport(projectId, format);
      set({ loading: false });
      return reportUrl;
    } catch (error) {
      set({ error: 'Failed to export report', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Set filters
  setFilters: (filters: PunchListFilters) => {
    set({ filters });
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: {} });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));