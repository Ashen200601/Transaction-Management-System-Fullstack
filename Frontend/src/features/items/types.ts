import type { Unit } from '@/features/units/types';

export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  description: string | null;
  /** In minor units (cents): 12.50 is 1250. */
  price: number;
  unit: Unit;
}
