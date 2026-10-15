import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { COMPANY } from '@/config/company';
import { useAuth } from '@/features/auth/auth-context';

/** Where users land after signing in, until the first feature is built. */
export function HomePage() {
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4 text-center">
      <p className="text-sm font-medium text-primary">{COMPANY.name}</p>
      <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
      <p className="text-sm text-muted-foreground">You&apos;re signed in as {user?.username}.</p>
      <Button variant="outline" className="mt-2" onClick={handleSignOut} disabled={signingOut}>
        {signingOut ? 'Signing out…' : 'Sign out'}
      </Button>
    </main>
  );
}
