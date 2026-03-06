import React, { createContext, useContext, useState, ReactNode } from 'react';

const API_BASE = 'http://localhost:8000/api';

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
            const res = await fetch(`${API_BASE}/lapse/`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setPredictions(Array.isArray(data) ? data : data.items || []);
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchSummary = async () => {
        try {
            const res = await fetch(`${API_BASE}/lapse/summary`, { headers: getHeaders() });
            if (res.ok) setSummary(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchCritical = async () => {
        try {
            const res = await fetch(`${API_BASE}/lapse/critical?limit=10`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setCritical(Array.isArray(data) ? data : data.items || []);
            }
        } catch (e) { console.error(e); }
    };

    const fetchDeptPrediction = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE}/lapse/department/${id}`, { headers: getHeaders() });
            if (res.ok) return await res.json();
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
