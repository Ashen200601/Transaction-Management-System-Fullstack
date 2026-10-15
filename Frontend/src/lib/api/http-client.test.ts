import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/test/server';

import { ApiError } from './errors';
import { createHttpClient, type HttpClientConfig } from './http-client';

const BASE_URL = 'http://api.test/v1';

function createClient(overrides: Partial<HttpClientConfig> = {}) {
  return createHttpClient({
    baseUrl: BASE_URL,
    getAccessToken: async () => 'token-123',
    getBusinessId: () => 'biz_0001',
    ...overrides,
  });
}

interface CapturedRequest {
  url: URL;
  headers: Headers;
  body: string;
}

/** Answers `method path` with `reply` and records every request it receives. */
function capture(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  reply: () => Response = () => HttpResponse.json({ ok: true }),
) {
  const requests: CapturedRequest[] = [];
  server.use(
    http[method](`${BASE_URL}${path}`, async ({ request }) => {
      requests.push({ url: new URL(request.url), headers: request.headers, body: await request.text() });
      return reply();
    }),
  );
  return requests;
}

describe('createHttpClient', () => {
  it('joins the base URL and path and parses JSON', async () => {
    capture('get', '/products', () => HttpResponse.json([{ id: 'prod_1' }]));

    await expect(createClient().get('/products')).resolves.toEqual([{ id: 'prod_1' }]);
  });

  it('copes with extra or missing slashes when joining URLs', async () => {
    const requests = capture('get', '/products');

    await createClient({ baseUrl: `${BASE_URL}/` }).get('products');

    expect(requests[0].url.pathname).toBe('/v1/products');
  });

  it('resolves a base path like /api against the page origin', async () => {
    let requestedUrl = '';
    server.use(
      http.get(`${location.origin}/api/products`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    await createClient({ baseUrl: '/api' }).get('/products');

    expect(requestedUrl).toBe(`${location.origin}/api/products`);
  });

  it('serialises query params and skips empty values', async () => {
    const requests = capture('get', '/transactions');

    await createClient().get('/transactions', {
      params: { page: 2, status: 'completed', search: '', customerId: undefined, from: null, includeVoided: false },
    });

    expect(Object.fromEntries(requests[0].url.searchParams)).toEqual({
      page: '2',
      status: 'completed',
      includeVoided: 'false',
    });
  });

  it('sends the bearer token and active business id', async () => {
    const requests = capture('get', '/me');

    await createClient().get('/me');

    expect(requests[0].headers.get('authorization')).toBe('Bearer token-123');
    expect(requests[0].headers.get('x-business-id')).toBe('biz_0001');
    expect(requests[0].headers.get('accept')).toBe('application/json');
  });

  it('omits auth and business headers when they are not available', async () => {
    const requests = capture('get', '/me');

    await createClient({ getAccessToken: async () => null, getBusinessId: () => null }).get('/me');

    expect(requests[0].headers.has('authorization')).toBe(false);
    expect(requests[0].headers.has('x-business-id')).toBe(false);
  });

  it('sends JSON request bodies', async () => {
    const requests = capture('post', '/products', () => HttpResponse.json({ id: 'prod_1' }, { status: 201 }));
    const body = { name: 'Espresso Beans 1kg', price: 2500 };

    await expect(createClient().post('/products', body)).resolves.toEqual({ id: 'prod_1' });

    expect(requests[0].headers.get('content-type')).toBe('application/json');
    expect(JSON.parse(requests[0].body)).toEqual(body);
  });

  it('forwards an Idempotency-Key header', async () => {
    const requests = capture('post', '/transactions', () => HttpResponse.json({ id: 'txn_1' }, { status: 201 }));

    await createClient().post('/transactions', { lines: [] }, { idempotencyKey: 'key-abc' });

    expect(requests[0].headers.get('idempotency-key')).toBe('key-abc');
  });

  it('resolves to undefined for 204 No Content', async () => {
    capture('delete', '/products/prod_1', () => new HttpResponse(null, { status: 204 }));

    await expect(createClient().delete('/products/prod_1')).resolves.toBeUndefined();
  });

  it('throws an ApiError built from problem details on error responses', async () => {
    capture('post', '/transactions', () =>
      HttpResponse.json(
        {
          title: 'Validation failed',
          detail: 'Quantity must be greater than 0.',
          code: 'VALIDATION_ERROR',
          errors: { 'lines.0.quantity': ['Must be greater than 0'] },
        },
        { status: 422, headers: { 'content-type': 'application/problem+json' } },
      ),
    );

    const error = await createClient()
      .post('/transactions', {})
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Quantity must be greater than 0.',
      fieldErrors: { 'lines.0.quantity': ['Must be greater than 0'] },
    });
  });

  it('throws a generic ApiError when the error body is not JSON', async () => {
    capture(
      'get',
      '/reports',
      () => new HttpResponse('<h1>Bad gateway</h1>', { status: 502, headers: { 'content-type': 'text/html' } }),
    );

    await expect(createClient().get('/reports')).rejects.toMatchObject({ status: 502, code: 'HTTP_502' });
  });

  it('wraps network failures in an ApiError with status 0', async () => {
    capture('get', '/products', () => HttpResponse.error());

    await expect(createClient().get('/products')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it('tells the app when the session is no longer valid', async () => {
    const onUnauthorized = vi.fn();
    capture('get', '/me', () => HttpResponse.json({ title: 'Unauthorized' }, { status: 401 }));

    await expect(createClient({ onUnauthorized }).get('/me')).rejects.toMatchObject({ status: 401 });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  describe('after a 401', () => {
    it('renews the access token and sends the request once more', async () => {
      const authorizations: Array<string | null> = [];
      server.use(
        http.get(`${BASE_URL}/me`, ({ request }) => {
          authorizations.push(request.headers.get('authorization'));
          return authorizations.length === 1
            ? HttpResponse.json({ title: 'Expired' }, { status: 401 })
            : HttpResponse.json({ id: 'user_1' });
        }),
      );
      const onUnauthorized = vi.fn();
      const refreshAccessToken = vi.fn(async () => 'token-456');

      await expect(createClient({ refreshAccessToken, onUnauthorized }).get('/me')).resolves.toEqual({ id: 'user_1' });

      expect(authorizations).toEqual(['Bearer token-123', 'Bearer token-456']);
      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('gives up when the session has ended', async () => {
      server.use(http.get(`${BASE_URL}/me`, () => HttpResponse.json({ title: 'Expired' }, { status: 401 })));
      const onUnauthorized = vi.fn();

      await expect(
        createClient({ refreshAccessToken: async () => null, onUnauthorized }).get('/me'),
      ).rejects.toMatchObject({ status: 401 });

      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('retries only once, even if the new token is refused too', async () => {
      let requests = 0;
      server.use(
        http.get(`${BASE_URL}/me`, () => {
          requests += 1;
          return HttpResponse.json({ title: 'Nope' }, { status: 401 });
        }),
      );
      const onUnauthorized = vi.fn();
      const refreshAccessToken = vi.fn(async () => 'token-456');

      await expect(createClient({ refreshAccessToken, onUnauthorized }).get('/me')).rejects.toMatchObject({
        status: 401,
      });

      expect(requests).toBe(2);
      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('does not renew anything for a request sent without a token, such as a wrong password', async () => {
      server.use(http.post(`${BASE_URL}/auth/login`, () => HttpResponse.json({ title: 'Nope' }, { status: 401 })));
      const refreshAccessToken = vi.fn(async () => 'token-456');

      await expect(
        createClient({ getAccessToken: async () => null, refreshAccessToken }).post('/auth/login', {}),
      ).rejects.toMatchObject({ status: 401 });

      expect(refreshAccessToken).not.toHaveBeenCalled();
    });
  });

  it('sends cookies only when asked to', async () => {
    const credentials: RequestCredentials[] = [];
    server.use(
      http.post(`${BASE_URL}/auth/refresh`, ({ request }) => {
        credentials.push(request.credentials);
        return HttpResponse.json({});
      }),
    );

    await createClient({ credentials: 'include' }).post('/auth/refresh');
    await createClient().post('/auth/refresh');

    expect(credentials).toEqual(['include', 'same-origin']);
  });
});
