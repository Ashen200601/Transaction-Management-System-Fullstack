import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/test/server';
import { renderWithProviders, screen } from '@/test/test-utils';

import { HeaderBar } from './header-bar';

function renderHeader() {
  return renderWithProviders(<HeaderBar onOpenMenu={vi.fn()} />);
}

describe('HeaderBar', () => {
  it("shows the business name from the server and today's date", async () => {
    server.use(
      http.get('*/businesses/current', () => HttpResponse.json({ id: '9', name: 'Perera Stores', currency: 'LKR' })),
    );
    renderHeader();

    expect(await screen.findByText('Perera Stores')).toBeInTheDocument();
    expect(screen.getByText(String(new Date().getFullYear()), { exact: false })).toBeInTheDocument();
  });

  it('still shows the account when the business cannot be loaded', async () => {
    let asked = false;
    server.use(
      http.get('*/businesses/current', () => {
        asked = true;
        return HttpResponse.error();
      }),
    );
    renderHeader();

    await vi.waitFor(() => expect(asked).toBe(true));
    expect(screen.getByRole('button', { name: 'Account: Test Cashier' })).toBeInTheDocument();
  });

  it("opens the account menu with the user's details and signs out from it", async () => {
    server.use(http.get('*/businesses/current', () => HttpResponse.json({ id: '9', name: 'Perera Stores', currency: 'LKR' })));
    const { user, auth } = renderHeader();
    const account = screen.getByRole('button', { name: 'Account: Test Cashier' });

    expect(account).toHaveTextContent('TC');
    expect(account).toHaveAttribute('aria-expanded', 'false');
    await user.click(account);

    expect(account).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('cashier@example.com')).toBeInTheDocument();
    expect(screen.getByText('@test.cashier')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(auth.logout).toHaveBeenCalledOnce();
  });

  it('closes the account menu on Escape and on a click elsewhere', async () => {
    server.use(http.get('*/businesses/current', () => HttpResponse.json({ id: '9', name: 'Perera Stores', currency: 'LKR' })));
    const { user } = renderHeader();
    const account = screen.getByRole('button', { name: 'Account: Test Cashier' });

    await user.click(account);
    await user.keyboard('{Escape}');
    expect(screen.queryByText('cashier@example.com')).not.toBeInTheDocument();
    expect(account).toHaveFocus();

    await user.click(account);
    await user.click(await screen.findByText('Perera Stores'));
    expect(screen.queryByText('cashier@example.com')).not.toBeInTheDocument();
  });
});
