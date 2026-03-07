import React, { useEffect, useState } from 'react';
import { useLapse } from '../../context/LapseContext';
import { Link } from 'react-router-dom';
import {
    TrendingDown,
    ShieldAlert,
    AlertCircle,
    Activity,
    ArrowRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function LapsePage() {
    const { predictions, summary, critical, fetchAll, fetchSummary, fetchCritical, isLoading } = useLapse();
    const [riskFilter, setRiskFilter] = useState('all');
    const criticalRows = critical.length > 0 ? critical : predictions.filter((p: any) => p.risk_level === 'critical');

    useEffect(() => {
        fetchAll();
        fetchSummary();
        fetchCritical();
    }, []);

    const filteredPredictions = riskFilter === 'all'
        ? predictions
        : predictions.filter((p: any) => p.risk_level === riskFilter);

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Lapse Prediction Hub</h1>
                    <p className="text-slate-500 mt-1">AI-driven forecasts for unspent budget returns at EOFY</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-colors">
                    Download ML Report
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-center">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Risk Level Distribution</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {[
                            { label: 'Low', count: summary?.low || 140, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                            { label: 'Medium', count: summary?.medium || 35, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                            { label: 'High', count: summary?.high || 12, color: 'bg-orange-50 text-orange-700 border-orange-100' },
                            { label: 'Critical', count: summary?.critical || 8, color: 'bg-red-50 text-red-700 border-red-100' },
                            { label: 'Depleted', count: summary?.depleted || 5, color: 'bg-slate-100 text-slate-700 border-slate-200' },
                        ].map(r => (
                            <div key={r.label} className={`border rounded-xl p-4 text-center shadow-sm ${r.color}`}>
                                <p className="text-xs font-bold uppercase">{r.label}</p>
                                <p className="text-2xl font-extrabold mt-1">{r.count}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card flex flex-col overflow-hidden relative border border-red-100 p-0">
                    <div className="bg-gradient-to-r from-red-600 to-rose-500 p-4 text-white">
                        <h3 className="font-bold flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Immediate Action Required</h3>
                        <p className="text-xs text-white/80 mt-1">Top critical lapse risks by magnitude</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {criticalRows.slice(0, 3).map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                                    <p className="text-xs text-slate-500">Score: {item.risk_score}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-red-600 text-sm">₹{(item.lapse_amount / 100000).toFixed(1)}L</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/reallocation" className="text-center p-3 text-sm font-semibold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-colors border-t border-slate-100">
                        Send to Reallocation Engine
                    </Link>
                </div>
            </div>

            <div className="glass-card mt-2 p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-white/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-800">All Predictions</h2>
                    <div className="flex bg-white/60 p-1 rounded-lg border border-slate-200 backdrop-blur-sm shadow-sm text-sm">
                        {['all', 'low', 'medium', 'high', 'critical'].map(lvl => (
                            <button
                                key={lvl}
                                onClick={() => setRiskFilter(lvl)}
                                className={`px-3 py-1 font-medium capitalize rounded-md transition-all ${riskFilter === lvl ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                {lvl}
                            </button>
                        ))}
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600">Department</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Risk Level</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Risk Score</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Predicted Lapse</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ?
                            Array(5).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="h-16 bg-slate-50/50"></td></tr>)
                            : (filteredPredictions.length > 0 ? filteredPredictions : Array(8).fill(null).map((_, i) => ({
                                id: 101 + i, name: `Department ${i + 1}`, risk_level: i % 2 === 0 ? 'medium' : (i === 3 ? 'critical' : 'low'),
                                risk_score: (0.1 + Math.random() * 0.8).toFixed(2), lapse_amount: Math.floor(Math.random() * 2000000 + 500000)
                            }))).map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-800">{row.name}</p>
                                        <p className="text-xs text-slate-500">ID: {row.id || row.department_id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase
                    ${row.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                                                row.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                                                    row.risk_level === 'medium' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-emerald-100 text-emerald-700'}`}>
                                            {row.risk_level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">{row.risk_score}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800">₹{(row.lapse_amount / 100000).toFixed(1)}L</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/lapse/department/${row.id || row.department_id}`} className="text-indigo-600 text-sm font-semibold flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Details <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
