import { http, HttpResponse } from 'msw';

import type { DashboardSummary } from '@/features/dashboard/types';
import { getStockStatus } from '@/features/inventory/stock-status';
import { toIsoDate } from '@/lib/dates';

import { BUSINESSES } from '../db';
import { api, latency, requireStore } from '../utils';

const dayKey = (iso: string) => toIsoDate(new Date(iso));

function daysAgoKey(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toIsoDate(date);
}

const change = (current: number, previous: number) => (previous > 0 ? (current - previous) / previous : null);

export const coreHandlers = [
  http.get(api('/businesses'), async () => {
    await latency();
    return HttpResponse.json(BUSINESSES);
  }),

  http.get(api('/dashboard/summary'), async ({ request }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;

    const byDay = new Map<string, { net: number; salesTotal: number; salesCount: number }>();
    for (const transaction of store.transactions) {
      if (transaction.status !== 'completed') continue;
      const key = dayKey(transaction.createdAt);
      const day = byDay.get(key) ?? { net: 0, salesTotal: 0, salesCount: 0 };
      if (transaction.type === 'sale') {
        day.net += transaction.total;
        day.salesTotal += transaction.total;
        day.salesCount += 1;
      } else {
        day.net -= transaction.total;
      }
      byDay.set(key, day);
    }

    const empty = { net: 0, salesTotal: 0, salesCount: 0 };
    const today = byDay.get(daysAgoKey(0)) ?? empty;
    const yesterday = byDay.get(daysAgoKey(1)) ?? empty;

    const summary: DashboardSummary = {
      currency: store.business.currency,
      salesToday: today.net,
      salesChange: change(today.net, yesterday.net),
      transactionsToday: today.salesCount,
      transactionsChange: change(today.salesCount, yesterday.salesCount),
      averageSale: today.salesCount ? Math.round(today.salesTotal / today.salesCount) : 0,
      lowStockCount: store.products.filter((product) => {
        const stock = store.stock.get(product.id);
        return product.active && stock && getStockStatus(stock.onHand, product.reorderLevel) !== 'in_stock';
      }).length,
      salesByDay: [6, 5, 4, 3, 2, 1, 0].map((days) => {
        const date = daysAgoKey(days);
        return { date, total: Math.max(0, byDay.get(date)?.net ?? 0) };
      }),
      recentTransactions: store.transactions.slice(0, 6),
    };
    return HttpResponse.json(summary);
  }),
];
