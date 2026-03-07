import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Map, Search, FileText, Download, TrendingUp, Building2, BarChart3, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface DeptRow { id: number; name: string; allocated_amount: number; spent_amount: number; utilization_pct: number; status: string; }

export default function CitizenPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<DeptRow[]>([]);
    const [overview, setOverview] = useState<any>(null);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        api.get('/budget/overview')
            .then(r => {
                const s = r.data?.summary || {};
                setOverview({
                    total_allocated: s.total_allocated_budget ?? 0,
                    total_spent: s.total_spent ?? 0,
                    avg_utilization: s.average_utilization_percentage ?? 0,
                    dept_count: r.data?.departments_by_status ? Object.values(r.data.departments_by_status as Record<string, number>).reduce((a: number, b) => a + b, 0) : 0,
                });
            })
            .catch(() => {});
    }, []);

    const doSearch = useCallback(async () => {
        if (!query.trim()) { setResults([]); return; }
        setSearching(true);
        try {
            const res = await api.get(`/budget/?limit=200&offset=0`);
            const rows = (res.data?.budgets ?? []).map((r: any) => ({
                id: r.department_id ?? r.id,
                name: r.department_name ?? r.name ?? `Dept ${r.department_id}`,
                allocated_amount: r.allocated_budget ?? r.allocated_amount ?? 0,
                spent_amount: r.spent_amount ?? 0,
                utilization_pct: r.utilization_percentage ?? r.utilization_pct ?? 0,
                status: r.status ?? 'unknown',
            }));
            const q = query.toLowerCase();
            setResults(rows.filter((d: DeptRow) => d.name.toLowerCase().includes(q) || String(d.id).includes(q)));
        } catch { setResults([]); }
        setSearching(false);
    }, [query]);

    const fmt = (n: number) => {
        if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
        if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} L`;
        return `₹${n.toLocaleString()}`;
    };

    const statusBadge = (s: string) => {
        const m: Record<string, string> = { 'on-track': 'bg-emerald-100 text-emerald-700', 'at-risk': 'bg-amber-100 text-amber-700', exceeded: 'bg-red-100 text-red-700' };
        return m[s] || 'bg-slate-100 text-slate-600';
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10 animate-fade-in">
                <header className="flex justify-between items-center mb-12 bg-white/60 backdrop-blur-lg border border-white/40 p-4 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Coherent<span className="text-indigo-600">Citizen</span></h1>
                    </div>
                </header>

                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-100 mb-4">Public Transparency Portal</span>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">See how your tax money is distributed across the region</h2>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">Access real-time data on departmental budgets, resource reallocation, and AI-driven anomaly detection.</p>

                    <div className="relative max-w-xl mx-auto">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && doSearch()}
                            placeholder="Search for a department by name or ID..."
                            className="w-full pl-12 pr-28 py-4 bg-white/80 backdrop-blur border border-slate-200 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                        />
                        <button onClick={doSearch} disabled={searching} className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors">
                            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                        </button>
                    </div>
                </div>

                {/* Search Results */}
                {results.length > 0 && (
                    <div className="mb-12 glass-card overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-white/60 backdrop-blur">
                            <h3 className="font-bold text-slate-800">Search Results ({results.length})</h3>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                            {results.map(d => (
                                <div key={d.id} className="flex items-center justify-between p-4 hover:bg-white/50 transition-colors">
                                    <div>
                                        <p className="font-semibold text-slate-800">{d.name}</p>
                                        <p className="text-xs text-slate-500">ID: {d.id} &bull; Utilization: {d.utilization_pct.toFixed(1)}%</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-slate-700">{fmt(d.allocated_amount)}</span>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${statusBadge(d.status)}`}>{d.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Overview Stats */}
                {overview && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        {[
                            { label: 'Total Allocated', value: fmt(overview.total_allocated), icon: BarChart3, color: 'text-indigo-600 bg-indigo-50' },
                            { label: 'Total Spent', value: fmt(overview.total_spent), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Avg Utilization', value: `${overview.avg_utilization.toFixed(1)}%`, icon: Map, color: 'text-amber-600 bg-amber-50' },
                            { label: 'Departments', value: overview.dept_count, icon: Building2, color: 'text-blue-600 bg-blue-50' },
                        ].map(s => (
                            <div key={s.label} className="glass-card p-5 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                                    <s.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
                                    <p className="text-xl font-bold text-slate-800">{s.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-card p-8 bg-white/70 hover:bg-white transition-colors group">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100 group-hover:scale-110 transition-transform">
                            <FileText className="w-7 h-7 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Published Reports</h3>
                        <p className="text-slate-600 leading-relaxed mb-4">Download CSV/PDF statements of budgets and anomaly detections.</p>
                        <div className="space-y-2">
                            <a href="/api/export/budgets.csv" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                <Download className="w-4 h-4" /> Budgets CSV
                            </a>
                            <a href="/api/export/anomalies.csv" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                <Download className="w-4 h-4" /> Anomalies CSV
                            </a>
                            <a href="/api/export/anomalies.pdf" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                <Download className="w-4 h-4" /> Anomalies PDF
                            </a>
                        </div>
                    </div>

                    <div className="glass-card p-8 bg-white/70 hover:bg-white transition-colors group">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 border border-blue-100 group-hover:scale-110 transition-transform">
                            <Map className="w-7 h-7 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Budget Explorer</h3>
                        <p className="text-slate-600 leading-relaxed">Use the search bar above to explore how each department is spending its allocated funds and view utilization status.</p>
                    </div>

                    <div className="glass-panel p-8 bg-indigo-600 hover:bg-indigo-700 transition-colors group border-none shadow-xl shadow-indigo-600/20">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">AI Integrity</h3>
                        <p className="text-indigo-100 leading-relaxed">Our 6-model ensemble pipeline (Isolation Forest, LOF, OCSVM, Autoencoder, DBSCAN, Elliptic Envelope) detects anomalous spending in real-time.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
