import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterState, FilterActions } from './types';

const initialState: FilterState = {
  selectedDistrict: null,
  dateRange: null,
  anomalyFilters: {
    severity: [],
    status: 'all',
    district: null,
    department: null,
  },
  searchQuery: '',
};

export const useFilterStore = create<FilterState & FilterActions>()(
  persist(
    (set) => ({
      ...initialState,

      setSelectedDistrict: (id) =>
        set({ selectedDistrict: id }),

      setDateRange: (start, end) =>
        set({
          dateRange: start && end ? { start, end } : null,
        }),

      setAnomalyFilters: (filters) =>
        set((state) => ({
          anomalyFilters: {
            ...state.anomalyFilters,
            ...filters,
          },
        })),

      setSearchQuery: (query) =>
        set({ searchQuery: query }),

      clearFilters: () =>
        set(initialState),
    }),
    {
      name: 'meticura-filters', // Storage key
      partialize: (state) => ({
        // Only persist selected items (session storage)
        selectedDistrict: state.selectedDistrict,
        searchQuery: state.searchQuery,
      }),
    }
  )
);
