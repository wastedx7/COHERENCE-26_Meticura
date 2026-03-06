import React from 'react';
import { SectionHeader } from '../../components/common/SectionHeader';
import { motion } from 'framer-motion';
import { Shield, BookOpen, Fingerprint, Banknote } from 'lucide-react';

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 max-w-4xl mx-auto">
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
                                {React.cloneElement(item.icon as React.ReactElement, { className: "w-8 h-8 text-primary-yellow" })}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-3 tracking-tight">{item.title}</h4>
                                <p className="text-gray-400 leading-relaxed max-w-sm">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
