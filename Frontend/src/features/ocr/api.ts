import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, type Paginated } from '@/lib/api';

import type { ReviewedDocument } from './schemas';
import type { DocumentStatus, OcrDocument } from './types';

export type DocumentListParams = {
  page?: number;
  pageSize?: number;
  status?: DocumentStatus | '';
};

export function listDocuments(params: DocumentListParams = {}) {
  return apiClient.get<Paginated<OcrDocument>>('/documents', { params });
}

export function getDocument(id: string) {
  return apiClient.get<OcrDocument>(`/documents/${encodeURIComponent(id)}`);
}

export function uploadDocument(file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post<OcrDocument>('/documents', form);
}

export function confirmDocument(id: string, values: ReviewedDocument) {
  return apiClient.post<OcrDocument>(`/documents/${encodeURIComponent(id)}/confirm`, values);
}

export const documentKeys = {
  all: ['documents'] as const,
  list: (params: DocumentListParams) => ['documents', 'list', params] as const,
  detail: (id: string) => ['documents', 'detail', id] as const,
};

export function useDocuments(params: DocumentListParams) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => listDocuments(params),
    placeholderData: keepPreviousData,
  });
}

/** Polls while the OCR engine is still reading the document. */
export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => getDocument(id),
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? 1500 : false),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: (document) => {
      queryClient.setQueryData(documentKeys.detail(document.id), document);
      void queryClient.invalidateQueries({ queryKey: [...documentKeys.all, 'list'] });
    },
  });
}

export function useConfirmDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ReviewedDocument) => confirmDocument(id, values),
    onSuccess: (document) => {
      queryClient.setQueryData(documentKeys.detail(id), document);
      void queryClient.invalidateQueries({ queryKey: [...documentKeys.all, 'list'] });
    },
  });
}
