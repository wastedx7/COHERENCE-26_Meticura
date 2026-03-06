import React from 'react';
import { GlassCard } from './GlassCard';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
    return (
        <GlassCard hasHover className="flex flex-col gap-4 h-full">
            <div className="w-12 h-12 rounded-xl bg-primary-yellow/10 flex items-center justify-center text-primary-yellow">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-text-white">{title}</h3>
            <p className="text-muted-gray text-sm leading-relaxed flex-grow">
                {description}
            </p>
        </GlassCard>
    );
};
