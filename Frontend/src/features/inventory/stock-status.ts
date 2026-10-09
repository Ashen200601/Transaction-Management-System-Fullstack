import type { BadgeTone } from '@/components/ui/badge';

import type { StockStatus } from './types';

/** Out at zero or below; low at or below the reorder level. */
export function getStockStatus(onHand: number, reorderLevel: number): StockStatus {
  if (onHand <= 0) return 'out_of_stock';
  if (onHand <= reorderLevel) return 'low_stock';
  return 'in_stock';
}

const LABELS: Record<StockStatus, string> = {
  out_of_stock: 'Out of stock',
  low_stock: 'Low stock',
  in_stock: 'In stock',
};

export const STOCK_STATUS_TONES: Record<StockStatus, BadgeTone> = {
  out_of_stock: 'danger',
  low_stock: 'warning',
  in_stock: 'success',
};

export const stockStatusLabel = (status: StockStatus) => LABELS[status];
