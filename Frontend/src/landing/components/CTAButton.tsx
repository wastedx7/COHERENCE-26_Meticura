import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface CTAButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'glass';
    children: React.ReactNode;
    icon?: boolean;
    className?: string;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
    variant = 'primary',
    children,
    icon = false,
    className = '',
    ...props
}) => {
    const baseStyles = "relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 overflow-hidden group";

    const variants = {
        primary: "bg-primary-yellow text-primary-black hover:bg-warning-yellow hover:shadow-[0_0_20px_rgba(255,216,77,0.4)]",
        secondary: "bg-white text-primary-black hover:bg-gray-200",
        glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20"
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            <span className="relative z-10">{children}</span>
            {icon && (
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            )}
            {/* Glossy overlay effect for primary variant */}
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            )}
        </motion.button>
    );
};
