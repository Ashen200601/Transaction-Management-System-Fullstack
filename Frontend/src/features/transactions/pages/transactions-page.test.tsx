import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildBusiness, buildPage, buildTransaction } from '@/test/factories';
import { server } from '@/test/server';
import { currentLocation, renderWithProviders, screen, waitFor, within } from '@/test/test-utils';

import { TransactionsPage } from './transactions-page';

/** Answers GET /transactions with `respond` and records every request URL. */
function mockTransactions(respond: (url: URL) => Response) {
  const requests: URL[] = [];
  server.use(
    http.get('*/transactions', ({ request }) => {
      const url = new URL(request.url);
      requests.push(url);
      return respond(url);
    }),
  );
  return requests;
}

function renderPage(options: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<TransactionsPage />, { route: '/transactions', path: '/transactions', ...options });
}

describe('TransactionsPage', () => {
  it('lists transactions with reference, status and total', async () => {
    mockTransactions(() =>
      HttpResponse.json(
        buildPage([
          buildTransaction({ reference: 'TXN-000001', status: 'completed', total: 2750 }),
          buildTransaction({ reference: 'TXN-000002', status: 'voided', total: 1200 }),
        ]),
      ),
    );
    renderPage();

    const completed = await screen.findByRole('row', { name: /TXN-000001/ });
    expect(within(completed).getByText('Completed')).toBeInTheDocument();
    expect(within(completed).getByText('$27.50')).toBeInTheDocument();

    const voided = screen.getByRole('row', { name: /TXN-000002/ });
    expect(within(voided).getByText('Voided')).toBeInTheDocument();
    expect(within(voided).getByText('$12.00')).toBeInTheDocument();
  });

  it('links each transaction to its detail page', async () => {
    mockTransactions(() =>
      HttpResponse.json(buildPage([buildTransaction({ id: 'txn_0042', reference: 'TXN-000042' })])),
    );
    renderPage();

    expect(await screen.findByRole('link', { name: 'TXN-000042' })).toHaveAttribute('href', '/transactions/txn_0042');
  });

  it('shows an empty state when there are no transactions', async () => {
    mockTransactions(() => HttpResponse.json(buildPage([])));
    renderPage();

    expect(await screen.findByText(/no transactions yet/i)).toBeInTheDocument();
  });

  it('shows the error with a retry button when loading fails', async () => {
    let attempts = 0;
    mockTransactions(() => {
      attempts += 1;
      return attempts === 1
        ? HttpResponse.json({ title: 'Server error' }, { status: 500 })
        : HttpResponse.json(buildPage([buildTransaction({ reference: 'TXN-000009' })]));
    });
    const { user } = renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Server error');
    await user.click(within(alert).getByRole('button', { name: /try again/i }));

    expect(await screen.findByText('TXN-000009')).toBeInTheDocument();
  });

  it('filters by status and goes back to the first page', async () => {
    const requests = mockTransactions(() => HttpResponse.json(buildPage([buildTransaction()], { totalItems: 60 })));
    const { user } = renderPage({ route: '/transactions?page=3' });
    await waitFor(() => expect(requests[0]?.searchParams.get('page')).toBe('3'));

    await user.selectOptions(screen.getByRole('combobox', { name: /status/i }), 'Voided');

    await waitFor(() => expect(requests.at(-1)?.searchParams.get('status')).toBe('voided'));
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
    expect(currentLocation().searchParams.get('status')).toBe('voided');
  });

  it('searches once the user stops typing', async () => {
    const requests = mockTransactions(() => HttpResponse.json(buildPage([])));
    const { user } = renderPage();

    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'TXN-0042');

    await waitFor(() => expect(requests.at(-1)?.searchParams.get('search')).toBe('TXN-0042'));
    // Debounced: one search request for the final term, not one per keystroke.
    expect(requests.filter((url) => url.searchParams.has('search'))).toHaveLength(1);
  });

  it('pages through results and keeps the page in the URL', async () => {
    const requests = mockTransactions((url) =>
      HttpResponse.json(
        buildPage([buildTransaction()], { page: Number(url.searchParams.get('page') ?? 1), totalItems: 45 }),
      ),
    );
    const { user } = renderPage();
    await screen.findByText('Page 1 of 3');

    await user.click(screen.getByRole('button', { name: /next page/i }));

    await waitFor(() => expect(requests.at(-1)?.searchParams.get('page')).toBe('2'));
    expect(currentLocation().searchParams.get('page')).toBe('2');
  });

  it.each([
    ['cashier', true],
    ['viewer', false],
  ] as const)('shows "New transaction" to a %s: %s', async (role, visible) => {
    mockTransactions(() => HttpResponse.json(buildPage([])));
    renderPage({ tenant: { activeBusiness: buildBusiness({ role }) } });
    await screen.findByText(/no transactions yet/i);

    expect(screen.queryAllByRole('link', { name: /new transaction/i }).length > 0).toBe(visible);
  });
});
