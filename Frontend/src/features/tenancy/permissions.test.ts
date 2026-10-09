import { describe, expect, it } from 'vitest';

import { ROLES, getPermissions, hasPermission } from './permissions';
import type { Permission, Role } from './types';

const ALL: Role[] = ['owner', 'admin', 'cashier', 'viewer'];

// Who may do what. Change this table and the implementation together.
const ACCESS: Record<Permission, Role[]> = {
  'dashboard:view': ALL,
  'transactions:view': ALL,
  'transactions:create': ['owner', 'admin', 'cashier'],
  'transactions:void': ['owner', 'admin'],
  'customers:view': ALL,
  'customers:manage': ['owner', 'admin', 'cashier'],
  'products:view': ALL,
  'products:manage': ['owner', 'admin'],
  'inventory:view': ALL,
  'inventory:adjust': ['owner', 'admin'],
  'documents:review': ['owner', 'admin'],
  'integrations:manage': ['owner'],
  'business:manage': ['owner'],
};

const PERMISSIONS = Object.keys(ACCESS) as Permission[];

const cases = PERMISSIONS.flatMap((permission) =>
  ALL.map((role) => [role, permission, ACCESS[permission].includes(role)] as const),
);

describe('permissions', () => {
  it('defines the roles from most to least privileged', () => {
    expect(ROLES).toEqual(ALL);
  });

  it.each(cases)('%s may %s: %s', (role, permission, allowed) => {
    expect(hasPermission(role, permission)).toBe(allowed);
  });

  it('denies everything when there is no role', () => {
    for (const permission of PERMISSIONS) {
      expect(hasPermission(null, permission)).toBe(false);
    }
  });

  it.each(ALL)('lists every permission a %s has', (role) => {
    const expected = PERMISSIONS.filter((permission) => ACCESS[permission].includes(role));
    expect([...getPermissions(role)].sort()).toEqual([...expected].sort());
  });
});
