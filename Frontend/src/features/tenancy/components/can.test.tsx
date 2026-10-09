import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { buildBusiness } from '@/test/factories';
import { renderWithProviders, screen } from '@/test/test-utils';

import type { Role } from '../types';
import { Can } from './can';

function renderCan(role: Role | null, fallback?: ReactNode) {
  return renderWithProviders(
    <Can permission="transactions:void" fallback={fallback}>
      <button type="button">Void transaction</button>
    </Can>,
    { tenant: { activeBusiness: role ? buildBusiness({ role }) : null } },
  );
}

describe('Can', () => {
  it('renders its children when the active role has the permission', () => {
    renderCan('admin');
    expect(screen.getByRole('button', { name: 'Void transaction' })).toBeInTheDocument();
  });

  it('renders nothing when the role lacks the permission', () => {
    renderCan('cashier');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the fallback instead when one is given', () => {
    renderCan('viewer', <p>Ask an admin to void this sale.</p>);
    expect(screen.getByText('Ask an admin to void this sale.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when no business is selected', () => {
    renderCan(null);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
