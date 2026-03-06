import React from 'react';
import { Network, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export default function TreePage() {
    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in pb-4">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organization Tree</h1>
                <p className="text-slate-500 mt-1">Hierarchical view of departments and budgetary health</p>
            </div>

            <div className="glass-panel flex-1 relative overflow-hidden flex flex-col border border-slate-200">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm hover:bg-slate-50 text-slate-600"><ZoomIn className="w-4 h-4" /></button>
                    <button className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm hover:bg-slate-50 text-slate-600"><ZoomOut className="w-4 h-4" /></button>
                    <button className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm hover:bg-slate-50 text-slate-600"><Maximize className="w-4 h-4" /></button>
                </div>

                {/* Mock React Flow Canvas Area */}
                <div className="flex-1 bg-slate-50/50 w-full h-full flex items-center justify-center relative dot-pattern">

                    {/* Central Hub */}
                    <div className="absolute top-10 flex flex-col items-center">
                        <div className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg border-2 border-white font-bold tracking-wider z-10 w-48 text-center">
                            Ministry Admin
                        </div>
                        <div className="h-16 w-0.5 bg-slate-300"></div>
                    </div>

                    <div className="absolute top-36 w-full max-w-4xl flex justify-between px-12">
                        <div className="w-full h-0.5 bg-slate-300 absolute top-0 left-0 right-0 z-0"></div>

                        {/* Branch 1 */}
                        <div className="flex flex-col items-center relative z-10 -mt-0.5">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow font-semibold w-40 text-center text-sm">Central District</div>
                            <div className="h-12 w-0.5 bg-slate-300"></div>
                            <div className="flex gap-4">
                                <div className="bg-white border-2 border-emerald-400 rounded-lg p-3 shadow-sm w-32">
                                    <p className="text-xs font-bold text-slate-800">Education</p>
                                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">Healthy</p>
                                </div>
                                <div className="bg-white border-2 border-red-400 rounded-lg p-3 shadow-sm w-32 relative">
                                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                                    <p className="text-xs font-bold text-slate-800">Public Works</p>
                                    <p className="text-[10px] text-red-600 font-semibold mt-1">Critical Lapse</p>
                                </div>
                            </div>
                        </div>

                        {/* Branch 2 */}
                        <div className="flex flex-col items-center relative z-10 -mt-0.5">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow font-semibold w-40 text-center text-sm">North District</div>
                            <div className="h-12 w-0.5 bg-slate-300"></div>
                            <div className="flex gap-4">
                                <div className="bg-white border-2 border-amber-400 rounded-lg p-3 shadow-sm w-32">
                                    <p className="text-xs font-bold text-slate-800">Healthcare</p>
                                    <p className="text-[10px] text-amber-600 font-semibold mt-1">Anomaly Alert</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur border border-slate-200 rounded-lg p-3 shadow-sm text-xs space-y-2">
                        <p className="font-bold text-slate-700 mb-1">Status Legend</p>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-emerald-500 bg-emerald-100"></div> Healthy Track</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-amber-500 bg-amber-100"></div> Anomaly Found</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-red-500 bg-red-100"></div> Critical Lapse</div>
                    </div>

                </div>
            </div>

            <style>{`
        .dot-pattern {
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
        </div>
    );
}
