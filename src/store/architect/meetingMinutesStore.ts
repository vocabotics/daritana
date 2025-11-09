/**
 * MEETING MINUTES STORE
 * State management for site meeting minutes
 */

import { create } from 'zustand';
import { meetingMinutesService, MeetingMinute } from '@/services/architect.service';

interface MeetingMinutesStore {
  minutes: MeetingMinute[];
  currentMinute: MeetingMinute | null;
  loading: boolean;
  error: string | null;

  fetchMinutes: (projectId?: string) => Promise<void>;
  createMinute: (minute: Partial<MeetingMinute>) => Promise<void>;
  updateMinute: (id: string, updates: Partial<MeetingMinute>) => Promise<void>;
  clearError: () => void;
}

export const useMeetingMinutesStore = create<MeetingMinutesStore>((set) => ({
  minutes: [],
  currentMinute: null,
  loading: false,
  error: null,

  fetchMinutes: async (projectId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await meetingMinutesService.getAll(projectId);
      set({ minutes: response.data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch meeting minutes', loading: false });
    }
  },

  createMinute: async (minute: Partial<MeetingMinute>) => {
    set({ loading: true, error: null });
    try {
      const response = await meetingMinutesService.create(minute);
      set((state) => ({
        minutes: [response.data, ...state.minutes],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to create meeting minute', loading: false });
    }
  },

  updateMinute: async (id: string, updates: Partial<MeetingMinute>) => {
    set({ loading: true, error: null });
    try {
      const response = await meetingMinutesService.update(id, updates);
      set((state) => ({
        minutes: state.minutes.map((m) => (m.id === id ? response.data : m)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update meeting minute', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
