import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
    title: string;
    subtitle: string;
    alignment?: 'left' | 'center';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, alignment = 'center' }) => {
    const alignmentClass = alignment === 'left' ? 'text-left mr-auto' : 'text-center mx-auto';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`max-w-3xl ${alignmentClass}`}
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
