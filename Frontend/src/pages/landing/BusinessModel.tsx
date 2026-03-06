import React from 'react';
import { SectionHeader } from '../../components/common/SectionHeader';
import { motion } from 'framer-motion';
import { FeatureCard } from '../../components/common/FeatureCard';
import { Building, Users, Search, Target } from 'lucide-react';

export const BusinessModel = () => {
    const models = [
        {
            icon: <Building />,
            title: "State Departments",
            desc: "Full overview commanding multiple districts assessing performance and stopping fraud."
        },
        {
            icon: <Search />,
            title: "Financial Auditors",
            desc: "Granular anomaly tools to quickly drill down into specific departmental misusage flags."
        },
        {
            icon: <Target />,
            title: "City Policy Planners",
            desc: "Capitalizing on Reallocation Engines to optimize funds towards stressed civic priorities."
        },
        {
            icon: <Users />,
            title: "Citizen Transparency",
            desc: "Public-facing filtered analytics ensuring open trust and responsible administration."
        }
    ];

    return (
        <section id="business-model" className="py-24 bg-soft-black border-y border-white/5 relative">
            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <SectionHeader
                    title="Platform Users"
                    subtitle="A versatile tool spanning from top-level oversight down to grassroots planning."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 group">
                    {models.map((model, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="hover:-translate-y-2 transition-transform duration-300"
                        >
                            <FeatureCard
                                icon={model.icon}
                                title={model.title}
                                description={model.desc}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
