import React from 'react';
import { SectionHeader } from './SectionHeader';
import { motion } from 'framer-motion';
import { Shield, BookOpen, Fingerprint, Banknote } from 'lucide-react';
import impactSvg from '../../assets/undraw_counting-stars_1fur.svg';
export const Impact = () => {
    const impacts = [
        {
            icon: <Banknote />,
            title: "Eliminate Year-End Dump",
            desc: "Stops rushed, inefficient spending just to hit budget goals by predicting trends actively."
        },
        {
            icon: <Shield />,
            title: "Detect Structural Fraud",
            desc: "Prevent shell-contractors and ghost-departments via unsupervised behavior anomaly analysis."
        },
        {
            icon: <BookOpen />,
            title: "Absolute Auditability",
            desc: "Zero black box answers. Linear rules and transparent reasoning strings for complete trust."
        },
        {
            icon: <Fingerprint />,
            title: "Optimize Capital Efficiency",
            desc: "Reallocation pairing bridges gaps, moving unspent money securely where it matters rather than lapsing it."
        }
    ];

    return (
        <section id="impact" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-6 lg:px-12">
                <SectionHeader
                    title="Sovereign Impact"
                    subtitle="How programmatic budget monitoring transforms public money utilization."
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-16 items-center">
                    <div className="flex flex-col gap-10">
                        {impacts.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.5 }}
                                className="flex gap-6 items-start"
                            >
                                <div className="p-4 bg-primary-yellow/10 rounded-2xl flex-shrink-0 mt-1">
                                    {React.cloneElement(item.icon as React.ReactElement<any>, { className: "w-8 h-8 text-primary-yellow" })}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white mb-3 tracking-tight">{item.title}</h4>
                                    <p className="text-gray-400 leading-relaxed max-w-sm">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex justify-center"
                    >
                        <img src={impactSvg} alt="Sovereign Impact" className="w-full max-w-md drop-shadow-[0_20px_40px_rgba(255,216,77,0.15)]" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
