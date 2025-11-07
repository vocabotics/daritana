import { create } from 'zustand';

interface UIState {
  // Modal states
  showCreateProjectModal: boolean;
  showCreateTaskModal: boolean;
  
  // Actions
  setShowCreateProjectModal: (show: boolean) => void;
  setShowCreateTaskModal: (show: boolean) => void;
  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
  openCreateTaskModal: () => void;
  closeCreateTaskModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial states
  showCreateProjectModal: false,
  showCreateTaskModal: false,
  
  // Actions
  setShowCreateProjectModal: (show) => set({ showCreateProjectModal: show }),
  setShowCreateTaskModal: (show) => set({ showCreateTaskModal: show }),
  
  openCreateProjectModal: () => set({ showCreateProjectModal: true }),
  closeCreateProjectModal: () => set({ showCreateProjectModal: false }),
  
  openCreateTaskModal: () => set({ showCreateTaskModal: true }),
  closeCreateTaskModal: () => set({ showCreateTaskModal: false }),
}));