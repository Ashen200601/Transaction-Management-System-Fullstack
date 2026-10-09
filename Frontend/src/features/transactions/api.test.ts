import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { buildPage, buildTransaction } from '@/test/factories';
import { server } from '@/test/server';

import { createTransaction, getTransaction, listTransactions, voidTransaction } from './api';

describe('transactions api', () => {
  it('lists transactions with paging and filters', async () => {
    let url: URL | undefined;
    const page = buildPage([buildTransaction()], { page: 2, totalItems: 21 });
    server.use(
      http.get('*/transactions', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page);
      }),
    );

    await expect(
      listTransactions({
        page: 2,
        pageSize: 20,
        status: 'voided',
        search: 'TXN-0042',
        from: '2026-03-01',
        to: '2026-03-31',
      }),
    ).resolves.toEqual(page);

    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
      page: '2',
      pageSize: '20',
      status: 'voided',
      search: 'TXN-0042',
      from: '2026-03-01',
      to: '2026-03-31',
    });
  });

  it('fetches a single transaction', async () => {
    const transaction = buildTransaction({ id: 'txn_0042' });
    server.use(
      http.get('*/transactions/:id', ({ params }) =>
        params.id === 'txn_0042' ? HttpResponse.json(transaction) : new HttpResponse(null, { status: 404 }),
      ),
    );

    await expect(getTransaction('txn_0042')).resolves.toEqual(transaction);
  });

  it('creates a transaction with an idempotency key so a retry cannot charge twice', async () => {
    let body: unknown;
    let idempotencyKey: string | null = null;
    const created = buildTransaction({ id: 'txn_0100' });
    server.use(
      http.post('*/transactions', async ({ request }) => {
        body = await request.json();
        idempotencyKey = request.headers.get('idempotency-key');
        return HttpResponse.json(created, { status: 201 });
      }),
    );
    const input = {
      type: 'sale',
      paymentMethod: 'card',
      customerId: null,
      originalTransactionId: null,
      note: '',
      lines: [{ productId: 'prod_0001', quantity: 1, unitPrice: 2500, discount: 0 }],
    } satisfies Parameters<typeof createTransaction>[0];

    await expect(createTransaction(input, 'idem-123')).resolves.toEqual(created);

    expect(body).toEqual(input);
    expect(idempotencyKey).toBe('idem-123');
  });

  it('voids a transaction with a reason', async () => {
    let voidedId: unknown;
    let body: unknown;
    const voided = buildTransaction({ id: 'txn_0007', status: 'voided', voidReason: 'Duplicate sale' });
    server.use(
      http.post('*/transactions/:id/void', async ({ params, request }) => {
        voidedId = params.id;
        body = await request.json();
        return HttpResponse.json(voided);
      }),
    );

    await expect(voidTransaction('txn_0007', { reason: 'Duplicate sale' })).resolves.toEqual(voided);

    expect(voidedId).toBe('txn_0007');
    expect(body).toEqual({ reason: 'Duplicate sale' });
  });

  it('surfaces API failures as ApiError', async () => {
    server.use(
      http.post('*/transactions/:id/void', () =>
        HttpResponse.json({ title: 'Transaction already voided', code: 'ALREADY_VOIDED' }, { status: 409 }),
      ),
    );

    const error = await voidTransaction('txn_0007', { reason: 'Duplicate sale' }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'ALREADY_VOIDED' });
  });
});
