/** Prices are integer minor units (cents). */
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number | null;
  /** Stock at or below this level counts as low. */
  reorderLevel: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
