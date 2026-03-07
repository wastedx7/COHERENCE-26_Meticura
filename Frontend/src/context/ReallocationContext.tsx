import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { buildApiUrl } from '../lib/apiConfig';

const normalizeSuggestion = (row: any) => ({
    id: row.id,
    donor_id: row.donor_dept_id,
    recipient_id: row.recipient_dept_id,
    amount: row.suggested_amount,
    priority: row.priority,
    status: row.status,
    reason: row.reason,
    donor_department_id: row.donor_dept_id,
    recipient_department_id: row.recipient_dept_id,
    suggested_amount: row.suggested_amount,
    donor_predicted_lapse: row.donor_predicted_lapse ?? 0,
    recipient_predicted_deficit: row.recipient_predicted_deficit ?? 0,
    same_district: row.same_district ?? false,
    notes: row.notes,
    approved_at: row.approved_at,
    executed_at: row.executed_at
});

interface ReallocationContextType {
    suggestions: any[];
    summary: any;
    selectedSuggestion: any;
    isLoading: boolean;
    fetchSuggestions: (status?: string) => Promise<void>;
    fetchSuggestion: (id: number) => Promise<void>;
    approve: (id: number, notes: string) => Promise<void>;
    reject: (id: number, reason: string) => Promise<void>;
    execute: (id: number) => Promise<void>;
}

const ReallocationContext = createContext<ReallocationContextType>({} as ReallocationContextType);

export const ReallocationProvider = ({ children }: { children: ReactNode }) => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const getHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('meticura_token')}`,
        'Content-Type': 'application/json'
    });

    const fetchSuggestions = async (status: string = 'pending') => {
        setIsLoading(true);
        try {
            const res = await fetch(buildApiUrl(`/reallocation/suggestions?status=${status}&limit=50`), { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setSuggestions((Array.isArray(data) ? data : []).map(normalizeSuggestion));
            }
            const sumRes = await fetch(buildApiUrl('/reallocation/summary'), { headers: getHeaders() });
            if (sumRes.ok) {
                const data = await sumRes.json();
                setSummary({
                    pending: data.pending_count || 0,
                    approved: data.approved_count || 0,
                    rejected: data.rejected_count || 0,
                    executed: data.executed_count || 0,
                    total_amount_pending: data.total_amount_pending || 0,
                    total_amount_approved: data.total_amount_approved || 0
                });
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchSuggestion = async (id: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(buildApiUrl(`/reallocation/suggestion/${id}`), { headers: getHeaders() });
            if (res.ok) setSelectedSuggestion(normalizeSuggestion(await res.json()));
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const approve = async (id: number, notes: string) => {
        try {
            const res = await fetch(buildApiUrl(`/reallocation/suggestion/${id}/approve`), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ notes })
            });
            if (res.ok) await fetchSuggestions();
        } catch (e) { console.error(e); }
    };

    const reject = async (id: number, reason: string) => {
        try {
            const res = await fetch(buildApiUrl(`/reallocation/suggestion/${id}/reject`), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ reason })
            });
            if (res.ok) await fetchSuggestions();
        } catch (e) { console.error(e); }
    };

    const execute = async (id: number) => {
        try {
            const res = await fetch(buildApiUrl(`/reallocation/suggestion/${id}/execute`), {
                method: 'POST',
                headers: getHeaders()
            });
            if (res.ok) await fetchSuggestions('executed');
        } catch (e) { console.error(e); }
    };

    return (
        <ReallocationContext.Provider value={{
            suggestions, summary, selectedSuggestion, isLoading, fetchSuggestions, fetchSuggestion, approve, reject, execute
        }}>
            {children}
        </ReallocationContext.Provider>
    );
};

export const useReallocation = () => useContext(ReallocationContext);
