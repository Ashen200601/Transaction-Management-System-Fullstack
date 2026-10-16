import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { STAKEHOLDER_TYPES } from '@/test/factories';
import { server } from '@/test/server';
import { renderWithProviders, screen, within } from '@/test/test-utils';

import { StakeholderListPage } from './stakeholder-list-page';

const abc = {
  id: '51',
  stakeholderCode: 'ABC',
  stakeholderName: 'ABC Traders',
  phone: '+94 77 123 4567',
  email: 'accounts@abc.com',
  address: null,
  taxNo: 'VAT-1',
  stakeholderTypes: STAKEHOLDER_TYPES,
};
const nimal = {
  ...abc,
  id: '52',
  stakeholderCode: 'NIMAL',
  stakeholderName: 'Nimal Perera',
  phone: null,
  email: null,
  taxNo: null,
  stakeholderTypes: [STAKEHOLDER_TYPES[0]],
};

/** Answers GET /stakeholders with `reply` and records each request's query string. */
function mockStakeholders(reply: (query: URLSearchParams) => Response) {
  const queries: Record<string, string>[] = [];
  server.use(
    http.get('*/stakeholders', ({ request }) => {
      const query = new URL(request.url).searchParams;
      queries.push(Object.fromEntries(query));
      return reply(query);
    }),
  );
  return queries;
}

function renderPage() {
  return renderWithProviders(<StakeholderListPage />, {
    route: '/people-and-profiles/stakeholders/list',
    path: '/people-and-profiles/stakeholders/list',
  });
}

describe('StakeholderListPage', () => {
  beforeEach(() => {
    server.use(http.get('*/stakeholder-types', () => HttpResponse.json(STAKEHOLDER_TYPES)));
  });

  it('lists every stakeholder at first, with their types', async () => {
    const queries = mockStakeholders(() => HttpResponse.json([abc, nimal]));
    renderPage();

    const results = await screen.findByRole('region', { name: 'Search results' });
    const rows = await within(results).findAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'ABC',
      'ABC Traders',
      'CustomerVendor',
      '+94 77 123 4567',
      'accounts@abc.com',
      'VAT-1',
    ]);
    expect(within(rows[2]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'NIMAL',
      'Nimal Perera',
      'Customer',
      '—',
      '—',
      '—',
    ]);
    expect(within(results).getByText('2 stakeholders')).toBeInTheDocument();
    expect(queries[0]).toEqual({});
  });

  it('sends the filled-in filters to the server and shows what matched', async () => {
    const queries = mockStakeholders((query) => HttpResponse.json(query.size === 0 ? [abc, nimal] : [abc]));
    const { user } = renderPage();
    await screen.findByText('2 stakeholders');

    await user.type(screen.getByLabelText('Stakeholder code'), 'ab');
    await screen.findByRole('option', { name: 'Vendor' });
    await user.selectOptions(screen.getByLabelText('Stakeholder type'), 'Vendor');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('1 stakeholder matches your search')).toBeInTheDocument();
    expect(queries.at(-1)).toEqual({ stakeholderCode: 'AB', stakeholderTypeId: '2' });
  });

  it('points to the create tab when there are no stakeholders at all', async () => {
    mockStakeholders(() => HttpResponse.json([]));
    renderPage();

    expect(await screen.findByText('No stakeholders yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create stakeholder' })).toHaveAttribute(
      'href',
      '/people-and-profiles/stakeholders',
    );
  });
});
