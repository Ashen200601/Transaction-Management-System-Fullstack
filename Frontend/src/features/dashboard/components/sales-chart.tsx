import { formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';

interface SalesChartProps {
  days: Array<{ date: string; total: number }>;
  currency: string;
}

/** Bar chart of daily net sales. Each bar is labelled for screen readers. */
export function SalesChart({ days, currency }: SalesChartProps) {
  const max = Math.max(1, ...days.map((day) => day.total));

  return (
    <ul className="flex h-48 items-end gap-2 sm:gap-3" aria-label="Net sales per day">
      {days.map((day) => {
        const label = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(day.date));
        const amount = formatMoney(day.total, currency);
        return (
          <li key={day.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="text-[11px] text-muted-foreground opacity-0 tabular-nums transition-opacity group-hover:opacity-100">
              {amount}
            </span>
            <div
              className="w-full max-w-12 rounded-t-md bg-primary/80 transition-colors group-hover:bg-primary"
              style={{ height: `${Math.max(2, (day.total / max) * 100)}%` }}
              title={`${formatDate(day.date, { timeZone: 'UTC' })}: ${amount}`}
            />
            <span className="text-xs text-muted-foreground" aria-hidden>
              {label}
            </span>
            <span className="sr-only">
              {formatDate(day.date, { timeZone: 'UTC' })}: {amount}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
