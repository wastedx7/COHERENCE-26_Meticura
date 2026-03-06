import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState, UIActions } from './types';

const initialState: UIState = {
  sidebarCollapsed: false,
  theme: 'system',
  currency: 'USD',
  compactMode: false,
  unreadAlertsCount: 0,
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      ...initialState,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setTheme: (theme) =>
        set({ theme }),

      setCurrency: (currency) =>
        set({ currency }),

      toggleCompactMode: () =>
        set((state) => ({ compactMode: !state.compactMode })),

      updateUnreadCount: (count) =>
        set({ unreadAlertsCount: count }),
    }),
    {
      name: 'meticura-ui-preferences', // LocalStorage key
      partialize: (state) => ({
        // Persist UI preferences (localStorage)
        theme: state.theme,
        currency: state.currency,
        compactMode: state.compactMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
