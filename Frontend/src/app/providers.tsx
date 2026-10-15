import type { ReactNode } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { AuthProvider } from '@/features/auth/providers/auth-provider';
import { configureApiClient } from '@/lib/api';

/**
 * Points the shared API client at the current session. Assigned during render
 * (idempotently) so it is in place before any child component's first request.
 */
function ApiClientBridge({ children }: { children: ReactNode }) {
  const { getAccessToken, refreshAccessToken, logout } = useAuth();

  configureApiClient({
    getAccessToken,
    // A 401 is retried once with a renewed token before it counts as "signed out".
    refreshAccessToken,
    onUnauthorized: () => void logout(),
  });

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ApiClientBridge>{children}</ApiClientBridge>
    </AuthProvider>
  );
}
