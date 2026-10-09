import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-destructive/12 text-destructive',
  info: 'bg-primary/12 text-primary',
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', TONES[tone], className)}
      {...props}
    />
  );
}
