import { X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';

import { Button } from '@/components/ui/button';
import { COMPANY } from '@/config/company';
import { cn } from '@/lib/utils';

import { HeaderBar } from './header-bar';
import { APP_MODULES } from './modules';

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    // Dark blue with white text. Focus outlines are white so they show on the dark background.
    <div className="flex h-full flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground [&_:focus-visible]:outline-white">
      <div className="flex items-center gap-3 px-2 pt-2">
        <img src="/favicon.svg" alt="" className="size-9" />
        <p className="font-semibold tracking-tight">{COMPANY.name}</p>
      </div>

      <nav aria-label="Main" className="flex-1">
        <ul className="grid gap-1">
          {APP_MODULES.map(({ label, path, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                end={path === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-foreground text-sidebar shadow-sm'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground',
                  )
                }
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </NavLink>
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
