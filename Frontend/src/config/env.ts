export type AuthMode = 'mock' | 'oidc';

export interface OidcConfig {
  authority: string;
  clientId: string;
  redirectUri: string;
}

export interface AppEnv {
  apiBaseUrl: string;
  authMode: AuthMode;
  enableMocks: boolean;
  oidc: OidcConfig | null;
}

type RawEnv = Record<string, string | boolean | undefined>;

const AUTH_MODES: readonly AuthMode[] = ['mock', 'oidc'];
const OIDC_KEYS = ['VITE_OIDC_AUTHORITY', 'VITE_OIDC_CLIENT_ID', 'VITE_OIDC_REDIRECT_URI'] as const;

function readString(raw: RawEnv, key: string) {
  const value = raw[key];
  return typeof value === 'string' ? value.trim() : '';
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Validates the VITE_* settings and fails fast with every problem listed. */
export function parseEnv(raw: RawEnv): AppEnv {
  const errors: string[] = [];

  const apiBaseUrl = readString(raw, 'VITE_API_BASE_URL').replace(/\/+$/, '');
  if (!isHttpUrl(apiBaseUrl)) {
    errors.push('VITE_API_BASE_URL must be an absolute http(s) URL.');
  }

  // Defaults to OIDC so that a missing setting can never enable mock sign-in.
  const authMode = (readString(raw, 'VITE_AUTH_MODE') || 'oidc') as AuthMode;
  if (!AUTH_MODES.includes(authMode)) {
    errors.push(`VITE_AUTH_MODE must be one of: ${AUTH_MODES.join(', ')}.`);
  }

  let oidc: OidcConfig | null = null;
  if (authMode === 'oidc') {
    const missing = OIDC_KEYS.filter((key) => !readString(raw, key));
    if (missing.length > 0) {
      errors.push(`OIDC sign-in needs ${missing.join(', ')}.`);
    } else {
      oidc = {
        authority: readString(raw, 'VITE_OIDC_AUTHORITY'),
        clientId: readString(raw, 'VITE_OIDC_CLIENT_ID'),
        redirectUri: readString(raw, 'VITE_OIDC_REDIRECT_URI'),
      };
    }
  }

  const isProduction = raw.PROD === true || raw.PROD === 'true';
  if (authMode === 'mock' && isProduction) {
    errors.push('Mock auth cannot be used in production builds. Set VITE_AUTH_MODE=oidc.');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return {
    apiBaseUrl,
    authMode,
    enableMocks: raw.VITE_ENABLE_MOCKS === 'true' || raw.VITE_ENABLE_MOCKS === true,
    oidc,
  };
}

export const env = parseEnv(import.meta.env);
