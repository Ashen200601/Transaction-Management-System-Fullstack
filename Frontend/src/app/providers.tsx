import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { AuthProvider } from '@/features/auth/providers/auth-provider';
import { activeBusinessStore } from '@/features/tenancy/active-business-store';
import { configureApiClient } from '@/lib/api';

import { createQueryClient } from './query-client';

/**
 * Points the shared API client at the current session. Assigned during render
 * (idempotently) so it is in place before any child component's first request.
 */
function ApiClientBridge({ children }: { children: ReactNode }) {
  const { getAccessToken, logout } = useAuth();
  const queryClient = useQueryClient();

  configureApiClient({
    getAccessToken,
    getBusinessId: () => activeBusinessStore.get(),
    onUnauthorized: () => {
      queryClient.clear();
      void logout();
    },
  });

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApiClientBridge>{children}</ApiClientBridge>
      </AuthProvider>
    </QueryClientProvider>
  );
}
