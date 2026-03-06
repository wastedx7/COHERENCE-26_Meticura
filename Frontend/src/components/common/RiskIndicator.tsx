import React from 'react';
import { cn } from '../../lib/utils';
import type { RiskLevel } from '../../api/types';

interface RiskIndicatorProps {
  risk: RiskLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  risk,
  showLabel = true,
  size = 'md',
  className,
}) => {
  const colors: Record<RiskLevel, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
    none: 'bg-green-500',
  };

  const labels: Record<RiskLevel, string> = {
    critical: 'Critical Risk',
    high: 'High Risk',
    medium: 'Medium Risk',
    low: 'Low Risk',
    none: 'No Risk',
  };

  const sizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('rounded-full', colors[risk], sizes[size])}
        title={labels[risk]}
      />
      {showLabel && (
        <span className={cn('font-medium text-gray-700', textSizes[size])}>
          {labels[risk]}
        </span>
      )}
    </div>
  );
};
