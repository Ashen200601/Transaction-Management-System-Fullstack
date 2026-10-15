import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

import { controlClassName } from './input';

/** The browser's own select, styled like the other controls. */
export function NativeSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClassName, 'h-9', className)} {...props} />;
}
