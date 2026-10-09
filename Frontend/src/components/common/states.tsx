import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api/errors';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <LoaderCircle aria-hidden className="size-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <Inbox aria-hidden className="size-8 text-muted-foreground" />
      <h2 className="font-medium">{title}</h2>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <AlertTriangle aria-hidden className="size-8 text-destructive" />
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
