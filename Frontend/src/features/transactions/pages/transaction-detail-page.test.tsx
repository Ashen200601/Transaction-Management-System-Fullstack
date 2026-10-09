import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildBusiness, buildTransaction, buildTransactionLine } from '@/test/factories';
import { server } from '@/test/server';
import { renderWithProviders, screen, waitFor, within } from '@/test/test-utils';

import type { Transaction } from '../types';
import { TransactionDetailPage } from './transaction-detail-page';

function mockDetail(transaction: Transaction) {
  server.use(
    http.get('*/transactions/:id', ({ params }) =>
      params.id === transaction.id
        ? HttpResponse.json(transaction)
        : HttpResponse.json({ title: 'Transaction not found', code: 'NOT_FOUND' }, { status: 404 }),
    ),
  );
}

function renderDetail(id: string, options: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<TransactionDetailPage />, {
    route: `/transactions/${id}`,
    path: '/transactions/:id',
    ...options,
  });
}

describe('TransactionDetailPage', () => {
  it('shows the transaction, its lines and totals', async () => {
    mockDetail(
      buildTransaction({
        id: 'txn_0042',
        reference: 'TXN-000042',
        paymentMethod: 'card',
        lines: [buildTransactionLine({ productName: 'Espresso Beans 1kg', quantity: 2, unitPrice: 2500 })],
        subtotal: 5000,
        tax: 500,
        total: 5500,
      }),
    );
    renderDetail('txn_0042');

    expect(await screen.findByRole('heading', { name: /TXN-000042/ })).toBeInTheDocument();
    expect(screen.getByText('Espresso Beans 1kg')).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
    expect(screen.getByText('$55.00')).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown transaction', async () => {
    mockDetail(buildTransaction({ id: 'txn_0001' }));
    renderDetail('txn_9999');

    expect(await screen.findByText(/transaction not found/i)).toBeInTheDocument();
  });

  it('voids the transaction after the user gives a reason', async () => {
    const original = buildTransaction({ id: 'txn_0042', reference: 'TXN-000042', status: 'completed' });
    let current = original;
    let voidBody: unknown;
    server.use(
      http.get('*/transactions/:id', () => HttpResponse.json(current)),
      http.post('*/transactions/:id/void', async ({ request }) => {
        voidBody = await request.json();
        current = { ...original, status: 'voided', voidedAt: '2026-03-05T12:00:00.000Z', voidReason: 'Duplicate sale' };
        return HttpResponse.json(current);
      }),
    );
    const { user } = renderDetail('txn_0042', { tenant: { activeBusiness: buildBusiness({ role: 'admin' }) } });

    await user.click(await screen.findByRole('button', { name: /void transaction/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox', { name: /reason/i }), 'Duplicate sale');
    await user.click(within(dialog).getByRole('button', { name: /void transaction/i }));

    await waitFor(() => expect(voidBody).toEqual({ reason: 'Duplicate sale' }));
    expect(await screen.findByText('Voided')).toBeInTheDocument();
    expect(screen.getByText('Duplicate sale')).toBeInTheDocument();
  });

  it.each([
    ['cashier', 'completed'],
    ['admin', 'voided'],
  ] as const)('hides the void action from a %s on a %s transaction', async (role, status) => {
    mockDetail(buildTransaction({ id: 'txn_0042', reference: 'TXN-000042', status }));
    renderDetail('txn_0042', { tenant: { activeBusiness: buildBusiness({ role }) } });

    await screen.findByRole('heading', { name: /TXN-000042/ });
    expect(screen.queryByRole('button', { name: /void/i })).not.toBeInTheDocument();
  });
});
