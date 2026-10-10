export interface AppEnv {
  apiBaseUrl: string;
  enableMocks: boolean;
}

type RawEnv = Record<string, string | boolean | undefined>;

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

  const enableMocks = raw.VITE_ENABLE_MOCKS === 'true' || raw.VITE_ENABLE_MOCKS === true;
  const isProduction = raw.PROD === true || raw.PROD === 'true';
  // The mock API signs anyone in with a demo account, so it must never ship.
  if (enableMocks && isProduction) {
    errors.push('The mock API cannot be used in production builds. Set VITE_ENABLE_MOCKS=false.');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return { apiBaseUrl, enableMocks };
}

export const env = parseEnv(import.meta.env);
