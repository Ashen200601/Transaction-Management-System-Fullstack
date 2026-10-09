import { delay, HttpResponse } from 'msw';

import { env } from '@/config/env';
import type { Paginated } from '@/lib/api/types';

import { getStore, type BusinessStore } from './db';

/** Full URL of an API path, so mocks only answer API requests. */
export const api = (path: string) => `${env.apiBaseUrl}${path}`;

/** A little network latency so loading states are visible. */
export const latency = () => delay(200 + Math.random() * 300);

/** An RFC 7807 problem response, the shape the real API returns for errors. */
export function problem(
  status: number,
  title: string,
  extra: { code?: string; detail?: string; errors?: Record<string, string[]> } = {},
) {
  return HttpResponse.json(
    { type: 'about:blank', title, status, ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

/** Field errors from validation issues, keyed by dotted path. */
export function validationProblem(issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>) {
  const errors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || '_';
    (errors[key] ??= []).push(issue.message);
  }
  return problem(422, 'Validation failed', { code: 'VALIDATION_ERROR', detail: 'Some fields need attention.', errors });
}

export function paginate<T>(items: readonly T[], url: URL): Paginated<T> {
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalItems, totalPages };
}

/** Case-insensitive "contains" across the given fields. */
export function matchesSearch(search: string | null, ...fields: Array<string | null | undefined>) {
  if (!search) return true;
  const needle = search.toLowerCase();
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

/** The store for the business in X-Business-Id, or a problem response. */
export function requireStore(request: Request): BusinessStore | Response {
  const businessId = request.headers.get('x-business-id');
  if (!businessId) return problem(400, 'Choose a business first', { code: 'BUSINESS_REQUIRED' });
  const store = getStore(businessId);
  if (!store) return problem(403, 'You are not a member of this business', { code: 'FORBIDDEN' });
  return store;
}
