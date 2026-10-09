import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildCustomer, buildPage } from '@/test/factories';
import { server } from '@/test/server';
import { renderWithProviders, screen, waitFor, within } from '@/test/test-utils';

import { CustomersPage } from './customers-page';

function renderPage() {
  return renderWithProviders(<CustomersPage />, { route: '/customers', path: '/customers' });
}

describe('CustomersPage', () => {
  it('lists customers with their contact details', async () => {
    server.use(
      http.get('*/customers', () =>
        HttpResponse.json(buildPage([buildCustomer({ name: 'Jane Customer', email: 'jane@example.com' })])),
      ),
    );
    renderPage();

    const row = await screen.findByRole('row', { name: /Jane Customer/ });
    expect(within(row).getByText('jane@example.com')).toBeInTheDocument();
  });

  it('searches by name, email or phone', async () => {
    const requests: URL[] = [];
    server.use(
      http.get('*/customers', ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        return HttpResponse.json(
          buildPage(
            url.searchParams.get('search')
              ? [buildCustomer({ name: 'Nimal Perera' })]
              : [buildCustomer({ name: 'Jane Customer' }), buildCustomer({ name: 'Nimal Perera' })],
          ),
        );
      }),
    );
    const { user } = renderPage();
    await screen.findByText('Jane Customer');

    await user.type(screen.getByRole('searchbox', { name: /search customers/i }), 'nimal');

    await waitFor(() => expect(screen.queryByText('Jane Customer')).not.toBeInTheDocument());
    expect(screen.getByText('Nimal Perera')).toBeInTheDocument();
    expect(requests.at(-1)?.searchParams.get('search')).toBe('nimal');
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
  });

  it('says so when nothing matches', async () => {
    server.use(http.get('*/customers', () => HttpResponse.json(buildPage([]))));
    renderPage();

    expect(await screen.findByText(/no customers found/i)).toBeInTheDocument();
  });
});
