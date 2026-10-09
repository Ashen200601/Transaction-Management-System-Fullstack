import type { Permission, Role } from './types';

/** Most to least privileged. */
export const ROLES = ['owner', 'admin', 'cashier', 'viewer'] as const satisfies readonly Role[];

const VIEW: Permission[] = ['dashboard:view', 'transactions:view', 'customers:view', 'products:view', 'inventory:view'];

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  viewer: new Set(VIEW),
  cashier: new Set([...VIEW, 'transactions:create', 'customers:manage']),
  admin: new Set([
    ...VIEW,
    'transactions:create',
    'transactions:void',
    'customers:manage',
    'products:manage',
    'inventory:adjust',
    'documents:review',
  ]),
  owner: new Set([
    ...VIEW,
    'transactions:create',
    'transactions:void',
    'customers:manage',
    'products:manage',
    'inventory:adjust',
    'documents:review',
    'integrations:manage',
    'business:manage',
  ]),
};

// The UI hides what a role can't do; the API must still enforce the same rules.
export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  return role ? ROLE_PERMISSIONS[role].has(permission) : false;
}

export function getPermissions(role: Role): readonly Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}
