import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

interface MoneyTextProps {
  /** Integer minor units (cents). */
  amount: number;
  currency: string;
  className?: string;
}

export function MoneyText({ amount, currency, className }: MoneyTextProps) {
  return <span className={cn('tabular-nums', className)}>{formatMoney(amount, currency)}</span>;
}
