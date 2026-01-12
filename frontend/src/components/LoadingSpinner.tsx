'use client';

import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = { sm: 'w-6 h-6 border-2', md: 'w-10 h-10 border-3', lg: 'w-16 h-16 border-4' };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div
        className={cn('rounded-full border-charcoal-200 border-t-primary-500 animate-spin', sizeClasses[size])}
        role="status"
      >
        <span className="sr-only">{text || 'Chargement...'}</span>
      </div>
      {text && <p className="text-charcoal-600 text-sm">{text}</p>}
    </div>
  );
}

export function PollCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border-2 border-charcoal-100 bg-white animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="h-6 bg-charcoal-200 rounded w-3/4" />
        <div className="h-6 bg-charcoal-200 rounded w-16" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-8 bg-charcoal-200 rounded-full w-20" />
        <div className="h-8 bg-charcoal-200 rounded-full w-24" />
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-charcoal-200 rounded w-24" />
        <div className="h-4 bg-charcoal-200 rounded w-20" />
      </div>
    </div>
  );
}

export default LoadingSpinner;
