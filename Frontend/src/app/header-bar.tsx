import { Building2, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Business } from '@/features/business/types';
import { getCurrentBusiness } from '@/lib/api';

import { AccountMenu } from './account-menu';

const today = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * The bar across the top of every signed-in page: the business on the left, the signed-in
 * user on the right. Add new app-wide actions (notifications, search, …) to the slot before the
 * account menu.
 */
export function HeaderBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    let cancelled = false;
    // The business name is a nice-to-have here, so a failure just leaves it out.
    getCurrentBusiness()
      .then((result) => !cancelled && setBusiness(result))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* Phones and tablets: the sidebar is behind this button. */}
      <Button variant="ghost" size="icon" aria-label="Open menu" className="lg:hidden" onClick={onOpenMenu}>
        <Menu aria-hidden />
      </Button>

      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground sm:flex">
          <Building2 aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          {/* min-h keeps the bar from jumping while the name loads. */}
          <p className="min-h-6 truncate font-semibold">{business?.name}</p>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{today()}</p>
        </div>
      </div>

      {/* Slot for future app-wide actions, e.g. notifications or a global search. */}
      <div className="ml-auto flex items-center gap-2" />

      <AccountMenu />
    </header>
  );
}
