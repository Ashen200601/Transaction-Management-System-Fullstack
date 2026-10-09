import { http, HttpResponse } from 'msw';
import { z } from 'zod';

import { getStockStatus } from '@/features/inventory/stock-status';
import type { InventoryItem } from '@/features/inventory/types';
import type { Product } from '@/features/products/types';

import { nextId, type BusinessStore } from '../db';
import { api, latency, matchesSearch, paginate, problem, requireStore, validationProblem } from '../utils';

// What the API accepts for a product (the form converts to this shape).
const productBodySchema = z.object({
  name: z.string().trim().min(1, 'Enter a product name').max(120),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,32}$/, 'Use 3–32 letters, numbers or dashes'),
  price: z.number().int().nonnegative(),
  cost: z.number().int().nonnegative().nullable(),
  reorderLevel: z.number().int().nonnegative(),
  active: z.boolean(),
});

const adjustmentBodySchema = z.object({
  change: z
    .number()
    .int()
    .refine((value) => value !== 0, 'Enter a change other than 0'),
  reason: z.string().trim().min(1, 'Say why the stock changed').max(200),
});

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

function toInventoryItem(store: BusinessStore, product: Product): InventoryItem {
  const stock = store.stock.get(product.id) ?? { onHand: 0, updatedAt: product.createdAt };
  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    onHand: stock.onHand,
    reorderLevel: product.reorderLevel,
    updatedAt: stock.updatedAt,
  };
}

function skuTaken(store: BusinessStore, sku: string, exceptId?: string) {
  return store.products.some((product) => product.sku === sku && product.id !== exceptId);
}

export const catalogHandlers = [
  http.get(api('/products'), async ({ request }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const activeOnly = url.searchParams.get('activeOnly') === 'true';
    const items = store.products
      .filter((product) => (!activeOnly || product.active) && matchesSearch(search, product.name, product.sku))
      .sort(byName);
    return HttpResponse.json(paginate(items, url));
  }),

  http.post(api('/products'), async ({ request }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    const parsed = productBodySchema.safeParse(await request.json());
    if (!parsed.success) return validationProblem(parsed.error.issues);
    if (skuTaken(store, parsed.data.sku)) {
      return problem(422, 'Validation failed', { code: 'VALIDATION_ERROR', errors: { sku: ['Another product already uses this SKU'] } });
    }
    const now = new Date().toISOString();
    const product: Product = { id: nextId('prod'), ...parsed.data, createdAt: now, updatedAt: now };
    store.products.push(product);
    store.stock.set(product.id, { onHand: 0, updatedAt: now });
    return HttpResponse.json(product, { status: 201 });
  }),

  http.put(api('/products/:id'), async ({ request, params }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    const product = store.products.find((candidate) => candidate.id === params.id);
    if (!product) return problem(404, 'Product not found', { code: 'NOT_FOUND' });
    const parsed = productBodySchema.safeParse(await request.json());
    if (!parsed.success) return validationProblem(parsed.error.issues);
    if (skuTaken(store, parsed.data.sku, product.id)) {
      return problem(422, 'Validation failed', { code: 'VALIDATION_ERROR', errors: { sku: ['Another product already uses this SKU'] } });
    }
    Object.assign(product, parsed.data, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(product);
  }),

  http.get(api('/inventory'), async ({ request }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');
    const items = store.products
      .filter((product) => product.active)
      .sort(byName)
      .map((product) => toInventoryItem(store, product))
      .filter(
        (item) =>
          matchesSearch(search, item.productName, item.sku) &&
          (!status || getStockStatus(item.onHand, item.reorderLevel) === status),
      );
    return HttpResponse.json(paginate(items, url));
  }),

  http.post(api('/inventory/:productId/adjustments'), async ({ request, params }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    const product = store.products.find((candidate) => candidate.id === params.productId);
    const stock = product && store.stock.get(product.id);
    if (!product || !stock) return problem(404, 'Product not found', { code: 'NOT_FOUND' });
    const parsed = adjustmentBodySchema.safeParse(await request.json());
    if (!parsed.success) return validationProblem(parsed.error.issues);
    if (stock.onHand + parsed.data.change < 0) {
      return problem(422, 'Validation failed', {
        code: 'VALIDATION_ERROR',
        errors: { change: [`Only ${stock.onHand} in stock, so you can remove at most ${stock.onHand}`] },
      });
    }
    stock.onHand += parsed.data.change;
    stock.updatedAt = new Date().toISOString();
    return HttpResponse.json(toInventoryItem(store, product));
  }),

  http.get(api('/customers'), async ({ request }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const items = store.customers.filter((customer) => matchesSearch(search, customer.name, customer.email, customer.phone));
    return HttpResponse.json(paginate(items, url));
  }),
];
