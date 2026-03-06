import React, { createContext, useContext, useState, ReactNode } from 'react';

const API_BASE = 'http://localhost:8000/api';

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
            const res = await fetch(`${API_BASE}/reallocation/suggestions?status=${status}&limit=50`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setSuggestions(Array.isArray(data) ? data : data.items || []);
            }
            const sumRes = await fetch(`${API_BASE}/reallocation/summary`, { headers: getHeaders() });
            if (sumRes.ok) setSummary(await sumRes.json());
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchSuggestion = async (id: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/reallocation/suggestion/${id}`, { headers: getHeaders() });
            if (res.ok) setSelectedSuggestion(await res.json());
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const approve = async (id: number, notes: string) => {
        try {
            const res = await fetch(`${API_BASE}/reallocation/suggestion/${id}/approve`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ notes })
            });
            if (res.ok) fetchSuggestions();
        } catch (e) { console.error(e); }
    };

    const reject = async (id: number, reason: string) => {
        try {
            const res = await fetch(`${API_BASE}/reallocation/suggestion/${id}/reject`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ reason })
            });
            if (res.ok) fetchSuggestions();
        } catch (e) { console.error(e); }
    };

    const execute = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE}/reallocation/suggestion/${id}/execute`, {
                method: 'POST',
                headers: getHeaders()
            });
            if (res.ok) fetchSuggestions('executed');
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
