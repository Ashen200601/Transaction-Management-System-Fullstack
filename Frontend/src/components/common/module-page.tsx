import type { LucideIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { cn } from '@/lib/utils';

export interface ModuleTab {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface ModulePageProps {
  title: string;
  description: string;
  /** The first tab is the module's index route. */
  tabs: readonly ModuleTab[];
}

/** A (sub)module's frame: a heading, its tabs, and the open tab below them. */
export function ModulePage({ title, description, tabs }: ModulePageProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <nav aria-label={title} className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end
            className={({ isActive }) =>
              cn(
                '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
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
