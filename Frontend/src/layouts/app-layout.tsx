import { LogOut, Menu, X } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';

import { getNavigationItems } from '@/app/navigation';
import { LoadingState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { BusinessSwitcher } from '@/features/tenancy/components/business-switcher';
import { useTenant } from '@/features/tenancy/tenant-context';
import { cn } from '@/lib/utils';

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <img src="/favicon.svg" alt="" className="size-7" />
      <span className="text-lg font-semibold tracking-tight">Finovex</span>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { activeBusiness } = useTenant();
  return (
    <nav aria-label="Main" className="grid gap-1">
      {getNavigationItems(activeBusiness?.role ?? null).map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <Icon aria-hidden className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setIsMenuOpen(false), [location.pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="hidden border-r border-border bg-card lg:flex lg:flex-col lg:gap-6 lg:px-3 lg:py-5">
        <Brand />
        <SidebarNav />
      </aside>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setIsMenuOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col gap-6 border-r border-border bg-card px-3 py-5">
            <div className="flex items-center justify-between">
              <Brand />
              <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setIsMenuOpen(false)}>
                <X aria-hidden />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setIsMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setIsMenuOpen(true)}>
            <Menu aria-hidden />
          </Button>
          <div className="min-w-0 flex-1">
            <BusinessSwitcher />
          </div>
          <span className="hidden truncate text-sm text-muted-foreground sm:block">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            <LogOut aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </header>

        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
