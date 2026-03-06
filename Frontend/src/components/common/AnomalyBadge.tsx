import React from 'react';
import { Badge } from '../ui/Badge';
import type { AnomalySeverity } from '../../api/types';

interface AnomalyBadgeProps {
  severity: AnomalySeverity;
  count?: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const AnomalyBadge: React.FC<AnomalyBadgeProps> = ({
  severity,
  count,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const variants: Record<AnomalySeverity, 'danger' | 'warning' | 'info' | 'default'> = {
    critical: 'danger',
    high: 'warning',
    medium: 'warning',
    low: 'info',
  };

  const labels: Record<AnomalySeverity, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const label = showLabel ? labels[severity] : '';
  const displayText = count !== undefined ? `${label} (${count})` : label;
  const pulse = severity === 'critical';

  return (
    <Badge
      variant={variants[severity]}
      size={size}
      pulse={pulse}
      className={className}
    >
      {displayText}
    </Badge>
  );
};
