import React from 'react';
import { SectionHeader } from '../../components/common/SectionHeader';
import { FeatureCard } from '../../components/common/FeatureCard';
import { AlertOctagon, TrendingDown, Clock12 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Problem = () => {
    const problems = [
        {
            icon: <AlertOctagon />,
            title: "Suspicious & Erractic Spending",
            description: "Departments burst spend their budgets in days, dump transactions at year-end, or split micro-transactions to hide massive extractions."
        },
        {
            icon: <TrendingDown />,
            title: "Budget Lapsing",
            description: "Funds meant for roads, health, and education are forgotten by slow departments, lapsing back unspent simply because nobody tracks live utilization."
        },
        {
            icon: <Clock12 />,
            title: "Caught Too Late",
            description: "Without early-warning systems, auditors and state officials only catch mismanagement long after the fiscal year is already over."
        }
    ];

    return (
        <section id="problem" className="py-24 relative">
            <div className="container mx-auto px-6 lg:px-12">
                <SectionHeader
                    title="The Budget Leakage Crisis"
                    subtitle="Billions in public money wasted or lost because systems are reactive rather than proactive."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 relative z-10">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2, duration: 0.5 }}
                        >
                            <FeatureCard
                                icon={problem.icon}
                                title={problem.title}
                                description={problem.description}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
