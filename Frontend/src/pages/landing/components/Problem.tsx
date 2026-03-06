import React from 'react';
import { SectionHeader } from '../../../components/common/SectionHeader';
import { FeatureCard } from '../../../components/common/FeatureCard';
import { AlertOctagon, TrendingDown, Clock12 } from 'lucide-react';
import { motion } from 'framer-motion';
import faqSvg from '../../../assets/undraw_faq_pgxi.svg';
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16 relative z-10 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex justify-center"
                    >
                        <img src={faqSvg} alt="Budget Leakage FAQ" className="w-full max-w-md drop-shadow-[0_20px_40px_rgba(255,216,77,0.15)]" />
                    </motion.div>
                    <div className="flex flex-col gap-6">
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
            </div>
        </section>
    );
};
