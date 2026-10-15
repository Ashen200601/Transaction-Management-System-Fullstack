import { Boxes, House, Package, Plug, ReceiptText, ScanLine, Users, type LucideIcon } from 'lucide-react';

export interface AppModule {
  label: string;
  path: string;
  icon: LucideIcon;
  /** False until the module's page is built; it shows a "coming soon" page meanwhile. */
  ready: boolean;
}

/** The main modules, in sidebar order. */
export const APP_MODULES: readonly AppModule[] = [
  { label: 'Home', path: '/', icon: House, ready: true },
  { label: 'Transactions', path: '/transactions', icon: ReceiptText, ready: false },
  { label: 'Customers', path: '/customers', icon: Users, ready: false },
  { label: 'Products', path: '/products', icon: Package, ready: false },
  { label: 'Inventory', path: '/inventory', icon: Boxes, ready: false },
  { label: 'Documents', path: '/documents', icon: ScanLine, ready: false },
  { label: 'Integrations', path: '/integrations', icon: Plug, ready: false },
];
