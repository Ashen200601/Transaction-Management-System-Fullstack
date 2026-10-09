import type { Transaction } from '@/features/transactions/types';

/** Amounts are integer minor units. Changes are fractions vs the previous day (0.1 = +10%). */
export interface DashboardSummary {
  currency: string;
  salesToday: number;
  salesChange: number | null;
  transactionsToday: number;
  transactionsChange: number | null;
  averageSale: number;
  lowStockCount: number;
  /** Net sales per day for the last 7 days, oldest first. */
  salesByDay: Array<{ date: string; total: number }>;
  recentTransactions: Transaction[];
}
