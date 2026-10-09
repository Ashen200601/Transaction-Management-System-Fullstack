import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '@/test/test-utils';

import { LoginPage } from './login-page';

const guest = { status: 'unauthenticated', user: null } as const;

describe('LoginPage', () => {
  it('starts sign-in and returns to the requested page afterwards', async () => {
    const { user, auth } = renderWithProviders(<LoginPage />, {
      route: '/login?returnTo=%2Ftransactions%3Fpage%3D2',
      path: '/login',
      auth: guest,
    });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(auth.login).toHaveBeenCalledWith('/transactions?page=2');
  });

  it('never sends the user to another site after sign-in', async () => {
    const { user, auth } = renderWithProviders(<LoginPage />, {
      route: '/login?returnTo=https%3A%2F%2Fevil.example',
      path: '/login',
      auth: guest,
    });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(auth.login).toHaveBeenCalledWith('/');
  });

  it('sends users who are already signed in straight on', async () => {
    renderWithProviders(<LoginPage />, {
      route: '/login?returnTo=%2Fproducts',
      path: '/login',
      routes: { '/products': <h1>Products</h1> },
    });

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument();
  });

  it('shows an error when sign-in fails', async () => {
    const { user } = renderWithProviders(<LoginPage />, {
      route: '/login',
      path: '/login',
      auth: { ...guest, login: vi.fn().mockRejectedValue(new Error('Identity provider unavailable')) },
    });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Identity provider unavailable');
  });
});
