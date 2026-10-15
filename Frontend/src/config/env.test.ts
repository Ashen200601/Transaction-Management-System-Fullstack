import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

const baseEnv = {
  VITE_API_BASE_URL: 'https://api.finovex.test/v1',
};

describe('parseEnv', () => {
  it('parses a config', () => {
    expect(parseEnv(baseEnv)).toEqual({ apiBaseUrl: 'https://api.finovex.test/v1' });
  });

  it('removes a trailing slash from the API base URL', () => {
    const env = parseEnv({ ...baseEnv, VITE_API_BASE_URL: 'https://api.finovex.test/v1/' });
    expect(env.apiBaseUrl).toBe('https://api.finovex.test/v1');
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
});
