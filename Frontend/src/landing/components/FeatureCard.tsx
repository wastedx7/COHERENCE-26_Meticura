import React from 'react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all">
            <div className="text-primary-yellow mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
                {title}
            </h3>
            <p className="text-gray-400 leading-relaxed">
                {description}
            </p>
        </div>
    );
};
