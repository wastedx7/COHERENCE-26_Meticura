import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../store';
import { formatCurrency } from '../../lib/utils';

interface KPICardProps {
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down';
  isLoading?: boolean;
  isCurrency?: boolean;
  suffix?: string;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend,
  isLoading,
  isCurrency = false,
  suffix,
  className,
}) => {
  const { currency, compactMode } = useUIStore();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  const displayValue = isCurrency && typeof value === 'number'
    ? formatCurrency(value, currency, compactMode)
    : value;

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-bold text-gray-900 font-mono">
            {displayValue}
            {suffix && <span className="text-sm ml-1">{suffix}</span>}
          </h3>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center text-sm font-medium',
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend === 'up' ? (
                <TrendingUp size={16} className="mr-1" />
              ) : (
                <TrendingDown size={16} className="mr-1" />
              )}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
