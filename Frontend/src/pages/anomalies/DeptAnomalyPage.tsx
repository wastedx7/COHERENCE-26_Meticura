import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnomaly } from '../../context/AnomalyContext';
import { ChevronLeft, RefreshCw, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockFeatureData = [
    { name: 'velocity', val: -0.8 },
    { name: 'util_pct', val: 0.1 },
    { name: 'inactivity', val: -0.2 },
    { name: 'variance', val: 0.9 },
    { name: 'spike', val: 0.6 },
    { name: 'txn_cnt', val: -0.4 },
];

export function DeptAnomalyPage() {
    const { id } = useParams();
    const { selectedDeptAnomaly, fetchDeptAnomaly, rescanDept, isLoading } = useAnomaly();

    useEffect(() => {
        if (id) fetchDeptAnomaly(Number(id));
    }, [id, fetchDeptAnomaly]);

    const anomaly = selectedDeptAnomaly || {
        department_id: id || '101',
        verdict: 'alert',
        severity: 'high',
        detection_type: 'COMBINED',
        combined_score: -0.65,
        rule_id: 'R003',
        rule_message: '40%+ of annual budget spent in final 30 days',
        is_resolved: false
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <Link to="/anomalies" className="p-2 glass-card hover:bg-slate-50 rounded-full transition-colors text-slate-500 hover:text-indigo-600">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">Department {anomaly.department_id} Analysis</h1>
                            <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full border
                ${anomaly.severity === 'high' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}
              `}>
                                {anomaly.severity} SEVERITY
                            </span>
                        </div>
                        <p className="text-slate-500 mt-1">Detailed ML feature breakdown and rule trace</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => rescanDept(Number(id))}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white shadow-sm rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Rescan Now
                    </button>
                    <button className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-sm font-medium transition-colors
            ${anomaly.is_resolved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}
          `}>
                        {anomaly.is_resolved ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {anomaly.is_resolved ? 'Resolved' : 'Mark Resolved'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50/50 to-white relative overflow-hidden">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider absolute top-6 left-6">Anomaly Score</h3>
                    <div className="w-40 h-40 rounded-full flex items-center justify-center border-8 border-indigo-100 bg-white shadow-lg relative z-10 mb-2 mt-4">
                        <span className="text-4xl font-mono font-bold text-indigo-600 tracking-tighter">{anomaly.combined_score}</span>
                    </div>
                    <p className="text-center text-sm font-medium text-slate-600 max-w-xs mt-4">
                        Scores lower than -0.5 identify significant deviations from historical population norm.
                    </p>
                    <div className="absolute right-[-10%] bottom-[-10%] w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Detection Trace</h3>

                    <div className="space-y-4">
                        <div className="bg-white/60 border border-slate-200/60 rounded-xl p-4 shadow-sm">
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 block">Detection Method</span>
                            <p className="font-semibold text-slate-800">{anomaly.detection_type}</p>
                        </div>

                        {anomaly.rule_id && (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 shadow-sm">
                                <span className="text-xs uppercase font-bold text-rose-400 tracking-wider mb-2 flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5" /> Rule Signature {anomaly.rule_id}
                                </span>
                                <p className="font-medium text-rose-900 leading-snug">{anomaly.rule_message}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="glass-card mt-6 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Feature Snapshot at Detection Time</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockFeatureData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                            <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                                {mockFeatureData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.val < 0 ? '#ef4444' : '#6366f1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
