import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';

const normalizeBudgetRow = (row: any) => ({
    id: row.department_id ?? row.id,
    name: row.department_name ?? row.name ?? `Department ${row.department_id ?? row.id ?? ''}`,
    code: row.code ?? `DPT-${String(row.department_id ?? row.id ?? '').padStart(3, '0')}`,
    status: row.status,
    allocated_amount: row.allocated_budget ?? row.allocated_amount ?? 0,
    spent_amount: row.spent_amount ?? 0,
    remaining_amount: row.remaining_budget ?? row.remaining_amount ?? 0,
    utilization_pct: row.utilization_percentage ?? row.utilization_pct ?? 0,
    category_breakdown: row.category_breakdown ?? []
});

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

    const fetchOverview = async () => {
        try {
            const res = await api.get('/budget/overview');
            const data = res.data;
            const summary = data?.summary || {};
            setOverview({
                total_allocated: summary.total_allocated_budget ?? 0,
                total_spent: summary.total_spent ?? 0,
                avg_utilization: summary.average_utilization_percentage ?? 0,
                status_counts: data?.departments_by_status || { 'on-track': 0, 'at-risk': 0, exceeded: 0 }
            });
        } catch (e) {
            console.error('[BudgetContext] Overview error:', e);
        }
    };

    const fetchByStatus = async (status: string) => {
        setStatusFilter(status);
        setIsLoading(true);
        try {
            const url = status === 'all'
                ? '/budget/?limit=50&offset=0'
                : `/budget/by-status/${status}?limit=50`;
            const res = await api.get(url);
            const data = res.data;
            const rows = status === 'all'
                ? (data?.budgets || [])
                : (data?.departments || []);
            setDepartments(rows.map(normalizeBudgetRow));
        } catch (e) {
            console.error('[BudgetContext] Fetch error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDeptDetail = async (id: number) => {
        setIsLoading(true);
        try {
            const res = await api.get(`/budget/department/${id}`);
            setSelectedDept(normalizeBudgetRow(res.data));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchComparison = async (ids: number[]) => {
        if (!ids.length) return;
        const query = ids.map((id) => `dept_ids=${id}`).join('&');
        await api.get(`/budget/comparison?${query}`);
    };

    const fetchForecast = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/budget/forecast?limit=20');
            const rows = res.data?.forecast || [];
            setForecast(rows.map((row: any) => {
                const allocated = row.allocated_budget ?? 0;
                const spent = row.spent_amount ?? 0;
                const lapse = Math.max(allocated - spent, 0);
                return {
                    id: row.department_id,
                    name: row.department_name ?? `Department ${row.department_id}`,
                    allocated: Number((allocated / 1000000).toFixed(2)),
                    spent: Number((spent / 1000000).toFixed(2)),
                    pred_spend: Number((spent / 1000000).toFixed(2)),
                    lapse: Number((lapse / 1000000).toFixed(2)),
                    risk: (row.lapse_risk?.risk_level || 'low').toUpperCase(),
                    risk_score: row.lapse_risk?.risk_score ?? 0
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTopUtilization = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/budget/top-utilization?limit=10');
            setDepartments((res.data?.top_utilization || []).map(normalizeBudgetRow));
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
