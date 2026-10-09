export interface InventoryItem {
  productId: string;
  productName: string;
  sku: string;
  onHand: number;
  reorderLevel: number;
  updatedAt: string;
}

export type StockStatus = 'out_of_stock' | 'low_stock' | 'in_stock';
