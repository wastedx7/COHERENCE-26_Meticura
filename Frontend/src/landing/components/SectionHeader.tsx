import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
    title: string;
    subtitle: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
        >
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight">
                {title}
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
                {subtitle}
            </p>
        </motion.div>
    );
};
