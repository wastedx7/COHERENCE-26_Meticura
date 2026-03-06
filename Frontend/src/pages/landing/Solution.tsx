import React from 'react';
import { SectionHeader } from '../../components/common/SectionHeader';
import { GlassCard } from '../../components/common/GlassCard';
import { Activity, ShieldAlert, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const Solution = () => {
    const steps = [
        {
            id: "01",
            icon: <Activity className="w-10 h-10 text-primary-yellow" />,
            title: "Track Money Flow",
            desc: "Show allocated vs spent vs remaining funds for every department dynamically and live."
        },
        {
            id: "02",
            icon: <ShieldAlert className="w-10 h-10 text-primary-yellow" />,
            title: "Detect Anomalies",
            desc: "Automatically flag suspicious spending, ghost departments, year-end dumping, and budget overspend."
        },
        {
            id: "03",
            icon: <TrendingDown className="w-10 h-10 text-primary-yellow" />,
            title: "Predict Lapse Risk",
            desc: "Warn administrators months in advance if a department is on track to leave public money unspent by March 31."
        },
        {
            id: "04",
            icon: <ArrowRightLeft className="w-10 h-10 text-primary-yellow" />,
            title: "Strategic Reallocation",
            desc: "Autonomously recommend moving predicted-unspent money to departments rapidly exhausting their budgets."
        }
    ];

    return (
        <section id="solution" className="py-24 bg-soft-black border-y border-white/5 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-yellow/5 sm:bg-primary-yellow/10 blur-[150px] -z-10"></div>

            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <SectionHeader
                    title="The Platform Solution"
                    subtitle="Replacing reactive manual moderation with a proactive, ML-powered defense infrastructure."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 group">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.15, duration: 0.5 }}
                            className="relative"
                        >
                            <GlassCard className="h-full pt-10 pb-8 px-8 border-t-[3px] border-t-transparent hover:border-t-primary-yellow transition-colors group-hover:opacity-60 hover:!opacity-100">
                                <div className="absolute -top-6 -left-2 text-[100px] font-black leading-none text-white/[0.03] select-none -z-10">
                                    {step.id}
                                </div>
                                <div className="mb-6">{step.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-4 tracking-tight">{step.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                    {step.desc}
                                </p>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
