import { TrendingDown, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Fraction vs the previous period: 0.125 shows as +12.5%. */
  change?: number | null;
  hint?: string;
}

function formatChange(change: number) {
  const sign = change > 0 ? '+' : change < 0 ? '-' : '';
  return `${sign}${Math.abs(change * 100).toFixed(1)}%`;
}

export function StatTile({ label, value, change, hint }: StatTileProps) {
  const hasChange = typeof change === 'number' && Number.isFinite(change);
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {(hasChange || hint) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {hasChange && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                change > 0 && 'text-success',
                change < 0 && 'text-destructive',
              )}
            >
              {change > 0 && <TrendingUp aria-hidden className="size-3.5" />}
              {change < 0 && <TrendingDown aria-hidden className="size-3.5" />}
              <span>{formatChange(change)}</span>
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </Card>
  );
}
