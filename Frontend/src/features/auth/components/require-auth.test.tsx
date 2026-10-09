import { describe, expect, it } from 'vitest';

import { currentLocation, renderWithProviders, screen } from '@/test/test-utils';

import { RequireAuth } from './require-auth';

const protectedPage = (
  <RequireAuth>
    <h1>Transactions</h1>
  </RequireAuth>
);

const options = {
  path: '/transactions',
  routes: { '/login': <h1>Sign in</h1> },
};

describe('RequireAuth', () => {
  it('renders the page for signed-in users', () => {
    renderWithProviders(protectedPage, { ...options, route: '/transactions' });
    expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
  });

  it('shows a loading state while the session is being restored', () => {
    renderWithProviders(protectedPage, {
      ...options,
      route: '/transactions',
      auth: { status: 'loading', user: null },
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(currentLocation().pathname).toBe('/transactions');
  });

  it('sends guests to sign in and remembers where they were going', async () => {
    renderWithProviders(protectedPage, {
      ...options,
      route: '/transactions?page=2',
      auth: { status: 'unauthenticated', user: null },
    });

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    const location = currentLocation();
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('returnTo')).toBe('/transactions?page=2');
  });
});
