import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';

import type { Integration } from './types';

export type IntegrationAction = 'connect' | 'disconnect' | 'sync';

export function listIntegrations() {
  return apiClient.get<Integration[]>('/integrations');
}

export function runIntegrationAction(id: string, action: IntegrationAction) {
  return apiClient.post<Integration>(`/integrations/${encodeURIComponent(id)}/${action}`);
}

export const integrationKeys = {
  all: ['integrations'] as const,
};

export function useIntegrations() {
  return useQuery({ queryKey: integrationKeys.all, queryFn: listIntegrations });
}

export function useIntegrationAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: IntegrationAction }) => runIntegrationAction(id, action),
    onSuccess: (updated) => {
      queryClient.setQueryData<Integration[]>(integrationKeys.all, (current) =>
        current?.map((integration) => (integration.id === updated.id ? updated : integration)),
      );
    },
  });
}
