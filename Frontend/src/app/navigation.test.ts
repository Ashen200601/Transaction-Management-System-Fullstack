import { describe, expect, it } from 'vitest';

import type { Role } from '@/features/tenancy/types';

import { NAVIGATION_ITEMS, getNavigationItems } from './navigation';

const labelsFor = (role: Role | null) => getNavigationItems(role).map((item) => item.label);

describe('navigation', () => {
  it('lists the sections in sidebar order', () => {
    expect(NAVIGATION_ITEMS.map(({ label, to }) => ({ label, to }))).toEqual([
      { label: 'Dashboard', to: '/' },
      { label: 'Transactions', to: '/transactions' },
      { label: 'Customers', to: '/customers' },
      { label: 'Products', to: '/products' },
      { label: 'Inventory', to: '/inventory' },
      { label: 'Documents', to: '/documents' },
      { label: 'Integrations', to: '/integrations' },
    ]);
  });

  it.each<[Role, string[]]>([
    ['owner', ['Dashboard', 'Transactions', 'Customers', 'Products', 'Inventory', 'Documents', 'Integrations']],
    ['admin', ['Dashboard', 'Transactions', 'Customers', 'Products', 'Inventory', 'Documents']],
    ['cashier', ['Dashboard', 'Transactions', 'Customers', 'Products', 'Inventory']],
    ['viewer', ['Dashboard', 'Transactions', 'Customers', 'Products', 'Inventory']],
  ])('shows a %s only the sections they can open', (role, expected) => {
    expect(labelsFor(role)).toEqual(expected);
  });

  it('shows nothing when there is no role', () => {
    expect(labelsFor(null)).toEqual([]);
  });
});
