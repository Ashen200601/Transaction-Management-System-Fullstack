export interface AppEnv {
  /** An absolute URL, or a path on this site such as "/api" (the dev server proxies it to the backend). */
  apiBaseUrl: string;
  enableMocks: boolean;
  /**
   * With mocks on, the API modules that skip them and call the real API instead. A module is
   * the first path segment after the base URL: "auth" covers /auth/login, /auth/signup, …
   */
  mocksExcept: string[];
}

type RawEnv = Record<string, string | boolean | undefined>;

const MODULE_NAME = /^[a-z0-9-]+$/;

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

/** A path on the site serving the app, like "/api". "//host/api" is another site, so it doesn't count. */
function isSitePath(value: string) {
  return /^\/[^/\s]\S*$/.test(value);
}

/** Validates the VITE_* settings and fails fast with every problem listed. */
export function parseEnv(raw: RawEnv): AppEnv {
  const errors: string[] = [];

  const apiBaseUrl = readString(raw, 'VITE_API_BASE_URL').replace(/\/+$/, '');
  
  if (!isHttpUrl(apiBaseUrl) && !isSitePath(apiBaseUrl)) {
    errors.push('VITE_API_BASE_URL must be an absolute http(s) URL or a path on this site, such as /api.');
  }

  const enableMocks = raw.VITE_ENABLE_MOCKS === 'true' || raw.VITE_ENABLE_MOCKS === true;
  const isProduction = raw.PROD === true || raw.PROD === 'true';
  // The mock API signs anyone in with a demo account, so it must never ship.
  if (enableMocks && isProduction) {
    errors.push('The mock API cannot be used in production builds. Set VITE_ENABLE_MOCKS=false.');
  }

  const mocksExcept = [
    ...new Set(
      readString(raw, 'VITE_MOCKS_EXCEPT')
        .split(',')
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (!mocksExcept.every((name) => MODULE_NAME.test(name))) {
    errors.push('VITE_MOCKS_EXCEPT must be a comma-separated list of API modules, e.g. auth,products.');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return { apiBaseUrl, enableMocks, mocksExcept };
}

export const env = parseEnv(import.meta.env);
