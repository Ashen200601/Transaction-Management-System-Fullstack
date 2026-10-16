import { ChevronDown, LogOut } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/utils';

/** The signed-in user's picture and name; opens a menu with their details and Sign out. */
export function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close on a click outside, or on Escape (focus goes back to the button).
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Account: ${user.name}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-muted sm:pr-3"
      >
        <Avatar name={user.name} />
        <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{user.name}</span>
        <ChevronDown aria-hidden className={cn('hidden size-4 text-muted-foreground transition-transform sm:block', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute top-full right-0 z-40 mt-2 w-72 animate-toast-in rounded-xl border border-border bg-card p-2 shadow-lg motion-reduce:animate-none [--toast-from-x:0] [--toast-from-y:-0.5rem]"
        >
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={user.name} className="size-11 text-base" />
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
          >
            <LogOut aria-hidden className="size-4" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
