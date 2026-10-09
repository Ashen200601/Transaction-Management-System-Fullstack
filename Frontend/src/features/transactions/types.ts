export type TransactionType = 'sale' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'voided';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'mobile_wallet';

/** Amounts are integer minor units (cents). */
export interface TransactionLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface Transaction {
  id: string;
  /** Human-readable number printed on receipts, e.g. TXN-000042. */
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  customerId: string | null;
  customerName: string | null;
  /** For refunds: the sale being refunded. */
  originalTransactionId: string | null;
  currency: string;
  lines: TransactionLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
  voidedAt: string | null;
  voidReason: string | null;
}
