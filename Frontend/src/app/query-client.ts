import { QueryClient } from '@tanstack/react-query';

import { isApiError } from '@/lib/api/errors';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        // Retry network and server errors, never client errors (4xx): they won't fix themselves.
        retry: (failureCount, error) =>
          failureCount < 2 && !(isApiError(error) && error.status >= 400 && error.status < 500),
      },
      mutations: {
        // Writes are not retried automatically; the user decides.
        retry: false,
      },
    },
  });
}
