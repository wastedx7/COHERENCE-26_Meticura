import React from 'react';
import { ShieldCheck, Map, Search, FileText } from 'lucide-react';

export default function CitizenPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans relative overflow-hidden">
            {/* Dynamic Backgrounds */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10 animate-fade-in">
                <header className="flex justify-between items-center mb-16 bg-white/60 backdrop-blur-lg border border-white/40 p-4 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Coherent<span className="text-indigo-600">Citizen</span></h1>
                    </div>
                    <button className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium shadow hover:bg-black transition-colors">
                        Report Concern
                    </button>
                </header>

                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-100 mb-4">Public Transparency Portal</span>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">See how your tax money is distributed across the region</h2>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">Access sanitized real-time data on active projects, departmental budgets, and resource reallocation logic ensuring maximum efficiency.</p>

                    <div className="relative max-w-xl mx-auto">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search for your district or a specific department..." className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur border border-slate-200 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-card p-8 bg-white/70 hover:bg-white transition-colors cursor-pointer group">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 border border-blue-100 group-hover:scale-110 transition-transform">
                            <Map className="w-7 h-7 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Interactive Map</h3>
                        <p className="text-slate-600 leading-relaxed">Explore budget utility down to the pin-code level with heatmaps.</p>
                    </div>

                    <div className="glass-card p-8 bg-white/70 hover:bg-white transition-colors cursor-pointer group">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100 group-hover:scale-110 transition-transform">
                            <FileText className="w-7 h-7 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Published Reports</h3>
                        <p className="text-slate-600 leading-relaxed">Download PDF statements of major AI-recommended reallocations.</p>
                    </div>

                    <div className="glass-panel p-8 bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer group border-none shadow-xl shadow-indigo-600/20">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Our AI Integrity</h3>
                        <p className="text-indigo-100 leading-relaxed">Learn how our 6-model pipeline actively prevents fraud autonomously.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
