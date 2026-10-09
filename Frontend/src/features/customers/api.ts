import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient, type Paginated } from '@/lib/api';

import type { Customer } from './types';

export type CustomerListParams = {
  page?: number;
  pageSize?: number;
  /** Matches name, email or phone. */
  search?: string;
};

export function listCustomers(params: CustomerListParams = {}) {
  return apiClient.get<Paginated<Customer>>('/customers', { params });
}

export const customerKeys = {
  all: ['customers'] as const,
  list: (params: CustomerListParams) => ['customers', 'list', params] as const,
};

export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => listCustomers(params),
    placeholderData: keepPreviousData,
  });
}
