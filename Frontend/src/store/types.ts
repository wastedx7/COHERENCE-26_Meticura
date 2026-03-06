// Store Type Definitions

export interface FilterState {
  selectedDistrict: string | null;
  dateRange: { start: Date; end: Date } | null;
  anomalyFilters: {
    severity: string[];
    status: 'active' | 'resolved' | 'all';
    district: string | null;
    department: string | null;
  };
  searchQuery: string;
}

export interface FilterActions {
  setSelectedDistrict: (id: string | null) => void;
  setDateRange: (start: Date | null, end: Date | null) => void;
  setAnomalyFilters: (filters: Partial<FilterState['anomalyFilters']>) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
}

export interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'INR';
  compactMode: boolean;
  unreadAlertsCount: number;
}

export interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: UIState['theme']) => void;
  setCurrency: (currency: UIState['currency']) => void;
  toggleCompactMode: () => void;
  updateUnreadCount: (count: number) => void;
}
