import { create } from 'zustand';
import { ChangeOrder, ChangeOrderApproval } from '@/types/architect';
import { changeOrderService } from '@/services/architect/changeOrder.service';

interface ChangeOrderStore {
  // State
  changeOrders: ChangeOrder[];
  currentChangeOrder: ChangeOrder | null;
  costSummary: {
    original: number;
    approved: number;
    pending: number;
    total: number;
  } | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchChangeOrders: (projectId?: string) => Promise<void>;
  fetchChangeOrder: (id: string) => Promise<void>;
  createChangeOrder: (changeOrder: Omit<ChangeOrder, 'id' | 'changeOrderNumber' | 'createdAt' | 'updatedAt'>) => Promise<ChangeOrder>;
  updateChangeOrder: (id: string, updates: Partial<ChangeOrder>) => Promise<void>;
  approveChangeOrder: (id: string, approval: Omit<ChangeOrderApproval, 'id'>) => Promise<void>;
  uploadDocument: (changeOrderId: string, file: File) => Promise<string>;
  fetchCostSummary: (projectId: string) => Promise<void>;
  clearError: () => void;
}

export const useChangeOrderStore = create<ChangeOrderStore>((set, get) => ({
  // Initial state
  changeOrders: [],
  currentChangeOrder: null,
  costSummary: null,
  loading: false,
  error: null,

  // Fetch all change orders
  fetchChangeOrders: async (projectId?: string) => {
    set({ loading: true, error: null });
    try {
      const changeOrders = await changeOrderService.getChangeOrders(projectId);
      set({ changeOrders, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch change orders', loading: false });
      console.error(error);
    }
  },

  // Fetch single change order
  fetchChangeOrder: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const changeOrder = await changeOrderService.getChangeOrder(id);
      set({ currentChangeOrder: changeOrder, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch change order', loading: false });
      console.error(error);
    }
  },

  // Create new change order
  createChangeOrder: async (changeOrder: Omit<ChangeOrder, 'id' | 'changeOrderNumber' | 'createdAt' | 'updatedAt'>) => {
    set({ loading: true, error: null });
    try {
      const newChangeOrder = await changeOrderService.createChangeOrder(changeOrder);
      set((state) => ({
        changeOrders: [newChangeOrder, ...state.changeOrders],
        loading: false,
      }));
      return newChangeOrder;
    } catch (error) {
      set({ error: 'Failed to create change order', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Update change order
  updateChangeOrder: async (id: string, updates: Partial<ChangeOrder>) => {
    set({ loading: true, error: null });
    try {
      const updatedChangeOrder = await changeOrderService.updateChangeOrder(id, updates);
      set((state) => ({
        changeOrders: state.changeOrders.map(co => co.id === id ? updatedChangeOrder : co),
        currentChangeOrder: state.currentChangeOrder?.id === id ? updatedChangeOrder : state.currentChangeOrder,
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update change order', loading: false });
      console.error(error);
    }
  },

  // Approve change order
  approveChangeOrder: async (id: string, approval: Omit<ChangeOrderApproval, 'id'>) => {
    set({ loading: true, error: null });
    try {
      const updatedChangeOrder = await changeOrderService.approveChangeOrder(id, approval);
      set((state) => ({
        changeOrders: state.changeOrders.map(co => co.id === id ? updatedChangeOrder : co),
        currentChangeOrder: state.currentChangeOrder?.id === id ? updatedChangeOrder : state.currentChangeOrder,
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to approve change order', loading: false });
      console.error(error);
    }
  },

  // Upload document
  uploadDocument: async (changeOrderId: string, file: File) => {
    set({ loading: true, error: null });
    try {
      const documentUrl = await changeOrderService.uploadDocument(changeOrderId, file);
      set({ loading: false });
      return documentUrl;
    } catch (error) {
      set({ error: 'Failed to upload document', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Fetch cost summary
  fetchCostSummary: async (projectId: string) => {
    try {
      const costSummary = await changeOrderService.getCostSummary(projectId);
      set({ costSummary });
    } catch (error) {
      console.error('Failed to fetch cost summary:', error);
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));