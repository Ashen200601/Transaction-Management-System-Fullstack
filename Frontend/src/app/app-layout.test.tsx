import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { server } from '@/test/server';
import { renderWithProviders, screen, within } from '@/test/test-utils';

import { AppLayout } from './app-layout';
import { APP_MODULES } from './modules';

describe('AppLayout', () => {
  beforeEach(() => {
    server.use(
      http.get('*/businesses/current', () => HttpResponse.json({ id: '9', name: 'Perera Stores', currency: 'LKR' })),
    );
  });

  it('lists every main module in the sidebar, with the current one marked', () => {
    renderWithProviders(<AppLayout />, { route: '/items' });

    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0];
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(APP_MODULES.map((module) => module.label));
    expect(within(nav).getByRole('link', { name: 'Items' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('puts the header bar above the page, with the business and the signed-in user', async () => {
    renderWithProviders(<AppLayout />);

    const header = screen.getByRole('banner');
    expect(await within(header).findByText('Perera Stores')).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'Account: Test Cashier' })).toBeInTheDocument();
  });

  it('opens the menu on small screens and closes it after choosing a module', async () => {
    const { user } = renderWithProviders(<AppLayout />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const navs = screen.getAllByRole('navigation', { name: 'Main' });
    expect(navs).toHaveLength(2);

    await user.click(within(navs[1]).getByRole('link', { name: 'Customers' }));
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1);
  });
});
