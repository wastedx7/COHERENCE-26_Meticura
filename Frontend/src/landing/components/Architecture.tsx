import React from 'react';
import { SectionHeader } from './SectionHeader';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export const Architecture = () => {
    const nodes = [
        { title: "Financial Transactions Ingested", desc: "User Triggers & Batch Sources" },
        { title: "Rules & ML Anomaly Service", desc: "Scikit-Learn Isolation Forest execution" },
        { title: "Celery & Redis Worker Queues", desc: "6-hour chron schedules and asynchronous loads" },
        { title: "PostgreSQL Database Layer", desc: "Raw facts stored, appending continuous streams" },
        { title: "FastAPI Analytical Handshake", desc: "Linear model derivations predicting budget variance" },
        { title: "React Context Dashboard", desc: "Real-time command center rendering live stats" }
    ];

    return (
        <section id="architecture" className="py-24 relative bg-primary-black border-y border-white/5">
            <div className="container mx-auto px-6 lg:px-12">
                <SectionHeader
                    title="Data Pipeline Structure"
                    subtitle="Fixed staged architecture running 3 discrete services concurrently."
                />

                <div className="max-w-4xl mx-auto mt-16 relative">
                    {/* Central Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2"></div>

                    <div className="flex flex-col gap-8 relative z-10">
                        {nodes.map((node, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: i * 0.15, duration: 0.5 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className="w-full max-w-lg bg-soft-black backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center shadow-lg hover:border-primary-yellow/40 transition-colors cursor-default group">
                                    <div className="absolute inset-0 bg-primary-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                                    <h4 className="text-xl font-bold text-white tracking-tight mb-2">{node.title}</h4>
                                    <p className="text-gray-400 font-mono text-sm max-w-xs mx-auto">{node.desc}</p>
                                </div>

                                {i < nodes.length - 1 && (
                                    <motion.div
                                        animate={{ y: [0, 5, 0] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="p-2 bg-white/5 rounded-full border border-white/10"
                                    >
                                        <ArrowDown className="w-5 h-5 text-primary-yellow" />
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
