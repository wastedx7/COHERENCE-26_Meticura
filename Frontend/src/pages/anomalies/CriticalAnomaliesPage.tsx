import React, { useEffect } from 'react';
import { useAnomaly } from '../../context/AnomalyContext';
import { ShieldAlert, AlertCircle, ChevronRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CriticalAnomaliesPage() {
    const { anomalies, isLoading, fetchCritical } = useAnomaly();

    useEffect(() => {
        fetchCritical();
    }, []);

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Critical Anomalies</h1>
                        <p className="text-slate-500 mt-1">High severity alerts requiring immediate resolution</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ?
                    Array(6).fill(0).map((_, i) => <div key={i} className="glass-card h-64 animate-pulse bg-slate-200/50"></div>)
                    : (anomalies.length > 0 ? anomalies : Array(6).fill(null).map((_, i) => ({
                        id: i, dept_id: 100 + i, name: `Department ${i + 1}`, type: i % 2 === 0 ? 'RULE_BASED' : 'ML_DETECTED',
                        rule: i % 2 === 0 ? 'R006' : 'Isolated Feature Spline', score: -0.89, message: 'Massive overspend deviation detected in recent 30 days.'
                    }))).map((item: any, i: number) => (
                        <div key={i} className="glass-card flex flex-col h-full overflow-hidden border border-red-100/50 hover:border-red-200 transition-colors relative group">
                            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-400"></div>
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
                                        <AlertCircle className="w-3.5 h-3.5" /> CRITICAL
                                    </span>
                                    <span className="text-xs font-mono text-slate-400">Score: {item.score}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{item.name}</h3>
                                <p className="text-sm text-slate-500 mb-4 tracking-tight">ID: {item.dept_id}</p>

                                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 border border-slate-100 shadow-inner">
                                    <span className="font-semibold block mb-1">
                                        {item.type === 'RULE_BASED' ? `Rule ${item.rule}` : 'ML Detection'}
                                    </span>
                                    <p className="text-slate-600 line-clamp-3 leading-snug">{item.message}</p>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-white/40 flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <Activity className="w-3.5 h-3.5" /> Action Required
                                </span>
                                <Link to={`/anomalies/department/${item.dept_id}`} className="text-indigo-600 text-sm font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Investigate <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
