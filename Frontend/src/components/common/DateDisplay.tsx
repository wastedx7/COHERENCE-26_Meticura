import React from 'react';
import { formatDate, formatRelativeDate } from '../../lib/utils';

interface DateDisplayProps {
  date: string;
  format?: 'short' | 'long' | 'relative';
  className?: string;
}

export const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  format = 'short',
  className,
}) => {
  let displayValue: string;

  switch (format) {
    case 'short':
      displayValue = formatDate(date, 'MMM d, yyyy');
      break;
    case 'long':
      displayValue = formatDate(date, 'MMMM d, yyyy h:mm a');
      break;
    case 'relative':
      displayValue = formatRelativeDate(date);
      break;
    default:
      displayValue = date;
  }

  return (
    <span className={className} title={formatDate(date, 'MMMM d, yyyy h:mm a')}>
      {displayValue}
    </span>
  );
};
