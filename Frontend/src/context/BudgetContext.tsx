import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const API_BASE = 'http://localhost:8000/api';

interface BudgetContextType {
    overview: any;
    departments: any[];
    selectedDept: any;
    statusFilter: string;
    forecast: any[];
    isLoading: boolean;
    fetchOverview: () => Promise<void>;
    fetchByStatus: (status: string) => Promise<void>;
    fetchDeptDetail: (id: number) => Promise<void>;
    fetchComparison: (ids: number[]) => Promise<void>;
    fetchForecast: () => Promise<void>;
    fetchTopUtilization: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType>({} as BudgetContextType);

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
    const [overview, setOverview] = useState<any>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [forecast, setForecast] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const getHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('meticura_token')}` });

    const fetchOverview = async () => {
        try {
            const res = await fetch(`${API_BASE}/budget/overview`, { headers: getHeaders() });
            if (res.ok) setOverview(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const fetchByStatus = async (status: string) => {
        setStatusFilter(status);
        setIsLoading(true);
        try {
            const url = status === 'all'
                ? `${API_BASE}/budget/?limit=50&offset=0`
                : `${API_BASE}/budget/by-status/${status}?limit=50`;
            const res = await fetch(url, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setDepartments(Array.isArray(data) ? data : data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDeptDetail = async (id: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/budget/department/${id}`, { headers: getHeaders() });
            if (res.ok) setSelectedDept(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchComparison = async (ids: number[]) => {
        // API logic for multi compare
    };

    const fetchForecast = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/budget/forecast?limit=20`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setForecast(Array.isArray(data) ? data : data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTopUtilization = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/budget/top-utilization?limit=10`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setDepartments(Array.isArray(data) ? data : data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <BudgetContext.Provider value={{
            overview, departments, selectedDept, statusFilter, forecast, isLoading,
            fetchOverview, fetchByStatus, fetchDeptDetail, fetchComparison, fetchForecast, fetchTopUtilization
        }}>
            {children}
        </BudgetContext.Provider>
    );
};

export const useBudget = () => useContext(BudgetContext);
