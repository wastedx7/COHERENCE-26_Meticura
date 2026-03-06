import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000/api';

const normalizeDetection = (payload: any) => {
    const detection = payload?.detection || payload;
    const combined = detection?.combined || {};
    const ml = detection?.ml_detection || {};
    const rules = detection?.rule_detection || {};
    const violations = rules?.violations || [];
    const topViolation = violations[0];
    const detectionType = ml?.flagged && rules?.flagged
        ? 'COMBINED'
        : rules?.flagged
            ? 'RULE_BASED'
            : 'ML_DETECTED';

    return {
        id: detection?.department_id,
        dept_id: detection?.department_id,
        department_id: detection?.department_id,
        name: `Department ${detection?.department_id}`,
        type: detectionType,
        rule: topViolation?.rule_name || 'N/A',
        rule_id: topViolation?.rule_name || null,
        rule_message: topViolation?.reason || null,
        message: topViolation?.reason || 'Anomaly detected by combined model',
        verdict: combined?.verdict || 'warning',
        severity: topViolation?.severity || combined?.verdict || 'medium',
        score: combined?.score ?? 0,
        combined_score: combined?.score ?? 0,
        detection_type: detectionType,
        is_resolved: false,
        raw: detection
    };
};

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
                const rows = data?.data || [];
                setAnomalies(rows.map(normalizeDetection));
            }
            const sumRes = await fetch(`${API_BASE}/anomalies/summary`, { headers: getHeaders() });
            if (sumRes.ok) {
                const data = await sumRes.json();
                const verdict = data?.summary?.by_verdict || {};
                setSummary({
                    normal: verdict.normal || 0,
                    warning: verdict.warning || 0,
                    alert: verdict.alert || 0,
                    critical: verdict.critical || 0
                });
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchCritical = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/anomalies/critical?limit=50`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                const rows = data?.data || [];
                setAnomalies(rows.map(normalizeDetection));
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchDeptAnomaly = async (id: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/anomalies/department/${id}`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setSelectedDeptAnomaly(normalizeDetection(data));
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchRules = async () => {
        try {
            const res = await fetch(`${API_BASE}/anomalies/rules`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setRules(data?.rules || []);
            }
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
