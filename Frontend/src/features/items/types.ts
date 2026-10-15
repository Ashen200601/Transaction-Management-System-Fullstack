export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  description: string | null;
  /** In minor units (cents): 12.50 is 1250. */
  price: number;
  unit: string;
}

/** The units an item can be sold in. `value` is what the API stores. */
export const ITEM_UNITS = [
  { value: 'PCS', label: 'Piece (pcs)' },
  { value: 'KG', label: 'Kilogram (kg)' },
  { value: 'G', label: 'Gram (g)' },
  { value: 'L', label: 'Litre (l)' },
  { value: 'ML', label: 'Millilitre (ml)' },
  { value: 'M', label: 'Metre (m)' },
  { value: 'BOX', label: 'Box' },
  { value: 'PACK', label: 'Pack' },
] as const;
