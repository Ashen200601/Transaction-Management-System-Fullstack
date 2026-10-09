import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

const mockAuthEnv = {
  VITE_API_BASE_URL: 'https://api.finovex.test/v1',
  VITE_AUTH_MODE: 'mock',
};

const oidcEnv = {
  VITE_API_BASE_URL: 'https://api.finovex.test/v1',
  VITE_AUTH_MODE: 'oidc',
  VITE_OIDC_AUTHORITY: 'https://auth.finovex.test/realms/finovex',
  VITE_OIDC_CLIENT_ID: 'finovex-web',
  VITE_OIDC_REDIRECT_URI: 'https://app.finovex.test/auth/callback',
};

describe('parseEnv', () => {
  it('parses a mock-auth development config', () => {
    expect(parseEnv(mockAuthEnv)).toEqual({
      apiBaseUrl: 'https://api.finovex.test/v1',
      authMode: 'mock',
      enableMocks: false,
      oidc: null,
    });
  });

  it('parses an OIDC config', () => {
    expect(parseEnv(oidcEnv)).toEqual({
      apiBaseUrl: 'https://api.finovex.test/v1',
      authMode: 'oidc',
      enableMocks: false,
      oidc: {
        authority: 'https://auth.finovex.test/realms/finovex',
        clientId: 'finovex-web',
        redirectUri: 'https://app.finovex.test/auth/callback',
      },
    });
  });

  it('removes a trailing slash from the API base URL', () => {
    const env = parseEnv({ ...mockAuthEnv, VITE_API_BASE_URL: 'https://api.finovex.test/v1/' });
    expect(env.apiBaseUrl).toBe('https://api.finovex.test/v1');
  });

  it.each([
    ['true', true],
    ['false', false],
    ['yes', false],
    [undefined, false],
  ])('VITE_ENABLE_MOCKS=%s gives enableMocks=%s', (value, expected) => {
    expect(parseEnv({ ...mockAuthEnv, VITE_ENABLE_MOCKS: value }).enableMocks).toBe(expected);
  });

  it('rejects a missing or invalid API base URL', () => {
    expect(() => parseEnv({ ...mockAuthEnv, VITE_API_BASE_URL: undefined })).toThrow(/VITE_API_BASE_URL/);
    expect(() => parseEnv({ ...mockAuthEnv, VITE_API_BASE_URL: 'not a url' })).toThrow(/VITE_API_BASE_URL/);
  });

  it('rejects an unknown auth mode', () => {
    expect(() => parseEnv({ ...mockAuthEnv, VITE_AUTH_MODE: 'basic' })).toThrow(/VITE_AUTH_MODE/);
  });

  it('defaults to OIDC so a missing setting never turns on mock sign-in', () => {
    expect(() => parseEnv({ VITE_API_BASE_URL: 'https://api.finovex.test/v1' })).toThrow(/VITE_OIDC_AUTHORITY/);
  });

  it.each(['VITE_OIDC_AUTHORITY', 'VITE_OIDC_CLIENT_ID', 'VITE_OIDC_REDIRECT_URI'])(
    'requires %s in OIDC mode',
    (key) => {
      expect(() => parseEnv({ ...oidcEnv, [key]: undefined })).toThrow(new RegExp(key));
    },
  );

  it('refuses mock auth in production builds', () => {
    expect(() => parseEnv({ ...mockAuthEnv, PROD: true })).toThrow(/mock auth/i);
  });
});
