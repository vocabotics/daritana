/**
 * DEFECTS LIABILITY PERIOD STORE
 * State management for DLP tracking
 */

import { create } from 'zustand';
import { dlpRecordsService, DLPRecord } from '@/services/architect.service';

interface DLPStore {
  records: DLPRecord[];
  currentRecord: DLPRecord | null;
  loading: boolean;
  error: string | null;

  fetchRecords: (projectId?: string) => Promise<void>;
  createRecord: (record: Partial<DLPRecord>) => Promise<void>;
  updateRecord: (id: string, updates: Partial<DLPRecord>) => Promise<void>;
  clearError: () => void;
}

export const useDLPStore = create<DLPStore>((set) => ({
  records: [],
  currentRecord: null,
  loading: false,
  error: null,

  fetchRecords: async (projectId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await dlpRecordsService.getAll(projectId);
      set({ records: response.data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch DLP records', loading: false });
    }
  },

  createRecord: async (record: Partial<DLPRecord>) => {
    set({ loading: true, error: null });
    try {
      const response = await dlpRecordsService.create(record);
      set((state) => ({
        records: [response.data, ...state.records],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to create DLP record', loading: false });
    }
  },

  updateRecord: async (id: string, updates: Partial<DLPRecord>) => {
    set({ loading: true, error: null });
    try {
      const response = await dlpRecordsService.update(id, updates);
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? response.data : r)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update DLP record', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
