import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DemoStore {
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      isEnabled: false, // Default to real data mode
      
      setEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled });
      },
      
      toggle: () => {
        set((state) => ({ isEnabled: !state.isEnabled }));
      },
    }),
    {
      name: 'demo-mode-store',
    }
  )
);