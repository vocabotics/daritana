import { create } from 'zustand';
import { Drawing, DrawingRevision, DrawingTransmittal, DrawingFilters } from '@/types/architect';
import { drawingService } from '@/services/architect/drawing.service';

interface DrawingStore {
  // State
  drawings: Drawing[];
  currentDrawing: Drawing | null;
  transmittals: DrawingTransmittal[];
  filters: DrawingFilters;
  loading: boolean;
  error: string | null;

  // Actions
  fetchDrawings: (filters?: DrawingFilters) => Promise<void>;
  fetchDrawing: (id: string) => Promise<void>;
  uploadDrawing: (file: File, metadata: Partial<Drawing>) => Promise<Drawing>;
  createRevision: (drawingId: string, file: File, revision: Omit<DrawingRevision, 'id' | 'fileUrl' | 'fileSize'>) => Promise<DrawingRevision>;
  updateDrawingStatus: (id: string, status: Drawing['status']) => Promise<void>;
  createTransmittal: (transmittal: Omit<DrawingTransmittal, 'id' | 'transmittalNumber' | 'sentDate'>) => Promise<DrawingTransmittal>;
  acknowledgeTransmittal: (transmittalId: string) => Promise<void>;
  fetchTransmittals: (projectId: string) => Promise<void>;
  setFilters: (filters: DrawingFilters) => void;
  clearFilters: () => void;
  clearError: () => void;
}

export const useDrawingStore = create<DrawingStore>((set, get) => ({
  // Initial state
  drawings: [],
  currentDrawing: null,
  transmittals: [],
  filters: {},
  loading: false,
  error: null,

  // Fetch all drawings
  fetchDrawings: async (filters?: DrawingFilters) => {
    set({ loading: true, error: null });
    try {
      const drawings = await drawingService.getDrawings(filters || get().filters);
      set({ drawings, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch drawings', loading: false });
      console.error(error);
    }
  },

  // Fetch single drawing
  fetchDrawing: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const drawing = await drawingService.getDrawing(id);
      set({ currentDrawing: drawing, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch drawing', loading: false });
      console.error(error);
    }
  },

  // Upload new drawing
  uploadDrawing: async (file: File, metadata: Partial<Drawing>) => {
    set({ loading: true, error: null });
    try {
      const newDrawing = await drawingService.uploadDrawing(file, metadata);
      set((state) => ({
        drawings: [newDrawing, ...state.drawings],
        loading: false,
      }));
      return newDrawing;
    } catch (error) {
      set({ error: 'Failed to upload drawing', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Create revision
  createRevision: async (drawingId: string, file: File, revision: Omit<DrawingRevision, 'id' | 'fileUrl' | 'fileSize'>) => {
    set({ loading: true, error: null });
    try {
      const newRevision = await drawingService.createRevision(drawingId, file, revision);
      set((state) => {
        const updatedDrawings = state.drawings.map(drawing => {
          if (drawing.id === drawingId) {
            return {
              ...drawing,
              revisions: [...drawing.revisions, newRevision],
              currentRevision: newRevision.revision,
            };
          }
          return drawing;
        });

        const updatedCurrentDrawing = state.currentDrawing?.id === drawingId
          ? {
              ...state.currentDrawing,
              revisions: [...state.currentDrawing.revisions, newRevision],
              currentRevision: newRevision.revision,
            }
          : state.currentDrawing;

        return {
          drawings: updatedDrawings,
          currentDrawing: updatedCurrentDrawing,
          loading: false,
        };
      });
      return newRevision;
    } catch (error) {
      set({ error: 'Failed to create revision', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Update drawing status
  updateDrawingStatus: async (id: string, status: Drawing['status']) => {
    set({ loading: true, error: null });
    try {
      const updatedDrawing = await drawingService.updateDrawingStatus(id, status);
      set((state) => ({
        drawings: state.drawings.map(drawing => drawing.id === id ? updatedDrawing : drawing),
        currentDrawing: state.currentDrawing?.id === id ? updatedDrawing : state.currentDrawing,
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update drawing status', loading: false });
      console.error(error);
    }
  },

  // Create transmittal
  createTransmittal: async (transmittal: Omit<DrawingTransmittal, 'id' | 'transmittalNumber' | 'sentDate'>) => {
    set({ loading: true, error: null });
    try {
      const newTransmittal = await drawingService.createTransmittal(transmittal);
      set((state) => ({
        transmittals: [newTransmittal, ...state.transmittals],
        loading: false,
      }));
      return newTransmittal;
    } catch (error) {
      set({ error: 'Failed to create transmittal', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Acknowledge transmittal
  acknowledgeTransmittal: async (transmittalId: string) => {
    try {
      await drawingService.acknowledgeTransmittal(transmittalId);
      set((state) => ({
        transmittals: state.transmittals.map(t =>
          t.id === transmittalId ? { ...t, status: 'acknowledged' as const } : t
        )
      }));
    } catch (error) {
      console.error('Failed to acknowledge transmittal:', error);
      throw error;
    }
  },

  // Fetch transmittals
  fetchTransmittals: async (projectId: string) => {
    try {
      const transmittals = await drawingService.getTransmittals(projectId);
      set({ transmittals });
    } catch (error) {
      console.error('Failed to fetch transmittals:', error);
    }
  },

  // Set filters
  setFilters: (filters: DrawingFilters) => {
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