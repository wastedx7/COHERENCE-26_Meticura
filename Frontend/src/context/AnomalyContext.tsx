import React, { createContext, useContext, useState, ReactNode } from 'react';

const API_BASE = 'http://localhost:8000/api';

interface AnomalyContextType {
    anomalies: any[];
    summary: any;
    selectedDeptAnomaly: any;
    rules: any[];
    isLoading: boolean;
    fetchAll: () => Promise<void>;
    fetchCritical: () => Promise<void>;
    fetchDeptAnomaly: (id: number) => Promise<void>;
    fetchRules: () => Promise<void>;
    rescanDept: (id: number) => Promise<void>;
}

const AnomalyContext = createContext<AnomalyContextType>({} as AnomalyContextType);

export const AnomalyProvider = ({ children }: { children: ReactNode }) => {
    const [anomalies, setAnomalies] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [selectedDeptAnomaly, setSelectedDeptAnomaly] = useState<any>(null);
    const [rules, setRules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const getHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('meticura_token')}` });

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/anomalies/?limit=100`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setAnomalies(Array.isArray(data) ? data : data.items || []);
            }
            const sumRes = await fetch(`${API_BASE}/anomalies/summary`, { headers: getHeaders() });
            if (sumRes.ok) setSummary(await sumRes.json());
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchCritical = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/anomalies/critical?limit=50`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setAnomalies(Array.isArray(data) ? data : data.items || []);
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchDeptAnomaly = async (id: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/anomalies/department/${id}`, { headers: getHeaders() });
            if (res.ok) setSelectedDeptAnomaly(await res.json());
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchRules = async () => {
        try {
            const res = await fetch(`${API_BASE}/anomalies/rules`, { headers: getHeaders() });
            if (res.ok) setRules(await res.json());
        } catch (e) { console.error(e); }
    };

    const rescanDept = async (id: number) => {
        // rescan logic
        try {
            await fetch(`${API_BASE}/anomalies/rescan/${id}`, { method: 'POST', headers: getHeaders() });
            await fetchDeptAnomaly(id);
        } catch (e) { console.error(e); }
    };

    return (
        <AnomalyContext.Provider value={{ anomalies, summary, selectedDeptAnomaly, rules, isLoading, fetchAll, fetchCritical, fetchDeptAnomaly, fetchRules, rescanDept }}>
            {children}
        </AnomalyContext.Provider>
    );
};

export const useAnomaly = () => useContext(AnomalyContext);
