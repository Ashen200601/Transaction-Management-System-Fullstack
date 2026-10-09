import { ApiError, parseApiError } from './errors';
import type { QueryParams } from './types';

export interface HttpClientConfig {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  /** The business (tenant) the request acts on, sent as X-Business-Id. */
  getBusinessId?: () => string | null;
  /** Called when the API answers 401, e.g. to sign the user out. */
  onUnauthorized?: () => void;
}

export interface RequestOptions {
  params?: QueryParams;
  headers?: Record<string, string>;
  /** Lets the API ignore a retried write it has already applied. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface HttpClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(path: string, options?: RequestOptions): Promise<T>;
}

function buildUrl(baseUrl: string, path: string, params?: QueryParams) {
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createHttpClient(config: HttpClientConfig): HttpClient {
  async function request<T>(method: string, path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    const headers = new Headers({ Accept: 'application/json', ...options.headers });

    const token = await config.getAccessToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const businessId = config.getBusinessId?.();
    if (businessId) headers.set('X-Business-Id', businessId);

    if (options.idempotencyKey) headers.set('Idempotency-Key', options.idempotencyKey);

    let payload: BodyInit | undefined;
    if (body instanceof FormData) {
      payload = body; // the browser sets the multipart boundary
    } else if (body !== undefined) {
      headers.set('Content-Type', 'application/json');
      payload = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(buildUrl(config.baseUrl, path, options.params), {
        method,
        headers,
        body: payload,
        signal: options.signal,
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
      });
    }

    const data = await readBody(response);
    if (!response.ok) {
      if (response.status === 401) config.onUnauthorized?.();
      throw parseApiError(response.status, data);
    }
    return data as T;
  }

  return {
    get: (path, options) => request('GET', path, undefined, options),
    post: (path, body, options) => request('POST', path, body, options),
    put: (path, body, options) => request('PUT', path, body, options),
    patch: (path, body, options) => request('PATCH', path, body, options),
    delete: (path, options) => request('DELETE', path, undefined, options),
  };
}
