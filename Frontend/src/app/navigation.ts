import {
  Boxes,
  LayoutDashboard,
  Package,
  Plug,
  ReceiptText,
  ScanLine,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { hasPermission } from '@/features/tenancy/permissions';
import type { Permission, Role } from '@/features/tenancy/types';

export interface NavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Hidden from roles without this permission. */
  permission: Permission;
}

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, permission: 'dashboard:view' },
  { label: 'Transactions', to: '/transactions', icon: ReceiptText, permission: 'transactions:view' },
  { label: 'Customers', to: '/customers', icon: Users, permission: 'customers:view' },
  { label: 'Products', to: '/products', icon: Package, permission: 'products:view' },
  { label: 'Inventory', to: '/inventory', icon: Boxes, permission: 'inventory:view' },
  { label: 'Documents', to: '/documents', icon: ScanLine, permission: 'documents:review' },
  { label: 'Integrations', to: '/integrations', icon: Plug, permission: 'integrations:manage' },
];

export function getNavigationItems(role: Role | null) {
  return NAVIGATION_ITEMS.filter((item) => hasPermission(role, item.permission));
}
