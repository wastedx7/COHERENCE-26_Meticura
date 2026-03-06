import React, { useEffect, useState } from 'react';
import { useAnomaly } from '../../context/AnomalyContext';
import { Link } from 'react-router-dom';
import {
    AlertTriangle,
    Search,
    Filter,
    ChevronRight,
    ShieldAlert,
    AlertCircle
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const verdictColors: any = {
    normal: '#10b981',
    warning: '#f59e0b',
    alert: '#ef4444',
    critical: '#b91c1c'
};

const mockSummaryData = [
    { name: 'Normal', value: 140, color: '#10b981' },
    { name: 'Warning', value: 35, color: '#f59e0b' },
    { name: 'Alert', value: 15, color: '#ef4444' },
    { name: 'Critical', value: 10, color: '#b91c1c' },
];

export default function AnomalyPage() {
    const { anomalies, summary, isLoading, fetchAll } = useAnomaly();
    const [searchTerm, setSearchTerm] = useState('');
    const verdictColorValues = Object.values(verdictColors) as string[];

    useEffect(() => {
        fetchAll();
    }, []);

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Anomalies Center</h1>
                    <p className="text-slate-500 mt-1">Review AI and Rule-based financial anomalies</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/anomalies/advanced" className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg shadow-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Advanced Search
                    </Link>
                    <Link to="/anomalies/critical" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm font-medium transition-colors flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Critical Alerts
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-center">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Normal', 'Warning', 'Alert', 'Critical'].map((v, i) => (
                            <div key={v} className="bg-white/40 border border-slate-200/60 rounded-xl p-4 text-center shadow-sm">
                                <p className="text-sm font-semibold text-slate-500 uppercase">{v}</p>
                                <p className="text-3xl font-bold mt-1 tracking-tight" style={{ color: verdictColorValues[i] }}>
                                    {summary?.[v.toLowerCase()] || [140, 35, 15, 10][i]}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-card p-6 flex flex-col items-center justify-center relative">
                    <h3 className="text-sm font-semibold text-slate-600 absolute top-6 left-6 z-10">Verdict Distribution</h3>
                    <div className="w-full h-40 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie data={mockSummaryData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                                    {mockSummaryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden border border-slate-200 shadow-sm mt-4">
                <div className="p-4 border-b border-slate-200/60 bg-white/50 flex justify-between items-center">
                    <div className="relative max-w-sm w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by dept ID or rule..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 text-sm bg-white/70 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600">Department</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Detection Type</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Rule Triggered</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Verdict</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Score</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ?
                            Array(5).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="h-14 bg-slate-100/50"></td></tr>)
                            : (anomalies.length > 0 ? anomalies : Array(6).fill(null).map((_, i) => ({
                                id: i, dept_id: 100 + i, type: i % 2 === 0 ? 'RULE_BASED' : 'ML_DETECTED', rule: i % 2 === 0 ? `R00${(i % 5) + 1}` : 'N/A',
                                verdict: ['critical', 'alert', 'warning'][i % 3], score: (Math.random() * -0.5).toFixed(3),
                                name: `Department ${i + 1}`
                            }))).map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-800">{row.name}</p>
                                        <p className="text-xs text-slate-500">ID: {row.dept_id}</p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{row.type.replace('_', ' ')}</td>
                                    <td className="px-6 py-4">
                                        {row.rule !== 'N/A' && row.rule ?
                                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 text-xs font-mono">{row.rule}</span>
                                            : <span className="text-slate-400 text-xs">—</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${row.verdict === 'critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                row.verdict === 'alert' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                    'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                                            {row.verdict === 'critical' && <ShieldAlert className="w-3 h-3" />}
                                            {row.verdict === 'alert' && <AlertCircle className="w-3 h-3" />}
                                            {row.verdict === 'warning' && <AlertTriangle className="w-3 h-3" />}
                                            {row.verdict}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">{row.score}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/anomalies/department/${row.dept_id}`} className="p-2 inline-flex items-center justify-center rounded-full hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">
                                            <ChevronRight className="w-5 h-5" />
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
