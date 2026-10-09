import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, type Paginated } from '@/lib/api';

import type { NewTransactionValues, VoidTransactionValues } from './schemas';
import type { Transaction, TransactionStatus } from './types';

export type TransactionListParams = {
  page?: number;
  pageSize?: number;
  status?: TransactionStatus | '';
  search?: string;
  /** YYYY-MM-DD, inclusive. */
  from?: string;
  to?: string;
};

export function listTransactions(params: TransactionListParams = {}) {
  return apiClient.get<Paginated<Transaction>>('/transactions', { params });
}

export function getTransaction(id: string) {
  return apiClient.get<Transaction>(`/transactions/${encodeURIComponent(id)}`);
}

/** The key lets the API recognise a retry of the same submission and not charge twice. */
export function createTransaction(input: NewTransactionValues, idempotencyKey: string) {
  return apiClient.post<Transaction>('/transactions', input, { idempotencyKey });
}

export function voidTransaction(id: string, values: VoidTransactionValues) {
  return apiClient.post<Transaction>(`/transactions/${encodeURIComponent(id)}/void`, values);
}

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (params: TransactionListParams) => ['transactions', 'list', params] as const,
  detail: (id: string) => ['transactions', 'detail', id] as const,
};

export function useTransactions(params: TransactionListParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => listTransactions(params),
    placeholderData: keepPreviousData,
  });
}

export function useTransaction(id: string, { enabled = true } = {}) {
  return useQuery({ queryKey: transactionKeys.detail(id), queryFn: () => getTransaction(id), enabled: enabled && !!id });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: NewTransactionValues; idempotencyKey: string }) =>
      createTransaction(input, idempotencyKey),
    onSuccess: (transaction) => {
      queryClient.setQueryData(transactionKeys.detail(transaction.id), transaction);
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useVoidTransaction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: VoidTransactionValues) => voidTransaction(id, values),
    onSuccess: (transaction) => {
      queryClient.setQueryData(transactionKeys.detail(id), transaction);
      void queryClient.invalidateQueries({ queryKey: [...transactionKeys.all, 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
