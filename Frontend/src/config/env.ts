export interface AppEnv {
  /** An absolute URL, or a path on this site such as "/api" (the dev server proxies it to the backend). */
  apiBaseUrl: string;
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

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return { apiBaseUrl };
}

export const env = parseEnv(import.meta.env);
