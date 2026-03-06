import React from 'react';
import { useUIStore } from '../../store';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  compact?: boolean;
  showSymbol?: boolean;
  colorize?: boolean;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  compact = false,
  colorize = false,
  className,
}) => {
  const { currency, compactMode } = useUIStore();
  
  const shouldCompact = compact || compactMode;
  const displayValue = formatCurrency(amount, currency, shouldCompact);

  return (
    <span
      className={cn(
        'font-mono',
        colorize && amount >= 0 && 'text-green-600',
        colorize && amount < 0 && 'text-red-600',
        className
      )}
    >
      {displayValue}
    </span>
  );
};
