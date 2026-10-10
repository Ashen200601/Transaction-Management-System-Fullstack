import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

import { Input } from './input';

/** A password field with a button to show or hide what was typed. */
export function PasswordInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={isVisible ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
      <button
        type="button"
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        onClick={() => setIsVisible((visible) => !visible)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground"
      >
        {isVisible ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
      </button>
    </div>
  );
}
