import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBudget } from '../../context/BudgetContext';
import { ChevronLeft, FileText, ArrowUpRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function DeptBudgetPage() {
    const { id } = useParams();
    const { selectedDept, fetchDeptDetail, isLoading } = useBudget();

    useEffect(() => {
        if (id) fetchDeptDetail(Number(id));
    }, [id, fetchDeptDetail]);

    const dept = selectedDept || {
        name: 'Education Department',
        code: 'EDU-101',
        allocated_amount: 15400000,
        spent_amount: 9300000,
        remaining_amount: 6100000,
        utilization_pct: 60.3,
        status: 'on-track',
        transactions: []
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/budget" className="p-2 glass-card hover:bg-slate-50 rounded-full transition-colors text-slate-500 hover:text-indigo-600">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{dept.name}</h1>
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">{dept.code}</span>
                        </div>
                        <p className="text-slate-500 mt-1">Detailed breakdown of allocations and transactions</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white shadow-sm rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <FileText className="w-4 h-4" /> Export Report
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-center relative overflow-hidden">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6 relative z-10">Budget Utilization</h3>
                    <div className="flex items-end gap-2 relative z-10">
                        <span className="text-5xl font-extrabold tracking-tight text-slate-800">
                            ₹{(dept.spent_amount / 1000000).toFixed(2)}M
                        </span>
                        <span className="text-xl font-medium text-slate-400 mb-1">
                            / ₹{(dept.allocated_amount / 1000000).toFixed(2)}M
                        </span>
                    </div>

                    <div className="mt-8 relative z-10">
                        <div className="flex justify-between text-sm mb-2 font-medium text-slate-600">
                            <span>{dept.utilization_pct}% Consumed</span>
                            <span>₹{(dept.remaining_amount / 1000000).toFixed(2)}M Remaining</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-4 shadow-inner border border-slate-200/60 overflow-hidden">
                            <div
                                className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                style={{ width: `${dept.utilization_pct}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="absolute right-[-10%] top-[-20%] w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Key Metrics</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-600 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Avg Daily Spend</span>
                            <span className="font-bold text-slate-800">₹45.2K</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-600 flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-indigo-500" /> Transaction Count</span>
                            <span className="font-bold text-slate-800">142</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-slate-600">Risk Status</span>
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block text-xs uppercase tracking-wider">On Track</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Spend by Category</h3>
                    <div className="h-64 w-full">
                        {dept.category_breakdown && dept.category_breakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={dept.category_breakdown} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                    <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 13 }} width={100} />
                                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                                    {dept.category_breakdown.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#0ea5e9', '#14b8a6', '#f59e0b'][index % 5]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                <p>No category breakdown available</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 relative z-10 bg-white/40 backdrop-blur-md">
                        <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {/* Mock Transactions */}
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex justify-between items-center p-4 hover:bg-white/50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold">{i}</div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-800">Invoice #INV-2024-{100 + i}</p>
                                        <p className="text-xs text-slate-500">Oct {14 - i}, 2024 • Operations</p>
                                    </div>
                                </div>
                                <span className="font-bold text-slate-800">₹{(Math.random() * 50000 + 1000).toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
