import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { renderWithProviders, screen } from '@/test/test-utils';

import type { AuthContextValue } from '../auth-context';
import { LoginPage } from './login-page';

const guest = { status: 'unauthenticated', user: null } as const;

function renderPage(auth: Partial<AuthContextValue> = guest) {
  return renderWithProviders(<LoginPage />, { route: '/login', path: '/login', auth });
}

describe('LoginPage', () => {
  it('signs in with the username and password', async () => {
    const { user, auth } = renderPage();

    await user.type(screen.getByLabelText('Username'), '  Jane.Perera ');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(auth.login).toHaveBeenCalledWith({ username: 'jane.perera', password: 'secret123' });
  });

  it('asks for both fields before calling the API', async () => {
    const { user, auth } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByLabelText('Username')).toHaveAccessibleDescription('Enter your username');
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Enter your password');
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('says the credentials are wrong without saying which one, and clears the password', async () => {
    const { user } = renderPage({
      ...guest,
      login: vi.fn().mockRejectedValue(new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Unauthorized' })),
    });

    await user.type(screen.getByLabelText('Username'), 'jane.perera');
    await user.type(screen.getByLabelText('Password'), 'wrong-password1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect username or password.');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByLabelText('Username')).toHaveValue('jane.perera');
  });

  it('explains when the server cannot be reached', async () => {
    const { user } = renderPage({
      ...guest,
      login: vi.fn().mockRejectedValue(new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Failed to fetch' })),
    });

    await user.type(screen.getByLabelText('Username'), 'jane.perera');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to reach the server/i);
  });

  it('shows how to get a forgotten password reset', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));

    expect(screen.getByText(/ask your business owner or administrator/i)).toBeInTheDocument();
  });

  it('sends users who are already signed in to the page they asked for', async () => {
    renderWithProviders(<LoginPage />, {
      route: '/login?returnTo=%2Fproducts',
      path: '/login',
      routes: { '/products': <h1>Products</h1> },
    });

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument();
  });

  it('never sends the user to another site after sign-in', async () => {
    renderWithProviders(<LoginPage />, {
      route: '/login?returnTo=https%3A%2F%2Fevil.example',
      path: '/login',
      routes: { '/': <h1>Dashboard</h1> },
    });

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });
});
