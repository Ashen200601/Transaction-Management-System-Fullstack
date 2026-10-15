import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

import { controlClassName } from './input';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClassName, 'min-h-20 py-2', className)} {...props} />;
}
