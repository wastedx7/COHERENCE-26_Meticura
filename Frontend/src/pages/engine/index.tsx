import React from 'react';
import { Settings, PlayCircle, RefreshCw, Activity, Database, CheckCircle2 } from 'lucide-react';

export default function EnginePage() {
    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Engine Tracker</h1>
                    <p className="text-slate-500 mt-1">Monitor the AI pipeline execution phases</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-colors">
                    <PlayCircle className="w-5 h-5" /> Force Run Pipeline
                </button>
            </div>

            <div className="glass-panel p-8 mb-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden relative border border-slate-700">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Current Pipeline State</h3>

                    {/* Pipeline Visual */}
                    <div className="flex justify-between items-center w-full max-w-4xl mx-auto mb-4 relative before:absolute before:inset-0 before:top-1/2 before:-translate-y-1/2 before:h-1 before:bg-slate-700">
                        <div className="flex flex-col items-center z-10">
                            <div className="w-12 h-12 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <p className="mt-3 font-bold text-sm">Stage 1: Anomaly</p>
                            <p className="text-xs text-slate-400">Completed 2h ago</p>
                        </div>

                        <div className="flex flex-col items-center z-10">
                            <div className="w-12 h-12 rounded-full bg-indigo-500 border-4 border-slate-900 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                                <RefreshCw className="w-5 h-5 text-white animate-spin" />
                            </div>
                            <p className="mt-3 font-bold text-sm text-indigo-300">Stage 2: Lapse Predict</p>
                            <p className="text-xs text-slate-400">Running...</p>
                        </div>

                        <div className="flex flex-col items-center z-10">
                            <div className="w-12 h-12 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                            </div>
                            <p className="mt-3 font-bold text-sm text-slate-500">Stage 3: Reallocation</p>
                            <p className="text-xs text-slate-500">Pending</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border border-emerald-100 flex gap-4">
                    <div className="mt-1"><Activity className="w-8 h-8 text-emerald-500" /></div>
                    <div>
                        <h3 className="font-bold text-slate-800">Anomaly Target</h3>
                        <p className="text-sm text-slate-500 mt-1">Rule Engine Active. 6 Models loaded.</p>
                        <span className="mt-2 inline-block px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded">HEALTHY</span>
                    </div>
                </div>
                <div className="glass-card p-6 border border-indigo-100 flex gap-4">
                    <div className="mt-1"><Database className="w-8 h-8 text-indigo-500" /></div>
                    <div>
                        <h3 className="font-bold text-slate-800">Forecast DB Sync</h3>
                        <p className="text-sm text-slate-500 mt-1">Reading 200 depts for extrapolation.</p>
                        <span className="mt-2 inline-block px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded">IN PROGRESS</span>
                    </div>
                </div>
                <div className="glass-card p-6 border border-slate-200 flex gap-4">
                    <div className="mt-1"><Settings className="w-8 h-8 text-slate-400" /></div>
                    <div>
                        <h3 className="font-bold text-slate-800">Transfer Daemon</h3>
                        <p className="text-sm text-slate-500 mt-1">Awaiting stage 2 completion.</p>
                        <span className="mt-2 inline-block px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded">SLEEPING</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
