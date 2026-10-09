import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

import { controlClassName } from './input';

/** A styled native <select>: accessible and mobile-friendly out of the box. */
export function NativeSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('relative', className)}>
      <select className={cn(controlClassName, 'h-9 appearance-none pr-8')} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
