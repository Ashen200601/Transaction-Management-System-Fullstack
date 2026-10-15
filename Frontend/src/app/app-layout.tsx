import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';

import { Button } from '@/components/ui/button';
import { COMPANY } from '@/config/company';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/utils';

import { APP_MODULES } from './modules';

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
  }

  return (
    <div className="flex h-full flex-col gap-6 bg-card p-4">
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
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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

      <div className="grid gap-3 border-t border-border pt-4">
        <div className="px-2">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="ghost" className="justify-start" onClick={handleSignOut} disabled={signingOut}>
          <LogOut aria-hidden />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </div>
  );
}

/** Signed-in pages: the module sidebar on the left, the page on the right. */
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop: always visible. */}
      <aside className="sticky top-0 hidden h-dvh border-r border-border lg:block">
        <Sidebar />
      </aside>

      {/* Phones and tablets: a top bar with a menu button that slides the sidebar in. */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
        <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu aria-hidden />
        </Button>
        <img src="/favicon.svg" alt="" className="size-7" />
        <p className="font-semibold tracking-tight">{COMPANY.name}</p>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div aria-hidden className="absolute inset-0 bg-foreground/30" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85vw] shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              className="absolute top-4 right-3"
              onClick={() => setMenuOpen(false)}
            >
              <X aria-hidden />
            </Button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
