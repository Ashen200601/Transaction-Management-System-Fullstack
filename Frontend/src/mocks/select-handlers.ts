import type { HttpHandler } from 'msw';

/** The API module a handler serves: the first path segment after the base URL, e.g. "products". */
export function apiModuleOf(handler: HttpHandler, apiBaseUrl: string): string | null {
  const { path } = handler.info;
  if (typeof path !== 'string' || !path.startsWith(`${apiBaseUrl}/`)) return null;
  return path.slice(apiBaseUrl.length + 1).split('/')[0] || null;
}

/**
 * The mock handlers to install: all of them except those for the `except` modules. Requests
 * for those find no mock and go on to the real API (the worker bypasses unhandled requests).
 * Unknown module names throw, so a typo can't silently leave a module mocked.
 */
export function selectHandlers<H extends HttpHandler>(handlers: readonly H[], except: readonly string[], apiBaseUrl: string): H[] {
  const known = new Set(handlers.map((handler) => apiModuleOf(handler, apiBaseUrl)).filter((name) => name !== null));
  const unknown = except.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new Error(
      `VITE_MOCKS_EXCEPT names API modules that have no mocks: ${unknown.join(', ')}. ` +
        `Mocked modules: ${[...known].sort().join(', ')}.`,
    );
  }
  const skipped = new Set(except);
  return handlers.filter((handler) => !skipped.has(apiModuleOf(handler, apiBaseUrl) ?? ''));
}
