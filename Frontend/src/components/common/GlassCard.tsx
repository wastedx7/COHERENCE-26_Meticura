import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hasHover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hasHover = false, ...props }) => {
    return (
        <motion.div
            className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 ${className}`}
            whileHover={hasHover ? { scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" } : undefined}
            transition={{ type: "spring", stiffness: 300 }}
            {...props}
        >
            {children}
        </motion.div>
    );
};
