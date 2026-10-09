import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const controlClassName = cn(
  'w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs transition-colors',
  'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
  'aria-invalid:border-destructive',
);

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClassName, 'h-9', className)} {...props} />;
}
