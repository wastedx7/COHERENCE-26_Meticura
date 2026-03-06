import React from 'react';
import { SectionHeader } from '../../components/common/SectionHeader';
import { motion } from 'framer-motion';
import { GlassCard } from '../../components/common/GlassCard';
import { Shield, Settings, LineChart, Handshake, BrainCog } from 'lucide-react';

export const Innovation = () => {
    const innovations = [
        {
            icon: <BrainCog className="w-8 h-8 text-white" />,
            title: "Isolation Forest ML Detection",
            desc: "Unsupervised learning that flags what deviates from normal. Perfect for tabular datasets missing explicit labels of structural corruption.",
            span: "md:col-span-2"
        },
        {
            icon: <Settings className="w-8 h-8 text-white" />,
            title: "Deterministic Rule Engine",
            desc: "ML paired alongside 6 critical hard-rules enforcing absolute spending limits, zeroing in on logic gaps.",
            span: "md:col-span-1"
        },
        {
            icon: <LineChart className="w-8 h-8 text-white" />,
            title: "Weighted Extrapolator",
            desc: "A highly-explainable linear extrapolation model predicting lapse over prioritizing 3x weight on latest operational spending.",
            span: "md:col-span-1"
        },
        {
            icon: <Handshake className="w-8 h-8 text-white" />,
            title: "Reallocation Engine",
            desc: "A matching optimization algorithm bridging budget-starved sectors by recommending liquid transfers from donors expected to lapse.",
            span: "md:col-span-2"
        }
    ];

    return (
        <section id="innovation" className="py-24 relative">
            <div className="container mx-auto px-6 lg:px-12">
                <SectionHeader
                    title="Technological Innovations"
                    subtitle="Advanced mathematics built for maximum scale and government transparency. No unexplainable black boxes."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 auto-rows-fr">
                    {innovations.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            className={item.span}
                        >
                            <GlassCard hasHover className="h-full flex flex-col justify-center bg-gradient-to-br from-white/10 to-transparent border-white/5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-primary-yellow/0 group-hover:bg-primary-yellow/5 transition-colors duration-500"></div>
                                <div className="relative z-10 flex flex-col gap-4">
                                    <div className="p-3 bg-black/50 rounded-xl w-max shadow-inner border border-white/10 group-hover:border-primary-yellow/40 transition-colors">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">{item.title}</h3>
                                    <p className="text-gray-400 font-medium leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
