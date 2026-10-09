import { apiClient } from '@/lib/api';

import type { Business } from './types';

export const businessKeys = {
  all: ['businesses'] as const,
};

/** Businesses the signed-in user belongs to. */
export function listBusinesses() {
  return apiClient.get<Business[]>('/businesses');
}
