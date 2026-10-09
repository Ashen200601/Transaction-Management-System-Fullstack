import { describe, expect, it } from 'vitest';

import { buildBusiness } from '@/test/factories';
import { currentLocation, renderWithProviders, screen } from '@/test/test-utils';

import type { Role } from '../types';
import { RequirePermission } from './require-permission';

const integrationsPage = (
  <RequirePermission permission="integrations:manage">
    <h1>Integrations</h1>
  </RequirePermission>
);

function renderAs(role: Role | null) {
  return renderWithProviders(integrationsPage, {
    route: '/integrations',
    path: '/integrations',
    routes: { '/select-business': <h1>Choose a business</h1> },
    tenant: { activeBusiness: role ? buildBusiness({ role }) : null },
  });
}

describe('RequirePermission', () => {
  it('renders the page when the role has the permission', () => {
    renderAs('owner');
    expect(screen.getByRole('heading', { name: 'Integrations' })).toBeInTheDocument();
  });

  it('shows an access-denied state when the role lacks the permission', () => {
    renderAs('admin');
    expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Integrations' })).not.toBeInTheDocument();
  });

  it('sends users without an active business to the business picker', async () => {
    renderAs(null);
    expect(await screen.findByRole('heading', { name: 'Choose a business' })).toBeInTheDocument();
    expect(currentLocation().pathname).toBe('/select-business');
  });
});
