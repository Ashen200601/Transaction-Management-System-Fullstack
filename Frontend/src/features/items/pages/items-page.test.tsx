import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router';

import { renderWithProviders, screen } from '@/test/test-utils';

import { ItemsPage } from './items-page';

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/items" element={<ItemsPage />}>
        <Route index element={<p>Create tab</p>} />
        <Route path="list" element={<p>List tab</p>} />
      </Route>
    </Routes>,
    { route },
  );
}

describe('ItemsPage', () => {
  it('opens on the Create item tab', () => {
    renderAt('/items');

    expect(screen.getByRole('link', { name: 'Create item' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Item list' })).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Create tab')).toBeInTheDocument();
  });

  it('switches to the Item list tab', async () => {
    const { user } = renderAt('/items');

    await user.click(screen.getByRole('link', { name: 'Item list' }));

    expect(screen.getByText('List tab')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Item list' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Create item' })).not.toHaveAttribute('aria-current');
  });
});
