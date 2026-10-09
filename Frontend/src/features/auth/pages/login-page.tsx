import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { env } from '@/config/env';
import { getErrorMessage } from '@/lib/api/errors';

import { useAuth } from '../auth-context';
import { sanitizeReturnTo } from '../return-to';

export function LoginPage() {
  const { status, login } = useAuth();
  const [searchParams] = useSearchParams();
  const returnTo = sanitizeReturnTo(searchParams.get('returnTo'));
  const [error, setError] = useState<unknown>(null);
  const [isPending, setIsPending] = useState(false);

  if (status === 'authenticated') {
    return <Navigate replace to={returnTo} />;
  }

  async function handleSignIn() {
    setError(null);
    setIsPending(true);
    try {
      await login(returnTo);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="grid gap-6 p-6 sm:p-8">
          <div className="grid gap-2 text-center">
            <img src="/favicon.svg" alt="" className="mx-auto size-10" />
            <h1 className="text-xl font-semibold">Finovex</h1>
            <p className="text-sm text-muted-foreground">Sign in to manage your sales, stock and receipts.</p>
          </div>

          <Button onClick={handleSignIn} disabled={isPending || status === 'loading'} className="w-full">
            <LogIn aria-hidden />
            {isPending ? 'Signing in…' : 'Sign in'}
          </Button>

          {error !== null && (
            <p role="alert" className="text-center text-sm text-destructive">
              {getErrorMessage(error)}
            </p>
          )}

          {env.authMode === 'mock' && (
            <p className="text-center text-xs text-muted-foreground">
              Development mode: you will be signed in as a demo user.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
