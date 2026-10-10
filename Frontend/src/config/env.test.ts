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
    });
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

  it('refuses the mock API, and its demo sign-in, in production builds', () => {
    expect(() => parseEnv({ ...baseEnv, VITE_ENABLE_MOCKS: 'true', PROD: true })).toThrow(/mock API/);
    expect(parseEnv({ ...baseEnv, VITE_ENABLE_MOCKS: 'false', PROD: true }).enableMocks).toBe(false);
  });
});
