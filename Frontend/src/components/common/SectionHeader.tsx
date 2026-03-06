import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    alignment?: 'left' | 'center';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    alignment = 'center'
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={`mb-16 ${alignment === 'center' ? 'text-center max-w-3xl mx-auto' : 'text-left'}`}
        >
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-yellow/10 border border-primary-yellow/20 text-primary-yellow text-sm font-semibold tracking-wide uppercase mb-4 ${alignment === 'center' ? 'mx-auto' : ''}`}>
                <span className="w-2 h-2 rounded-full bg-primary-yellow animate-pulse"></span>
                AI Civic Shield
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-text-white mb-6 tracking-tight leading-tight">
                {title}
            </h2>
            {subtitle && (
                <p className="text-lg md:text-xl text-muted-gray leading-relaxed">
                    {subtitle}
                </p>
            )}
        </motion.div>
    );
};
