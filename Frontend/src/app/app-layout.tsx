import { ChevronDown, X } from 'lucide-react';
import { useId, useState } from 'react';
import { matchPath, NavLink, Outlet, useLocation } from 'react-router';

import { Button } from '@/components/ui/button';
import { COMPANY } from '@/config/company';
import { cn } from '@/lib/utils';

import { HeaderBar } from './header-bar';
import { APP_MODULES, type AppModule } from './modules';

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-sidebar-foreground text-sidebar shadow-sm'
      : 'text-sidebar-foreground/75 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground',
  );

/**
 * A main module with submodules: a button that shows or hides them. It opens by itself whenever
 * the page is one of its submodules.
 */
function ModuleGroup({ module, onNavigate }: { module: AppModule; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const inside = matchPath({ path: module.path, end: false }, pathname) !== null;
  const [open, setOpen] = useState(inside);
  const [wasInside, setWasInside] = useState(inside);
  const listId = useId();
  const Icon = module.icon;

  // Navigating into the module opens it; leaving it keeps whatever the user chose.
  if (inside !== wasInside) {
    setWasInside(inside);
    if (inside) setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((previous) => !previous)}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-foreground/10',
          inside ? 'text-sidebar-foreground' : 'text-sidebar-foreground/75 hover:text-sidebar-foreground',
        )}
      >
        <Icon aria-hidden className="size-4" />
        {module.label}
        <ChevronDown aria-hidden className={cn('ml-auto size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul id={listId} className="mt-1 ml-5 grid gap-1 border-l border-sidebar-foreground/20 pl-2">
          {module.submodules?.map(({ label, path, icon: SubIcon }) => (
            <li key={path}>
              <NavLink to={path} onClick={onNavigate} className={linkClassName}>
                <SubIcon aria-hidden className="size-4" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    // Dark blue with white text. Focus outlines are white so they show on the dark background.
    <div className="flex h-full flex-col gap-6 overflow-y-auto bg-sidebar p-4 text-sidebar-foreground [&_:focus-visible]:outline-white">
      <div className="flex items-center gap-3 px-2 pt-2">
        <img src="/favicon.svg" alt="" className="size-9" />
        <p className="font-semibold tracking-tight">{COMPANY.name}</p>
      </div>

      <nav aria-label="Main" className="flex-1">
        <ul className="grid gap-1">
          {APP_MODULES.map((module) => (
            <li key={module.path}>
              {module.submodules ? (
                <ModuleGroup module={module} onNavigate={onNavigate} />
              ) : (
                <NavLink to={module.path} end={module.path === '/'} onClick={onNavigate} className={linkClassName}>
                  <module.icon aria-hidden className="size-4" />
                  {module.label}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** Signed-in pages: the module sidebar on the left; the header bar and the page on the right. */
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop: always visible. */}
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div aria-hidden className="absolute inset-0 bg-foreground/30" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85vw] shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              className="absolute top-4 right-3 text-sidebar-foreground hover:bg-sidebar-foreground/10"
              onClick={() => setMenuOpen(false)}
            >
              <X aria-hidden />
            </Button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <HeaderBar onOpenMenu={() => setMenuOpen(true)} />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
