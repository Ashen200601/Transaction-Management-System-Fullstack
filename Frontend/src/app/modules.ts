import {
  Boxes,
  House,
  PackageCheck,
  Package,
  Plug,
  ReceiptText,
  ScanLine,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** A page under a main module, listed below it in the sidebar. */
export interface SubModule {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface AppModule {
  label: string;
  /** For a module with submodules, the path they all start with. */
  path: string;
  icon: LucideIcon;
  /** False until the module's page is built; it shows a "coming soon" page meanwhile. */
  ready: boolean;
  /** The module's pages, in sidebar order. The module itself opens the first one. */
  submodules?: readonly SubModule[];
}

/** The main modules, in sidebar order. */
export const APP_MODULES: readonly AppModule[] = [
  { label: 'Home', path: '/', icon: House, ready: true },



  { label: 'Transactions', path: '/transactions', icon: ReceiptText, ready: false },
    {
    label: 'People and Profiles',
    path: '/people-and-profiles',
    icon: Boxes,
    ready: true,
    submodules: [
     { label: 'Stakeholders', path: '/people-and-profiles/stakeholders', icon: Users }
    ],
  },








  {
    label: 'Purchases',
    path: '/purchases',
    icon: Boxes,
    ready: true,
    submodules: [
     
    ],
  },



  {
    label: 'Inventory',
    path: '/inventory',
    icon: Boxes,
    ready: true,
    submodules: [
      { label: 'Items', path: '/inventory/items', icon: Package },
      { label: 'GRN', path: '/inventory/grn', icon: PackageCheck },
      { label: 'GDN', path: '/inventory/gdn', icon: Truck },
    ],
  },





  { label: 'Documents', path: '/documents', icon: ScanLine, ready: false },
  { label: 'Integrations', path: '/integrations', icon: Plug, ready: false },
];
