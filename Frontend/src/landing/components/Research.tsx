import React from 'react';
import { SectionHeader } from './SectionHeader';
import { motion } from 'framer-motion';
import { Sigma, GitBranch, Terminal } from 'lucide-react';
import researchSvg from '../../assets/undraw_toy-car_on9j.svg';
export const Research = () => {
    const references = [
        { title: "No One-Class SVM. No Autoencoders. We deployed Scikit-Learn Isolation Forests because unsupervised clustering operates dynamically without clean labels.", name: "ML Anomaly Architecture" },
        { title: "Weighted Moving Averages give the last 30 operational days 3x more weight. Linear extrapolation is explainable over ARIMA blackboxes.", name: "Predictive Extrapolation Math" },
        { title: "Deterministic Rules overlay ML scoring. A zero-transaction flag over 90 days hits Hard Rule #2 independently of the Isolation vectors.", name: "Deterministic Rule Overlay" },
        { title: "Recipient / Donor logic scales across districts without supervised ML required. It is an algorithmic handshake for public policy.", name: "Reallocation Engine Design" }
    ];

    return (
        <section id="research" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-6 lg:px-12">
                <SectionHeader
                    title="Methodology & Algorithms"
                    subtitle="Our backend structures are open-book, mathematically deliberate, and optimized for auditor confidence."
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex justify-center lg:justify-start"
                    >
                        <img src={researchSvg} alt="Research Methodology" className="w-full max-w-md opacity-90 drop-shadow-[0_20px_40px_rgba(255,216,77,0.15)]" />
                    </motion.div>

                    <div className="flex flex-col gap-6">
                        {references.map((ref, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors group cursor-default"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 bg-primary-yellow/20 text-primary-yellow text-xs font-bold uppercase tracking-wider rounded-md">
                                        {ref.name}
                                    </span>
                                </div>
                                <h4 className="text-white font-mono leading-relaxed text-sm pr-8 relative">
                                    {ref.title}
                                    <Terminal className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-primary-yellow transition-colors opacity-0 group-hover:opacity-100" />
                                </h4>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
