import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface DashboardContextType {
    budgetOverview: any;
    criticalAnomalies: any[];
    lapseSummary: any;
    isLoading: boolean;
    fetchDashboardData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType>({} as DashboardContextType);

// Helper for API calls
const API_BASE = 'http://localhost:8000/api';

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    useAuth();
    const [budgetOverview, setBudgetOverview] = useState<any>(null);
    const [criticalAnomalies, setCriticalAnomalies] = useState<any[]>([]);
    const [lapseSummary, setLapseSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('meticura_token')}` };

            const [budgetRes, anomaliesRes, lapseRes] = await Promise.all([
                fetch(`${API_BASE}/budget/overview`, { headers }),
                fetch(`${API_BASE}/anomalies/critical?limit=5`, { headers }),
                fetch(`${API_BASE}/lapse/summary`, { headers })
            ]);

            if (budgetRes.ok) {
                const budget = await budgetRes.json();
                const summary = budget?.summary || {};
                setBudgetOverview({
                    total_allocated: summary.total_allocated_budget ?? 0,
                    total_spent: summary.total_spent ?? 0,
                    avg_utilization: summary.average_utilization_percentage ?? 0,
                    status_counts: budget?.departments_by_status || {}
                });
            }
            if (anomaliesRes.ok) {
                const data = await anomaliesRes.json();
                setCriticalAnomalies(data?.data || []);
            }
            if (lapseRes.ok) {
                const data = await lapseRes.json();
                setLapseSummary(data?.summary || {});
            }
        } catch (err) {
            console.error("Dashboard fetch error", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <DashboardContext.Provider value={{ budgetOverview, criticalAnomalies, lapseSummary, isLoading, fetchDashboardData }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => useContext(DashboardContext);
