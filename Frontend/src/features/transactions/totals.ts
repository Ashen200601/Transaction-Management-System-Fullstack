import { percentageOf } from '@/lib/money';

export interface LineAmounts {
  quantity: number;
  /** Minor units. */
  unitPrice: number;
  /** Minor units off the whole line. */
  discount?: number;
}

export interface TransactionTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export function calculateLineTotal({ quantity, unitPrice, discount = 0 }: LineAmounts): number {
  return Math.max(0, quantity * unitPrice - discount);
}

/**
 * Cart totals in minor units. Tax applies to the amount after discounts.
 * The API recalculates these; the client figures are for display.
 */
export function calculateTransactionTotals(
  lines: readonly LineAmounts[],
  { taxRatePercent }: { taxRatePercent: number },
): TransactionTotals {
  let subtotal = 0;
  let discount = 0;
  for (const line of lines) {
    const gross = line.quantity * line.unitPrice;
    subtotal += gross;
    discount += Math.min(line.discount ?? 0, gross);
  }
  const tax = percentageOf(subtotal - discount, taxRatePercent);
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}
