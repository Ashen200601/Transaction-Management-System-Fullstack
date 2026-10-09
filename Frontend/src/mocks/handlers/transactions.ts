import { http, HttpResponse } from 'msw';

import type { Product } from '@/features/products/types';
import { newTransactionSchema, voidTransactionSchema } from '@/features/transactions/schemas';
import type { Transaction } from '@/features/transactions/types';
import { toIsoDate } from '@/lib/dates';

import { DEMO_USER, nextId, totalsFor, type BusinessStore } from '../db';
import { api, latency, matchesSearch, paginate, problem, requireStore, validationProblem } from '../utils';

/** Moves stock for every line: -1 takes it out (sale), +1 puts it back (refund, void). */
function moveStock(store: BusinessStore, transaction: Transaction, direction: 1 | -1) {
  for (const line of transaction.lines) {
    const stock = store.stock.get(line.productId);
    if (stock) {
      stock.onHand += direction * line.quantity;
      stock.updatedAt = new Date().toISOString();
    }
  }
}

const isUnlimited = (product: Product) => product.sku.startsWith('GIFT');

export const transactionHandlers = [
  http.get(api('/transactions'), async ({ request }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const items = store.transactions.filter((transaction) => {
      const day = toIsoDate(new Date(transaction.createdAt));
      return (
        (!status || transaction.status === status) &&
        matchesSearch(search, transaction.reference, transaction.customerName) &&
        (!from || day >= from) &&
        (!to || day <= to)
      );
    });
    return HttpResponse.json(paginate(items, url));
  }),

  http.get(api('/transactions/:id'), async ({ request, params }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    const transaction = store.transactions.find((candidate) => candidate.id === params.id);
    return transaction ? HttpResponse.json(transaction) : problem(404, 'Transaction not found', { code: 'NOT_FOUND' });
  }),

  http.post(api('/transactions'), async ({ request }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;

    // A retried request with the same key gets the original result, not a second sale.
    const key = request.headers.get('idempotency-key');
    const previous = key ? store.idempotency.get(key) : undefined;
    if (previous) return HttpResponse.json(previous, { status: 200 });

    const parsed = newTransactionSchema.safeParse(await request.json());
    if (!parsed.success) return validationProblem(parsed.error.issues);
    const input = parsed.data;

    const errors: Record<string, string[]> = {};
    const items: Array<{ product: Product; quantity: number; unitPrice: number; discount: number }> = [];
    input.lines.forEach((line, index) => {
      const product = store.products.find((candidate) => candidate.id === line.productId);
      if (!product) {
        errors[`lines.${index}.productId`] = ['This product no longer exists'];
        return;
      }
      if (input.type === 'sale') {
        if (!product.active) errors[`lines.${index}.productId`] = [`${product.name} is not for sale`];
        const onHand = store.stock.get(product.id)?.onHand ?? 0;
        if (!isUnlimited(product) && onHand < line.quantity) {
          errors[`lines.${index}.quantity`] = [onHand > 0 ? `Only ${onHand} in stock` : 'Out of stock'];
        }
      }
      // Sales use the current price (the server is the source of truth); refunds the price paid.
      const unitPrice = input.type === 'sale' ? product.price : line.unitPrice;
      items.push({ product, quantity: line.quantity, unitPrice, discount: line.discount });
    });

    let original: Transaction | undefined;
    if (input.type === 'refund') {
      original = store.transactions.find((candidate) => candidate.id === input.originalTransactionId);
      if (!original || original.type !== 'sale' || original.status !== 'completed') {
        errors.originalTransactionId = ['Only completed sales can be refunded'];
      }
    }

    if (Object.keys(errors).length > 0) {
      return problem(422, 'Validation failed', { code: 'VALIDATION_ERROR', detail: 'Some items need attention.', errors });
    }

    const lines = items.map(({ product, quantity, unitPrice, discount }) => ({
      id: nextId('line'),
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      discount,
      lineTotal: Math.max(0, quantity * unitPrice - discount),
    }));
    const customer = input.customerId ? store.customers.find((candidate) => candidate.id === input.customerId) : undefined;

    const transaction: Transaction = {
      id: nextId('txn'),
      reference: `TXN-${String(store.nextReference++).padStart(6, '0')}`,
      type: input.type,
      status: 'completed',
      paymentMethod: input.paymentMethod,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? null,
      originalTransactionId: original?.id ?? null,
      currency: store.business.currency,
      lines,
      ...totalsFor(lines, store.business),
      note: input.note || null,
      createdAt: new Date().toISOString(),
      createdBy: DEMO_USER,
      voidedAt: null,
      voidReason: null,
    };

    moveStock(store, transaction, input.type === 'sale' ? -1 : 1);
    store.transactions.unshift(transaction);
    if (key) store.idempotency.set(key, transaction);
    return HttpResponse.json(transaction, { status: 201 });
  }),

  http.post(api('/transactions/:id/void'), async ({ request, params }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;

    const transaction = store.transactions.find((candidate) => candidate.id === params.id);
    if (!transaction) return problem(404, 'Transaction not found', { code: 'NOT_FOUND' });
    if (transaction.status === 'voided') {
      return problem(409, 'This transaction is already voided.', { code: 'ALREADY_VOIDED' });
    }

    const parsed = voidTransactionSchema.safeParse(await request.json());
    if (!parsed.success) return validationProblem(parsed.error.issues);

    if (transaction.status === 'completed') {
      moveStock(store, transaction, transaction.type === 'sale' ? 1 : -1);
    }
    transaction.status = 'voided';
    transaction.voidedAt = new Date().toISOString();
    transaction.voidReason = parsed.data.reason;
    return HttpResponse.json(transaction);
  }),
];
