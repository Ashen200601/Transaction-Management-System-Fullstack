import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { apiModuleOf, selectHandlers } from './select-handlers';

const BASE = 'http://localhost:8080/api';
const ok = () => HttpResponse.json({});

const handlers = [
  http.post(`${BASE}/auth/login`, ok),
  http.post(`${BASE}/auth/signup`, ok),
  http.get(`${BASE}/products`, ok),
  http.post(`${BASE}/inventory/:productId/adjustments`, ok),
];

const paths = (list: typeof handlers) => list.map((handler) => handler.info.path);

describe('apiModuleOf', () => {
  it('is the first path segment after the API base URL', () => {
    expect(handlers.map((handler) => apiModuleOf(handler, BASE))).toEqual(['auth', 'auth', 'products', 'inventory']);
  });

  it('is null for a handler outside the API', () => {
    expect(apiModuleOf(http.get('https://cdn.example.com/logo.svg', ok), BASE)).toBeNull();
  });
});

describe('selectHandlers', () => {
  it('keeps every mock when no module is excepted', () => {
    expect(selectHandlers(handlers, [], BASE)).toEqual(handlers);
  });

  it('drops every handler of an excepted module, so its requests reach the real API', () => {
    expect(paths(selectHandlers(handlers, ['auth'], BASE))).toEqual([
      `${BASE}/products`,
      `${BASE}/inventory/:productId/adjustments`,
    ]);
  });

  it('rejects a module that has no mocks and lists the ones that do', () => {
    expect(() => selectHandlers(handlers, ['autth'], BASE)).toThrow(/autth.*Mocked modules: auth, inventory, products/);
  });
});
