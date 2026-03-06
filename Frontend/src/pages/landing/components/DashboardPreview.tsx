import React from 'react';
import { SectionHeader } from '../../../components/common/SectionHeader';
import { motion } from 'framer-motion';
export const DashboardPreview = () => {
    return (
        <section id="dashboard" className="py-24 relative overflow-hidden bg-black">
            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <SectionHeader
                    title="Command Center UX"
                    subtitle="React Context Dashboard managing the 5 primary platform capabilities."
                />

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-16 relative"
                >
                    {/* Main Dashboard Wrapper */}
                    <div className="w-full max-w-6xl mx-auto bg-soft-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]">

                        {/* Dashboard Mock Header */}
                        <div className="h-12 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            <div className="ml-4 text-xs font-mono text-gray-500 uppercase tracking-wider">Budget Watchdog Platform | National Overview</div>
                        </div>

                        {/* Dashboard Content */}
                        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Left Column */}
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                <div className="bg-black/40 border border-white/10 rounded-xl p-6 h-64 relative overflow-hidden group">
                                    <h4 className="text-white font-bold mb-4 tracking-tight">Financial Flow Extrapolation Overview</h4>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-60 flex items-center justify-center">
                                        <div className="w-3/4 h-1/2 border-b border-l border-white/20 relative">
                                            {/* Fake line chart */}
                                            <svg viewBox="0 0 100 50" className="w-full h-full absolute bottom-0 left-0 w-[calc(100%+2px)] h-[calc(100%+2px)] -mb-[1px] -ml-[1px]" preserveAspectRatio="none">
                                                <path d="M0,45 L15,35 L30,40 L45,20 L60,25" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M60,25 L75,10 L90,15 L100,5" fill="none" stroke="#FFD84D" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />
                                                <text x="75" y="8" fill="#FFD84D" fontSize="4" className="uppercase font-mono">Predicted Lapse Area</text>
                                                <circle cx="60" cy="25" r="2" fill="#4ade80" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-black/40 border border-white/10 rounded-xl p-5">
                                        <h5 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Predicted Unspent</h5>
                                        <div className="text-3xl font-black text-white">₹ 4.2B</div>
                                        <div className="text-xs text-red-400 mt-2">12 Departments at risk</div>
                                    </div>
                                    <div className="bg-black/40 border border-white/10 rounded-xl p-5">
                                        <h5 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Active Reallocation Pending</h5>
                                        <div className="text-3xl font-black text-warning-yellow">₹ 1.8B</div>
                                        <div className="text-xs text-gray-500 mt-2">Donor Matches Found</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column / Sidebar Alerts */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-white font-bold tracking-tight">Active Anomalies</h4>
                                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                                </div>

                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className={`p-4 rounded-xl border ${i === 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-black/40 border-white/10'} transition-colors`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${i === 0 ? 'text-red-400' : 'text-primary-yellow'}`}>{i === 0 ? 'Rule: Zero Txn' : 'ML Isolation Flag'}</span>
                                            <span className="text-xs text-gray-500 font-mono">14h</span>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-snug">
                                            {i === 0 ? 'Education Dist-4 hit 94 days with no transactions. 20% budget elapsed.' : 'Micro-splitting behavior detected in Water Dept. Burst patterns observed.'}
                                        </p>
                                    </div>
                                ))}
                            </div>

                        </div>

                    </div>

                    {/* Bottom Glow */}
                    <div className="absolute -bottom-[200px] left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-primary-yellow/20 blur-[150px] -z-10 rounded-full"></div>

                   
                </motion.div>

            </div>
        </section>
    );
};
