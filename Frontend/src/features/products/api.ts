import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, type Paginated } from '@/lib/api';

import type { ProductFormValues } from './schemas';
import type { Product } from './types';

export type ProductListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  /** Only products that can be sold. */
  activeOnly?: boolean;
};

export function listProducts(params: ProductListParams = {}) {
  return apiClient.get<Paginated<Product>>('/products', { params });
}

export function createProduct(values: ProductFormValues) {
  return apiClient.post<Product>('/products', values);
}

export function updateProduct(id: string, values: ProductFormValues) {
  return apiClient.put<Product>(`/products/${encodeURIComponent(id)}`, values);
}

export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductListParams) => ['products', 'list', params] as const,
};

export function useProducts(params: ProductListParams, { enabled = true } = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => listProducts(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Creates a product, or updates it when `productId` is given. */
export function useSaveProduct(productId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ProductFormValues) =>
      productId ? updateProduct(productId, values) : createProduct(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
