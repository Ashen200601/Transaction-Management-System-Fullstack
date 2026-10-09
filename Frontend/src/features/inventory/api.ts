import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, type Paginated } from '@/lib/api';

import type { InventoryItem, StockStatus } from './types';

export type InventoryListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: StockStatus | '';
};

export interface StockAdjustment {
  /** Positive to add stock, negative to remove it. */
  change: number;
  reason: string;
}

export function listInventory(params: InventoryListParams = {}) {
  return apiClient.get<Paginated<InventoryItem>>('/inventory', { params });
}

export function adjustStock(productId: string, adjustment: StockAdjustment) {
  return apiClient.post<InventoryItem>(`/inventory/${encodeURIComponent(productId)}/adjustments`, adjustment);
}

export const inventoryKeys = {
  all: ['inventory'] as const,
  list: (params: InventoryListParams) => ['inventory', 'list', params] as const,
};

export function useInventory(params: InventoryListParams) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: () => listInventory(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdjustStock(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adjustment: StockAdjustment) => adjustStock(productId, adjustment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
