const PROBE_ORIGIN = 'https://app.invalid';

/**
 * The ?returnTo= value comes from the URL, so anyone can craft it. Only
 * same-origin paths pass through; everything else becomes "/", so sign-in
 * can't be used as an open redirect.
 */
export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  // Browsers drop tabs and newlines inside URLs, which can turn "/\t/x" into "//x".
  if (/[\u0000-\u001f\u007f]/.test(value)) return '/';

  let url: URL;
  try {
    url = new URL(value, PROBE_ORIGIN);
  } catch {
    return '/';
  }
  if (url.origin !== PROBE_ORIGIN) return '/';
  // Returning to the sign-in page itself would loop.
  if (url.pathname === '/login') return '/';

  return value;
}
