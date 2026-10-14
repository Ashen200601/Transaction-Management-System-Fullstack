import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

const baseEnv = {
  VITE_API_BASE_URL: 'https://api.finovex.test/v1',
};

describe('parseEnv', () => {
  it('parses a config', () => {
    expect(parseEnv(baseEnv)).toEqual({
      apiBaseUrl: 'https://api.finovex.test/v1',
      enableMocks: false,
      mocksExcept: [],
    });
  });

  it('reads the API modules that skip the mocks, tidied and without duplicates', () => {
    const env = parseEnv({ ...baseEnv, VITE_MOCKS_EXCEPT: ' Auth, products,,auth ' });
    expect(env.mocksExcept).toEqual(['auth', 'products']);
  });

  it('rejects VITE_MOCKS_EXCEPT entries that are not module names', () => {
    expect(() => parseEnv({ ...baseEnv, VITE_MOCKS_EXCEPT: 'auth;products' })).toThrow(/VITE_MOCKS_EXCEPT/);
    expect(() => parseEnv({ ...baseEnv, VITE_MOCKS_EXCEPT: '/auth/login' })).toThrow(/VITE_MOCKS_EXCEPT/);
  });

  it('removes a trailing slash from the API base URL', () => {
    const env = parseEnv({ ...baseEnv, VITE_API_BASE_URL: 'https://api.finovex.test/v1/' });
    expect(env.apiBaseUrl).toBe('https://api.finovex.test/v1');
  });

  it.each([
    ['true', true],
    ['false', false],
    ['yes', false],
    [undefined, false],
  ])('VITE_ENABLE_MOCKS=%s gives enableMocks=%s', (value, expected) => {
    expect(parseEnv({ ...baseEnv, VITE_ENABLE_MOCKS: value }).enableMocks).toBe(expected);
  });

  it('rejects a missing or invalid API base URL', () => {
    expect(() => parseEnv({ ...baseEnv, VITE_API_BASE_URL: undefined })).toThrow(/VITE_API_BASE_URL/);
    expect(() => parseEnv({ ...baseEnv, VITE_API_BASE_URL: 'not a url' })).toThrow(/VITE_API_BASE_URL/);
  });

  it('accepts a path on this site, which the dev server proxies to the backend', () => {
    expect(parseEnv({ ...baseEnv, VITE_API_BASE_URL: '/api/' }).apiBaseUrl).toBe('/api');
  });

  it('rejects paths that are not on this site, or are the bare root', () => {
    for (const value of ['//evil.example/api', 'api', '/', '/ api']) {
      expect(() => parseEnv({ ...baseEnv, VITE_API_BASE_URL: value }), value).toThrow(/VITE_API_BASE_URL/);
    }
  });

  it('refuses the mock API, and its demo sign-in, in production builds', () => {
    expect(() => parseEnv({ ...baseEnv, VITE_ENABLE_MOCKS: 'true', PROD: true })).toThrow(/mock API/);
    expect(parseEnv({ ...baseEnv, VITE_ENABLE_MOCKS: 'false', PROD: true }).enableMocks).toBe(false);
  });
});
