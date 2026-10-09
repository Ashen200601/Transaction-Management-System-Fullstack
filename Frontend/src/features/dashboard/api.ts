import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';

import type { DashboardSummary } from './types';

export function getDashboardSummary() {
  return apiClient.get<DashboardSummary>('/dashboard/summary');
}

export function useDashboardSummary() {
  return useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getDashboardSummary, refetchInterval: 60_000 });
}
