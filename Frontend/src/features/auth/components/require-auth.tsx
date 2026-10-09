import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { LoadingState } from '@/components/common/states';

import { useAuth } from '../auth-context';

/** Renders its children for signed-in users and sends guests to sign in. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingState label="Restoring your session…" />;
  }

  if (status === 'unauthenticated') {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={`/login?${new URLSearchParams({ returnTo })}`} />;
  }

  return <>{children}</>;
}
