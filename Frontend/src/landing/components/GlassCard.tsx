import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hasHover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hasHover = true }) => {
    const hoverClasses = hasHover ? 'hover:bg-white/10 hover:border-white/20' : '';

    return (
        <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl transition-all ${hoverClasses} ${className}`}>
            {children}
        </div>
    );
};
