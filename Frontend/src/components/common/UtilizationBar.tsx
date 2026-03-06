import React from 'react';
import { cn, getUtilizationColor, formatPercent } from '../../lib/utils';

interface UtilizationBarProps {
  allocated: number;
  spent: number;
  remaining: number;
  showLabels?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UtilizationBar: React.FC<UtilizationBarProps> = ({
  allocated,
  spent,
  showLabels = false,
  height = 'md',
  className,
}) => {
  const utilizationPct = allocated > 0 ? (spent / allocated) * 100 : 0;
  const spentPct = allocated > 0 ? (spent / allocated) * 100 : 0;

  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Spent: {formatPercent(utilizationPct)}</span>
          <span>Remaining: {formatPercent(100 - utilizationPct)}</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', heights[height])}>
        <div
          className={cn(
            'h-full transition-all duration-300',
            getUtilizationColor(utilizationPct)
          )}
          style={{ width: `${Math.min(spentPct, 100)}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};
