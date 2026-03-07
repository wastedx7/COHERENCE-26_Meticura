import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

interface DashboardContextType {
    budgetOverview: any;
    criticalAnomalies: any[];
    lapseSummary: any;
    isLoading: boolean;
    fetchDashboardData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType>({} as DashboardContextType);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    useAuth();
    const [budgetOverview, setBudgetOverview] = useState<any>(null);
    const [criticalAnomalies, setCriticalAnomalies] = useState<any[]>([]);
    const [lapseSummary, setLapseSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [budgetResult, anomaliesResult, lapseResult] = await Promise.allSettled([
                api.get('/budget/overview'),
                api.get('/anomalies/critical?limit=5'),
                api.get('/lapse/summary'),
            ]);

            if (budgetResult.status === 'fulfilled') {
                const budget = budgetResult.value.data;
                const summary = budget?.summary || {};
                setBudgetOverview({
                    total_allocated: summary.total_allocated_budget ?? 0,
                    total_spent: summary.total_spent ?? 0,
                    avg_utilization: summary.average_utilization_percentage ?? 0,
                    status_counts: budget?.departments_by_status || {}
                });
            }
            if (anomaliesResult.status === 'fulfilled') {
                setCriticalAnomalies(anomaliesResult.value.data?.data || []);
            }
            if (lapseResult.status === 'fulfilled') {
                setLapseSummary(lapseResult.value.data?.summary || {});
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
