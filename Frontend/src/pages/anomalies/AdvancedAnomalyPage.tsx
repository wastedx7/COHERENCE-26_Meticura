import React, { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';

interface AnomalyResult {
    department_id: number;
    rule_name?: string;
    severity?: string;
    score?: number;
    reason?: string;
    combined?: { verdict: string; score: number };
}

export function AdvancedAnomalyPage() {
    const [query, setQuery] = useState('');
    const [ruleFilter, setRuleFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [minScore, setMinScore] = useState(0);
    const [results, setResults] = useState<AnomalyResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const doSearch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSearched(true);
        try {
            // If a specific rule is selected, use rule endpoint
            if (ruleFilter) {
                const res = await api.get(`/anomalies/rule/${ruleFilter}?limit=100`);
                let data: AnomalyResult[] = res.data?.data || [];
                if (severityFilter) data = data.filter(d => d.severity === severityFilter);
                if (minScore > 0) data = data.filter(d => (d.score || 0) >= minScore);
                if (query) data = data.filter(d => String(d.department_id).includes(query) || d.reason?.toLowerCase().includes(query.toLowerCase()));
                setResults(data);
            } else if (severityFilter) {
                // Use severity endpoint
                const res = await api.get(`/anomalies/advanced/by-severity?min_severity=${severityFilter}&limit=200`);
                let data: AnomalyResult[] = res.data?.data || [];
                if (query) data = data.filter(d => String(d.department_id).includes(query) || d.reason?.toLowerCase().includes(query.toLowerCase()));
                setResults(data);
            } else if (query) {
                // Use search endpoint
                const params = new URLSearchParams({ query, min_score: String(minScore), limit: '100' });
                const res = await api.get(`/anomalies/advanced/search?${params}`);
                setResults(res.data?.data || []);
            } else {
                // Default: get all by score
                const res = await api.get('/anomalies/?limit=100');
                setResults(res.data?.data || []);
            }
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Search failed');
        } finally {
            setIsLoading(false);
        }
    }, [query, ruleFilter, severityFilter, minScore]);

    const loadSample = () => {
        setQuery('');
        setSeverityFilter('high');
        setRuleFilter('');
        setMinScore(0.3);
    };

    const verdictColor = (v: string) => {
        switch (v) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'alert': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
    };

    const sevColor = (s: string) => {
        switch (s) {
            case 'critical': return 'bg-red-50 text-red-600';
            case 'high': return 'bg-orange-50 text-orange-600';
            case 'medium': return 'bg-amber-50 text-amber-600';
            default: return 'bg-slate-50 text-slate-600';
        }
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Advanced Anomaly Search</h1>
                <p className="text-slate-500 mt-1">Cross-filter anomalies by severity, rule ID, and custom queries</p>
            </div>

            <div className="glass-panel p-6 mb-8 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search by department ID..." value={query} onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && doSearch()}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <select value={ruleFilter} onChange={e => setRuleFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">All Rules</option>
                        <option value="zero_transaction_check">Zero Transactions</option>
                        <option value="inactivity_check">Inactivity</option>
                        <option value="end_of_period_spike">End Period Spike</option>
                        <option value="fund_diversion_check">Fund Diversion</option>
                        <option value="round_number_check">Round Number</option>
                        <option value="same_amount_check">Same Amount</option>
                        <option value="budget_overshoot_check">Budget Overshoot</option>
                        <option value="utilization_drop_check">Utilization Drop</option>
                    </select>
                    <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600 font-medium">Min Score:</label>
                        <input type="range" min="0" max="1" step="0.05" value={minScore} onChange={e => setMinScore(Number(e.target.value))}
                            className="w-32 accent-indigo-600" />
                        <span className="text-sm font-mono text-slate-700 w-10">{minScore.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-3 ml-auto">
                        <button onClick={loadSample} className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2">
                            Load Sample Query <ArrowRight className="w-4 h-4" />
                        </button>
                        <button onClick={doSearch} disabled={isLoading}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg shadow-sm font-medium flex items-center gap-2 transition-colors">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SlidersHorizontal className="w-4 h-4" />} Filter Results
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="glass-card p-4 mb-6 bg-red-50 border-red-200 flex items-center gap-3 text-red-700">
                    <AlertTriangle className="w-5 h-5" /> {error}
                </div>
            )}

            {results.length > 0 && (
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">{results.length} result{results.length !== 1 ? 's' : ''}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="text-left p-3 font-semibold text-slate-600">Department</th>
                                    <th className="text-left p-3 font-semibold text-slate-600">Rule / Verdict</th>
                                    <th className="text-center p-3 font-semibold text-slate-600">Severity</th>
                                    <th className="text-right p-3 font-semibold text-slate-600">Score</th>
                                    <th className="text-left p-3 font-semibold text-slate-600">Reason</th>
                                    <th className="text-center p-3 font-semibold text-slate-600">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3 font-medium text-slate-800">Dept #{r.department_id}</td>
                                        <td className="p-3 text-slate-700">
                                            {r.rule_name || (
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${verdictColor(r.combined?.verdict || 'normal')}`}>
                                                    {r.combined?.verdict || 'N/A'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {r.severity && (
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${sevColor(r.severity)}`}>
                                                    {r.severity}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                                            {(r.score ?? r.combined?.score ?? 0).toFixed(3)}
                                        </td>
                                        <td className="p-3 text-slate-600 max-w-xs truncate">{r.reason || '—'}</td>
                                        <td className="p-3 text-center">
                                            <Link to={`/anomalies/department/${r.department_id}`}
                                                className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                                                Investigate
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {searched && results.length === 0 && !isLoading && !error && (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-200">
                    <Search className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No matching anomalies found</h3>
                    <p className="max-w-md mt-2 text-slate-500">Try broadening your filters or searching with a different department ID.</p>
                </div>
            )}

            {!searched && (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-200">
                    <Search className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">Configure filters and search</h3>
                    <p className="max-w-md mt-2 text-slate-500">Enter your query parameters above to fetch filtered anomalies across the historical dataset.</p>
                    <button onClick={loadSample} className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2">
                        Load Sample Query <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
