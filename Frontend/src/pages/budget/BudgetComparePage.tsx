import React, { useState, useEffect, useCallback } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Search, GitCompareArrows, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface ComparisonDept {
    department_id: number;
    department_name: string;
    allocated_budget: number;
    spent_amount: number;
    remaining_budget: number;
    utilization_percentage: number;
    status: string;
}

interface ComparisonResult {
    comparison_count: number;
    statistics: {
        average_utilization: number;
        max_utilization: number;
        min_utilization: number;
        average_budget: number;
        total_allocated: number;
    };
    departments: ComparisonDept[];
}

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6'];

export function BudgetComparePage() {
    const { departments } = useBudget();
    const [allDepts, setAllDepts] = useState<{ department_id: number; department_name: string }[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [result, setResult] = useState<ComparisonResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/budget/?limit=200');
                const budgets = res.data?.budgets || res.data?.data || [];
                setAllDepts(budgets.map((b: any) => ({ department_id: b.department_id, department_name: b.department_name })));
            } catch {
                if (departments?.length) {
                    setAllDepts(departments.map((d: any) => ({ department_id: d.department_id, department_name: d.department_name })));
                }
            }
        })();
    }, [departments]);

    const toggleDept = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 8 ? [...prev, id] : prev);
    };

    const compare = useCallback(async () => {
        if (selectedIds.length < 2) return;
        setIsLoading(true);
        setError(null);
        try {
            const params = selectedIds.map(id => `dept_ids=${id}`).join('&');
            const res = await api.get(`/budget/comparison?${params}`);
            setResult(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Failed to fetch comparison');
        } finally {
            setIsLoading(false);
        }
    }, [selectedIds]);

    const filteredDepts = allDepts.filter(d =>
        d.department_name.toLowerCase().includes(search.toLowerCase()) || String(d.department_id).includes(search)
    );

    const chartData = result?.departments.map(d => ({
        name: d.department_name?.length > 12 ? d.department_name.slice(0, 12) + '…' : d.department_name,
        allocated: +(d.allocated_budget / 100000).toFixed(2),
        spent: +(d.spent_amount / 100000).toFixed(2),
        utilization: d.utilization_percentage,
    })) || [];

    const formatCurrency = (v: number) => {
        if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
        if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
        return `₹${v.toLocaleString()}`;
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Budget Comparison</h1>
                <p className="text-slate-500 mt-1">Select 2–8 departments to compare their budget utilization side-by-side</p>
            </div>

            <div className="glass-card p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <button onClick={compare} disabled={selectedIds.length < 2 || isLoading}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompareArrows className="w-4 h-4" />}
                        Compare ({selectedIds.length})
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {filteredDepts.map(d => (
                        <button key={d.department_id} onClick={() => toggleDept(d.department_id)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedIds.includes(d.department_id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>
                            {d.department_name} (#{d.department_id})
                        </button>
                    ))}
                    {filteredDepts.length === 0 && <p className="text-slate-400 text-sm p-2">No departments found</p>}
                </div>
            </div>

            {error && (
                <div className="glass-card p-4 mb-6 bg-red-50 border-red-200 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                </div>
            )}

            {result && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        {[
                            { label: 'Avg Utilization', value: `${result.statistics.average_utilization}%` },
                            { label: 'Max Utilization', value: `${result.statistics.max_utilization}%` },
                            { label: 'Min Utilization', value: `${result.statistics.min_utilization}%` },
                            { label: 'Avg Budget', value: formatCurrency(result.statistics.average_budget) },
                            { label: 'Total Allocated', value: formatCurrency(result.statistics.total_allocated) },
                        ].map(s => (
                            <div key={s.label} className="glass-panel p-4 text-center">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                                <p className="text-xl font-bold text-slate-800">{s.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="glass-card p-6 mb-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Allocated vs Spent (₹ Lakhs)</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} angle={-15} textAnchor="end" />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend />
                                    <Bar dataKey="allocated" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Allocated" barSize={32} />
                                    <Bar dataKey="spent" radius={[4, 4, 0, 0]} name="Spent" barSize={32}>
                                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th className="text-left p-4 font-semibold text-slate-600">Department</th>
                                        <th className="text-right p-4 font-semibold text-slate-600">Allocated</th>
                                        <th className="text-right p-4 font-semibold text-slate-600">Spent</th>
                                        <th className="text-right p-4 font-semibold text-slate-600">Remaining</th>
                                        <th className="text-right p-4 font-semibold text-slate-600">Utilization</th>
                                        <th className="text-center p-4 font-semibold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.departments.map((d, i) => (
                                        <tr key={d.department_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                {d.department_name}
                                            </td>
                                            <td className="p-4 text-right text-slate-700">{formatCurrency(d.allocated_budget)}</td>
                                            <td className="p-4 text-right text-slate-700">{formatCurrency(d.spent_amount)}</td>
                                            <td className="p-4 text-right text-slate-700">{formatCurrency(d.remaining_budget)}</td>
                                            <td className="p-4 text-right font-bold text-slate-800">{d.utilization_percentage}%</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${d.status === 'exceeded' ? 'bg-red-100 text-red-700' : d.status === 'at-risk' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {d.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {!result && !isLoading && (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-200">
                    <GitCompareArrows className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">Select departments to compare</h3>
                    <p className="max-w-md mt-2 text-slate-500">Choose 2–8 departments above and click Compare to see side-by-side budget analysis.</p>
                </div>
            )}
        </div>
    );
}
