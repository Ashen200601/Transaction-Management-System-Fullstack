import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router';

import { renderWithProviders, screen } from '@/test/test-utils';

import { GdnCreatePage } from './gdn-create-page';
import { GdnListPage } from './gdn-list-page';
import { GdnPage } from './gdn-page';

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/inventory/gdn" element={<GdnPage />}>
        <Route index element={<GdnCreatePage />} />
        <Route path="list" element={<GdnListPage />} />
      </Route>
    </Routes>,
    { route },
  );
}

describe('GdnPage', () => {
  it('opens on the Create GDN tab and switches to the list', async () => {
    const { user } = renderAt('/inventory/gdn');

    expect(screen.getByRole('heading', { name: 'Goods Dispatch Notes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create GDN' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Creating GDNs is coming soon')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'GDN list' }));

    expect(screen.getByText('The GDN list is coming soon')).toBeInTheDocument();
  });
});
