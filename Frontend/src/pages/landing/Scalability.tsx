import React from 'react';
import { SectionHeader } from '../../components/common/SectionHeader';
import { motion } from 'framer-motion';
import { Database, ShieldCheck } from 'lucide-react';

export const Scalability = () => {
    const points = [
        { label: "Append-Only Facts", tech: "PostgreSQL DB", desc: "Transactions are immutable. Derivations (utilization%, etc) are purely runtime calculated." },
        { label: "Synthetic ML Seed", tech: "Faker & NumPy", desc: "4800 behavior vectors synthesizing Slow Spenders, Burst Dumpers across 24-months." },
        { label: "Task Coordination", tech: "Celery Workers", desc: "Weekly scheduled retraining with cron triggers managing 6-hour refresh pipelines." },
        { label: "Decoupled Processing", tech: "FastAPI + Redis", desc: "Zero endpoint latency. Analytical jobs queue gracefully without impacting live rendering." },
        { label: "Auditable Predictions", tech: "Deterministic Explainability", desc: "Why Lapse? Why Reallocate? Models document exact human-readable reasoning strings." }
    ];

    return (
        <section id="scalability" className="py-24 bg-soft-black border-y border-white/5 relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,216,77,0.05)_0%,transparent_50%)] pointer-events-none"></div>

            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <SectionHeader
                            title="System Orchestration & Integrity"
                            subtitle="Modern backend architecture backing our algorithms."
                            alignment="left"
                        />
                        <p className="text-gray-400 text-lg leading-relaxed mt-6 mb-8 max-w-lg">
                            Designed from the ground up to prevent data tampering, provide undeniable algorithmic transparency, and serve state-level transaction velocities efficiently.
                        </p>

                        <div className="flex flex-col gap-4">
                            {points.map((pt, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="mt-1 p-1 bg-white/5 rounded group-hover:bg-primary-yellow/20 transition-colors">
                                        <ShieldCheck className="w-5 h-5 text-primary-yellow" />
                                    </div>
                                    <div>
                                        <h5 className="text-white font-bold tracking-tight">{pt.label} <span className="text-xs ml-2 font-mono text-primary-yellow/80 border border-primary-yellow/30 px-2 py-0.5 rounded-full">{pt.tech}</span></h5>
                                        <p className="text-sm text-gray-400 leading-relaxed mt-1">{pt.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="flex justify-center"
                    >
                        <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="aspect-square bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden group hover:border-warning-yellow/50 transition-colors shadow-2xl">
                                    <div className="absolute inset-0 bg-primary-yellow/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-16 h-1 bg-white/5 absolute top-1/4 rounded-full"></div>
                                    <div className="w-24 h-1 bg-white/5 absolute top-1/2 rounded-full"></div>
                                    <div className="w-12 h-1 bg-white/5 absolute top-3/4 rounded-full"></div>
                                    <Database className="w-10 h-10 text-primary-yellow/30" />
                                    <div className="w-16 h-16 rounded-full border border-dashed border-white/20 animate-spin-slow absolute"></div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};
