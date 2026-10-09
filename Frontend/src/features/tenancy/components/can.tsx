import type { ReactNode } from 'react';

import { useCan } from '../tenant-context';
import type { Permission } from '../types';

interface CanProps {
  permission: Permission;
  children: ReactNode;
  /** Shown instead of the children when the permission is missing. */
  fallback?: ReactNode;
}

/** Shows its children only when the active role has `permission`. */
export function Can({ permission, children, fallback = null }: CanProps) {
  return <>{useCan(permission) ? children : fallback}</>;
}
