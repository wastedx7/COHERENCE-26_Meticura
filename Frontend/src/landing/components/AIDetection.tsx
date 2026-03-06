import React from 'react';
import { SectionHeader } from './SectionHeader';
import { motion } from 'framer-motion';
import { Search, Split, Clock, History } from 'lucide-react';
import { GlassCard } from './GlassCard';

export const AIDetection = () => {
    const capabilities = [
        {
            icon: <Clock className="w-8 h-8 text-white" />,
            title: "Burst Spend Velocities",
            text: "Catches scenarios where departments deplete extensive budgets over few highly concentrated irregular days."
        },
        {
            icon: <History className="w-8 h-8 text-white" />,
            title: "Ghost Departments",
            text: "Automatically highlights zero-activity departments over sustained months failing to utilize minimum necessary social functions."
        },
        {
            icon: <Search className="w-8 h-8 text-white" />,
            title: "Year-End Dumping",
            text: "Models End-Period Spike Ratios specifically identifying anomalous bulk liquidation behavior weeks before March 31 ends."
        },
        {
            icon: <Split className="w-8 h-8 text-white" />,
            title: "Micro-Transaction Splitting",
            text: "Recognizes structurally repeated fractional expenditure traces commonly designed to bypass standard threshold audits."
        }
    ];

    return (
        <section id="ai-detection" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-6 lg:px-12">
                <SectionHeader
                    title="Multi-Variate Feature Analytics"
                    subtitle="9 dynamically calculated behavioral vectors piped instantly into our models."
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16 items-center">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {capabilities.map((cap, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={i % 2 === 1 ? 'sm:mt-12' : ''}
                            >
                                <GlassCard className="h-full bg-soft-black/80">
                                    <div className="p-3 bg-white/5 rounded-xl w-max mb-4 inline-block shadow-inner ring-1 ring-white/10">
                                        {cap.icon}
                                    </div>
                                    <h4 className="text-lg font-bold text-white tracking-tight mb-2">{cap.title}</h4>
                                    <p className="text-sm text-gray-400 leading-relaxed font-medium">{cap.text}</p>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col justify-center h-full"
                    >
                        <div className="relative w-full aspect-square max-w-lg mx-auto bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col font-mono text-sm leading-relaxed text-gray-300">
                            <div className="flex gap-2 mb-4 text-xs font-sans text-gray-500 uppercase tracking-widest border-b border-white/10 pb-2">
                                <span className="text-primary-yellow">Terminal</span> | Anomaly Processor
                            </div>
                            <div className="overflow-y-auto space-y-2 max-h-full">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400">➜</span>
                                    <span className="text-blue-300">~</span> Inspecting: DEPT_ROADS_771
                                </div>
                                <div>[INFO] Calculating days_since_last_txn... 94</div>
                                <div>[INFO] Evaluating transaction_count... 1204</div>
                                <div className="text-yellow-400 font-bold">⚠️ Hard Rule Triggered: No transaction in 90+ days &lt; 50% util</div>
                                <div>[PROCESS] Aggregating Vector into Isolation Forest...</div>
                                <div className="text-red-400">{">>"} ALERT ML Flag: Score -0.84 - Micro Splitting Detected.</div>
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-green-400">➜</span>
                                    <span className="text-blue-300">~</span> Waiting for schedule refresh...
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-2 h-4 bg-white inline-block relative -top-0.5"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};
