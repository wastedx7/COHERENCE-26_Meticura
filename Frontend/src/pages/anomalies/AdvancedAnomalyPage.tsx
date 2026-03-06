import React from 'react';
import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react';

export function AdvancedAnomalyPage() {
    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Advanced Anomaly Search</h1>
                <p className="text-slate-500 mt-1">Cross-filter anomalies by severity, rule ID, and custom queries</p>
            </div>

            <div className="glass-panel p-6 mb-8 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search criteria..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <select className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Rules</option>
                    <option value="R001">R001: Zero Transactions</option>
                    <option value="R002">R002: Inactivity</option>
                    <option value="R003">R003: End Period Spike</option>
                </select>
                <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium flex items-center gap-2 transition-colors">
                    <SlidersHorizontal className="w-4 h-4" /> Filter Results
                </button>
            </div>

            <div className="glass-card p-12 flex flex-col items-center justify-center text-slate-500 text-center border-dashed border-2 border-slate-200">
                <Search className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-800">Advanced logic enabled in full client</h3>
                <p className="max-w-md mt-2">Enter your query parameters above to fetch filtered anomalies across the historical dataset.</p>
                <button className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2">
                    Load Sample Query <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
