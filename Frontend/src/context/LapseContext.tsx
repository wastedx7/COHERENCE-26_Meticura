import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { buildApiUrl } from '../lib/apiConfig';

const normalizeLapseRow = (row: any) => {
    const deptId = row.dept_id ?? row.department_id;
    const budget = row.budget ?? 0;
    const spent = row.total_spent ?? 0;
    const lapseAmount = Math.max(budget - spent, 0);
    return {
        id: deptId,
        department_id: deptId,
        name: row.name ?? `Department ${deptId}`,
        risk_level: row.risk_level ?? 'low',
        risk_score: row.risk_score ?? 0,
        days_until_lapse: row.days_until_lapse ?? 0,
        predicted_lapse_date: row.predicted_lapse_date ?? null,
        lapse_amount: row.lapse_amount ?? lapseAmount
    };
};

interface LapseContextType {
    predictions: any[];
    summary: any;
    critical: any[];
    isLoading: boolean;
    fetchAll: () => Promise<void>;
    fetchSummary: () => Promise<void>;
    fetchCritical: () => Promise<void>;
    fetchDeptPrediction: (id: number) => Promise<any>;
}

const LapseContext = createContext<LapseContextType>({} as LapseContextType);

export const LapseProvider = ({ children }: { children: ReactNode }) => {
    const [predictions, setPredictions] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [critical, setCritical] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const getHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('meticura_token')}` });

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(buildApiUrl('/lapse/'), { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setPredictions((data?.data || []).map(normalizeLapseRow));
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchSummary = async () => {
        try {
            const res = await fetch(buildApiUrl('/lapse/summary'), { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                const risk = data?.summary?.by_risk_level || {};
                setSummary({
                    low: risk.low || 0,
                    medium: risk.medium || 0,
                    high: risk.high || 0,
                    critical: risk.critical || 0,
                    depleted: risk.depleted || 0,
                    total: data?.summary?.total || 0
                });
            }
        } catch (e) { console.error(e); }
    };

    const fetchCritical = async () => {
        try {
            const res = await fetch(buildApiUrl('/lapse/critical?limit=10'), { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setCritical((data?.data || []).map(normalizeLapseRow));
            }
        } catch (e) { console.error(e); }
    };

    const fetchDeptPrediction = async (id: number) => {
        try {
            const res = await fetch(buildApiUrl(`/lapse/department/${id}`), { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                const p = data?.prediction || {};
                const budget = p.budget ?? 0;
                const spent = p.total_spent ?? 0;
                const lapseAmount = Math.max(budget - spent, 0);
                const lapsePct = budget > 0 ? (lapseAmount / budget) * 100 : 0;
                return {
                    department_id: p.dept_id ?? id,
                    name: `Department ${p.dept_id ?? id}`,
                    avg_daily_spend: p.days_until_lapse ? Math.round(spent / Math.max(1, 365 - p.days_until_lapse)) : 0,
                    predicted_total_spend: spent,
                    allocation: budget,
                    predicted_lapse_amount: lapseAmount,
                    predicted_lapse_pct: Number(lapsePct.toFixed(1)),
                    risk_level: p.risk_level ?? 'low',
                    days_to_fiscal_end: p.days_until_lapse ?? 0,
                    risk_score: p.risk_score ?? 0,
                    r2_score: p.r2_score ?? 0
                };
            }
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    return (
        <LapseContext.Provider value={{ predictions, summary, critical, isLoading, fetchAll, fetchSummary, fetchCritical, fetchDeptPrediction }}>
            {children}
        </LapseContext.Provider>
    );
};

export const useLapse = () => useContext(LapseContext);
