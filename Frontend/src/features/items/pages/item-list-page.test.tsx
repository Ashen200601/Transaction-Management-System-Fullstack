import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { UNITS } from '@/test/factories';
import { server } from '@/test/server';
import { renderWithProviders, screen, within } from '@/test/test-utils';

import { ItemListPage } from './item-list-page';

const beans = {
  id: '41',
  itemCode: 'ESP-1KG',
  itemName: 'Espresso Beans 1kg',
  description: 'Medium roast.',
  price: 2550,
  unit: UNITS[1],
};
const milk = { ...beans, id: '42', itemCode: 'MILK', itemName: 'Milk', description: null, price: 99, unit: UNITS[2] };

/** Answers GET /items with `reply` and records each request's query string. */
function mockItems(reply: (query: URLSearchParams) => Response) {
  const queries: Record<string, string>[] = [];
  server.use(
    http.get('*/items', ({ request }) => {
      const query = new URL(request.url).searchParams;
      queries.push(Object.fromEntries(query));
      return reply(query);
    }),
  );
  return queries;
}

function renderPage() {
  return renderWithProviders(<ItemListPage />, { route: '/items/list', path: '/items/list' });
}

describe('ItemListPage', () => {
  beforeEach(() => {
    server.use(http.get('*/units', () => HttpResponse.json(UNITS)));
  });

  it('lists every item at first, with its code, name, unit and price', async () => {
    const queries = mockItems(() => HttpResponse.json([beans, milk]));
    renderPage();

    const results = await screen.findByRole('region', { name: 'Search results' });
    const rows = await within(results).findAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'ESP-1KG',
      'Espresso Beans 1kg',
      'Medium roast.',
      'Kilogram (kg)',
      '25.50',
    ]);
    expect(within(rows[2]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'MILK',
      'Milk',
      '—',
      'Litre (l)',
      '0.99',
    ]);
    expect(within(results).getByText('2 items')).toBeInTheDocument();
    expect(queries[0]).toEqual({});
  });

  it('sends the filled-in filters to the server and shows what matched', async () => {
    const queries = mockItems((query) => HttpResponse.json(query.size === 0 ? [beans, milk] : [beans]));
    const { user } = renderPage();
    await screen.findByText('2 items');

    await user.type(screen.getByLabelText('Item code'), 'esp');
    await user.type(screen.getByLabelText('Item name'), ' beans ');
    await user.selectOptions(screen.getByLabelText('Unit'), 'Kilogram (kg)');
    await user.type(screen.getByLabelText('Price from'), '10');
    await user.type(screen.getByLabelText('Price to'), '30.5');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('1 item matches your search')).toBeInTheDocument();
    expect(queries.at(-1)).toEqual({ itemCode: 'ESP', itemName: 'beans', unitId: '2', minPrice: '1000', maxPrice: '3050' });
  });

  it('leaves empty filters out of the request', async () => {
    const queries = mockItems(() => HttpResponse.json([beans]));
    const { user } = renderPage();
    await screen.findByText('1 item');

    await user.type(screen.getByLabelText('Item name'), 'beans');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await screen.findByText('1 item matches your search');
    expect(queries.at(-1)).toEqual({ itemName: 'beans' });
  });

  it('checks the price range before searching', async () => {
    const queries = mockItems(() => HttpResponse.json([beans]));
    const { user } = renderPage();
    await screen.findByText('1 item');

    await user.type(screen.getByLabelText('Price from'), '50');
    await user.type(screen.getByLabelText('Price to'), '10');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(screen.getByLabelText('Price to')).toHaveAccessibleDescription('Make this at least the lowest price');
    expect(queries).toHaveLength(1);
  });

  it('says when nothing matches, and Reset lists everything again', async () => {
    const queries = mockItems((query) => HttpResponse.json(query.size === 0 ? [beans, milk] : []));
    const { user } = renderPage();
    await screen.findByText('2 items');

    await user.type(screen.getByLabelText('Item code'), 'nothing');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('No items match these filters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset filters' }));

    expect(await screen.findByText('2 items')).toBeInTheDocument();
    expect(screen.getByLabelText('Item code')).toHaveValue('');
    expect(queries.at(-1)).toEqual({});
  });

  it('points to the create tab when there are no items at all', async () => {
    mockItems(() => HttpResponse.json([]));
    renderPage();

    expect(await screen.findByText('No items yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create item' })).toHaveAttribute('href', '/inventory/items');
  });

  it('shows the error in a red toast and loads again on retry', async () => {
    let calls = 0;
    mockItems(() => {
      calls += 1;
      return calls === 1 ? HttpResponse.error() : HttpResponse.json([beans]);
    });
    const { user } = renderPage();

    expect(await screen.findByText("Couldn't load the items")).toBeInTheDocument();
    expect(screen.getAllByRole('alert').some((alert) => alert.classList.contains('bg-destructive'))).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Espresso Beans 1kg')).toBeInTheDocument();
  });
});
