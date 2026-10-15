import { List, PlusCircle } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Create item', path: '/items', icon: PlusCircle },
  { label: 'Item list', path: '/items/list', icon: List },
];

/** The Items module: a heading, the tabs, and the open tab below them. */
export function ItemsPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Items</h1>
        <p className="text-sm text-muted-foreground">Add and look up the items your business sells.</p>
      </div>

      <nav aria-label="Items" className="flex gap-1 border-b border-border">
        {TABS.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end
            className={({ isActive }) =>
              cn(
                '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
              )
            }
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
