import React from 'react';
import { GlassCard } from './GlassCard';
import { TrendingUp, ShieldAlert, Activity } from 'lucide-react';

interface StatsCardProps {
    value: string;
    label: string;
    trend?: string;
    type?: 'positive' | 'warning' | 'neutral';
}

export const StatsCard: React.FC<StatsCardProps> = ({ value, label, trend, type = 'positive' }) => {
    const getIcon = () => {
        switch (type) {
            case 'warning': return <ShieldAlert className="w-5 h-5 text-warning-yellow" />;
            case 'neutral': return <Activity className="w-5 h-5 text-blue-400" />;
            case 'positive': default: return <TrendingUp className="w-5 h-5 text-green-400" />;
        }
    };

    return (
        <GlassCard hasHover className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-white tracking-tight">{value}</span>
                <div className="p-2 rounded-lg bg-white/5">
                    {getIcon()}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-text-white">{label}</span>
                {trend && (
                    <span className={`text-xs font-semibold ${type === 'warning' ? 'text-warning-yellow' : type === 'neutral' ? 'text-blue-400' : 'text-green-400'}`}>
                        {trend}
                    </span>
                )}
            </div>
        </GlassCard>
    );
};
