import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Label } from './label';

export interface FieldControlProps {
  id: string;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
}

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  /** Shown at the end of the label row, e.g. a "Forgot password?" link. */
  labelAction?: ReactNode;
  /** Renders the control, wired to the label, hint and error. */
  children: (control: FieldControlProps) => ReactNode;
}

export function FormField({ label, error, hint, className, labelAction, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && !error ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={cn('grid gap-1.5', className)}>
      {labelAction ? (
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor={id}>{label}</Label>
          {labelAction}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy || undefined })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
