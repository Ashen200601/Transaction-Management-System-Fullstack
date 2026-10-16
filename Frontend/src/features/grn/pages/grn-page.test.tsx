import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router';

import { renderWithProviders, screen } from '@/test/test-utils';

import { GrnCreatePage } from './grn-create-page';
import { GrnListPage } from './grn-list-page';
import { GrnPage } from './grn-page';

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/inventory/grn" element={<GrnPage />}>
        <Route index element={<GrnCreatePage />} />
        <Route path="list" element={<GrnListPage />} />
      </Route>
    </Routes>,
    { route },
  );
}

describe('GrnPage', () => {
  it('opens on the Create GRN tab and switches to the list', async () => {
    const { user } = renderAt('/inventory/grn');

    expect(screen.getByRole('heading', { name: 'Goods Received Notes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create GRN' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Creating GRNs is coming soon')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'GRN list' }));

    expect(screen.getByText('The GRN list is coming soon')).toBeInTheDocument();
  });
});
