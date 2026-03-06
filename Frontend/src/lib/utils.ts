// Utility functions for formatting and calculations

import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Currency formatting
export const formatCurrency = (
  amount: number,
  currency: 'USD' | 'INR' = 'USD',
  compact: boolean = false
): string => {
  if (compact && Math.abs(amount) >= 1000000) {
    const millions = amount / 1000000;
    return `${currency === 'INR' ? '₹' : '$'}${millions.toFixed(1)}M`;
  }

  if (compact && Math.abs(amount) >= 1000) {
    const thousands = amount / 1000;
    return `${currency === 'INR' ? '₹' : '$'}${thousands.toFixed(1)}K`;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(amount);
};

// Percentage formatting
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Date formatting
export const formatDate = (dateString: string, formatStr: string = 'MMM d, yyyy'): string => {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr);
  } catch {
    return dateString;
  }
};

// Relative date formatting
export const formatRelativeDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
};

// Number formatting
export const formatNumber = (value: number, compact: boolean = false): string => {
  if (compact && Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (compact && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat('en-US').format(value);
};

// Risk level color helper
export const getRiskColor = (risk: string): string => {
  const colors: Record<string, string> = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-blue-600 bg-blue-50',
    none: 'text-green-600 bg-green-50',
  };
  return colors[risk] || colors.none;
};

// Anomaly severity color helper
export const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };
  return colors[severity] || colors.low;
};

// Utilization color helper (for progress bars)
export const getUtilizationColor = (utilizationPct: number): string => {
  if (utilizationPct >= 90) return 'bg-red-500';
  if (utilizationPct >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

// Class name helper (similar to clsx)
export const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Truncate text
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Calculate days between dates
export const daysBetween = (date1: string, date2: string): number => {
  const d1 = parseISO(date1);
  const d2 = parseISO(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
