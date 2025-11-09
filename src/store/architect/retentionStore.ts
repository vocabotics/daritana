/**
 * RETENTION TRACKING STORE
 * State management for 5% retention money tracking
 */

import { create } from 'zustand';
import { retentionRecordsService, RetentionRecord } from '@/services/architect.service';

interface RetentionStore {
  records: RetentionRecord[];
  currentRecord: RetentionRecord | null;
  loading: boolean;
  error: string | null;

  fetchRecords: (projectId?: string) => Promise<void>;
  createRecord: (record: Partial<RetentionRecord>) => Promise<void>;
  updateRecord: (id: string, updates: Partial<RetentionRecord>) => Promise<void>;
  clearError: () => void;
}

export const useRetentionStore = create<RetentionStore>((set) => ({
  records: [],
  currentRecord: null,
  loading: false,
  error: null,

  fetchRecords: async (projectId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await retentionRecordsService.getAll(projectId);
      set({ records: response.data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch retention records', loading: false });
    }
  },

  createRecord: async (record: Partial<RetentionRecord>) => {
    set({ loading: true, error: null });
    try {
      const response = await retentionRecordsService.create(record);
      set((state) => ({
        records: [response.data, ...state.records],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to create retention record', loading: false });
    }
  },

  updateRecord: async (id: string, updates: Partial<RetentionRecord>) => {
    set({ loading: true, error: null });
    try {
      const response = await retentionRecordsService.update(id, updates);
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? response.data : r)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update retention record', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
