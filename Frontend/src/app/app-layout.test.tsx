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

  it('lists every main module in the sidebar, with the current page marked', () => {
    renderWithProviders(<AppLayout />, { route: '/inventory/items' });

    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0];
    const entries = within(nav)
      .getAllByRole('listitem')
      .filter((item) => item.parentElement?.parentElement === nav)
      .map((item) => item.querySelector('a, button')?.textContent);
    expect(entries).toEqual(APP_MODULES.map((module) => module.label));
    expect(within(nav).getByRole('link', { name: 'Items' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('opens Inventory on its submodules when the page is one of them', () => {
    renderWithProviders(<AppLayout />, { route: '/inventory/grn' });

    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0];
    expect(within(nav).getByRole('button', { name: 'Inventory' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(nav).getByRole('link', { name: 'Items' })).toHaveAttribute('href', '/inventory/items');
    expect(within(nav).getByRole('link', { name: 'GRN' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'GDN' })).toHaveAttribute('href', '/inventory/gdn');
  });

  it('keeps Inventory closed elsewhere until it is clicked', async () => {
    const { user } = renderWithProviders(<AppLayout />, { route: '/' });

    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0];
    const inventory = within(nav).getByRole('button', { name: 'Inventory' });
    expect(inventory).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryByRole('link', { name: 'GRN' })).not.toBeInTheDocument();

    await user.click(inventory);

    expect(inventory).toHaveAttribute('aria-expanded', 'true');
    expect(within(nav).getByRole('link', { name: 'GRN' })).toBeInTheDocument();
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

    await user.click(within(navs[1]).getByRole('link', { name: 'Transactions' }));
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1);
  });
});
