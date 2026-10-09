export type Role = 'owner' | 'admin' | 'cashier' | 'viewer';

export type Permission =
  | 'dashboard:view'
  | 'transactions:view'
  | 'transactions:create'
  | 'transactions:void'
  | 'customers:view'
  | 'customers:manage'
  | 'products:view'
  | 'products:manage'
  | 'inventory:view'
  | 'inventory:adjust'
  | 'documents:review'
  | 'integrations:manage'
  | 'business:manage';

/** A business the signed-in user belongs to, with their role in it. */
export interface Business {
  id: string;
  name: string;
  currency: string;
  role: Role;
  /** Sales tax applied to new transactions, e.g. 8.25 for 8.25%. */
  taxRatePercent?: number;
}
