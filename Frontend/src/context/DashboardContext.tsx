import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
    const { user } = useAuth();
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

            if (budgetRes.ok) setBudgetOverview(await budgetRes.json());
            if (anomaliesRes.ok) {
                const data = await anomaliesRes.json();
                // Fallback for flat array vs paginated structure
                setCriticalAnomalies(Array.isArray(data) ? data : data.items || []);
            }
            if (lapseRes.ok) setLapseSummary(await lapseRes.json());
        } catch (err) {
            console.error("Dashboard fetch error", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    return (
        <DashboardContext.Provider value={{ budgetOverview, criticalAnomalies, lapseSummary, isLoading, fetchDashboardData }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => useContext(DashboardContext);
