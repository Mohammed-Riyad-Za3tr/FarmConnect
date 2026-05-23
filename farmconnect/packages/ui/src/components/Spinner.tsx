import * as React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export function Spinner({ size = 'md', className, label = 'Loading...' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={['inline-block', className].filter(Boolean).join(' ')}>
      <span
        className={[
          sizeClasses[size],
          'block animate-spin rounded-full border-2 border-current border-t-transparent',
        ].join(' ')}
      />
    </span>
  );
}
