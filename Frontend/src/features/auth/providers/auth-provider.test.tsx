import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { buildUser } from '@/test/factories';
import { server } from '@/test/server';

import { useAuth } from '../auth-context';
import { hasSessionHint, setSessionHint } from '../session-hint';
import { AuthProvider } from './auth-provider';

const user = buildUser({ username: 'jane.perera', name: 'Jane Perera' });

const signedIn = (accessToken: string, expiresIn = 900) => HttpResponse.json({ accessToken, expiresIn, user });
const sessionEnded = () =>
  HttpResponse.json({ title: 'Session ended', status: 401, code: 'SESSION_EXPIRED' }, { status: 401 });

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

/** Answers /auth/refresh with the given responses in turn, and counts the calls. */
function mockRefresh(...responses: Array<() => Response>) {
  const calls = vi.fn();
  server.use(
    http.post('*/auth/refresh', () => {
      calls();
      return (responses.length > 1 ? responses.shift() : responses[0])!();
    }),
  );
  return calls;
}

describe('AuthProvider', () => {
  it('starts signed out, without asking the API, when this browser never signed in', () => {
    // No /auth/refresh handler: an unexpected request would fail the test.
    const { result } = renderAuth();

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
  });

  it('signs in and keeps the access token in memory only', async () => {
    let body: unknown;
    server.use(
      http.post('*/auth/login', async ({ request }) => {
        body = await request.json();
        return signedIn('token-1');
      }),
    );
    const { result } = renderAuth();

    await act(() => result.current.login({ username: 'jane.perera', password: 'secret123' }));

    expect(body).toEqual({ username: 'jane.perera', password: 'secret123' });
    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toEqual(user);
    expect(await result.current.getAccessToken()).toBe('token-1');
    expect(JSON.stringify({ ...sessionStorage, ...localStorage })).not.toContain('token-1');
    expect(hasSessionHint()).toBe(true);
  });

  it('stays signed out when the credentials are wrong', async () => {
    server.use(
      http.post('*/auth/login', () => HttpResponse.json({ title: 'Sign-in failed', status: 401 }, { status: 401 })),
    );
    const { result } = renderAuth();

    await expect(result.current.login({ username: 'jane.perera', password: 'nope' })).rejects.toMatchObject({ status: 401 });
    expect(result.current.status).toBe('unauthenticated');
    expect(hasSessionHint()).toBe(false);
  });

  it('restores the session from the refresh cookie after a reload', async () => {
    setSessionHint();
    const refreshCalls = mockRefresh(() => signedIn('token-2'));

    const { result } = renderAuth();

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.user).toEqual(user);
    expect(await result.current.getAccessToken()).toBe('token-2');
    expect(refreshCalls).toHaveBeenCalledTimes(1);
  });

  it('shows the sign-in page when the remembered session has ended', async () => {
    setSessionHint();
    mockRefresh(sessionEnded);

    const { result } = renderAuth();

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(hasSessionHint()).toBe(false);
  });

  it('sends one refresh request when several callers need a new token at once', async () => {
    setSessionHint();
    const refreshCalls = mockRefresh(() => signedIn('token-2'));
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    refreshCalls.mockClear();

    const tokens = await act(() =>
      Promise.all([result.current.refreshAccessToken(), result.current.refreshAccessToken()]),
    );

    expect(tokens).toEqual(['token-2', 'token-2']);
    expect(refreshCalls).toHaveBeenCalledTimes(1);
  });

  it('renews an access token that is about to expire before handing it out', async () => {
    server.use(http.post('*/auth/login', () => signedIn('almost-expired', 5)));
    mockRefresh(() => signedIn('fresh'));
    const { result } = renderAuth();
    await act(() => result.current.login({ username: 'jane.perera', password: 'secret123' }));

    let token: string | null = null;
    await act(async () => {
      token = await result.current.getAccessToken();
    });

    expect(token).toBe('fresh');
  });

  it('renews the access token shortly before it expires', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      server.use(http.post('*/auth/login', () => signedIn('token-1', 900)));
      const refreshCalls = mockRefresh(() => signedIn('token-2', 900));
      const { result } = renderAuth();
      await act(() => result.current.login({ username: 'jane.perera', password: 'secret123' }));

      await act(async () => {
        vi.advanceTimersByTime(839_000);
      });
      expect(refreshCalls).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1_000);
      });
      await vi.waitFor(() => expect(refreshCalls).toHaveBeenCalledTimes(1));
      await vi.waitFor(async () => expect(await result.current.getAccessToken()).toBe('token-2'));
    } finally {
      vi.useRealTimers();
    }
  });

  it('signs out when a renewal finds the session has ended', async () => {
    server.use(http.post('*/auth/login', () => signedIn('token-1')));
    mockRefresh(sessionEnded);
    const { result } = renderAuth();
    await act(() => result.current.login({ username: 'jane.perera', password: 'secret123' }));

    let token: string | null = 'unset';
    await act(async () => {
      token = await result.current.refreshAccessToken();
    });

    expect(token).toBeNull();
    expect(result.current.status).toBe('unauthenticated');
    expect(hasSessionHint()).toBe(false);
  });

  it('keeps the session through a network blip during renewal', async () => {
    server.use(http.post('*/auth/login', () => signedIn('token-1')));
    mockRefresh(() => HttpResponse.error());
    const { result } = renderAuth();
    await act(() => result.current.login({ username: 'jane.perera', password: 'secret123' }));

    await act(() => result.current.refreshAccessToken());

    expect(result.current.status).toBe('authenticated');
    expect(await result.current.getAccessToken()).toBe('token-1');
  });

  it('signs out locally and on the server', async () => {
    const logoutCalls = vi.fn();
    server.use(
      http.post('*/auth/login', () => signedIn('token-1')),
      http.post('*/auth/logout', ({ request }) => {
        logoutCalls(request.credentials);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderAuth();
    await act(() => result.current.login({ username: 'jane.perera', password: 'secret123' }));

    await act(() => result.current.logout());

    expect(result.current.status).toBe('unauthenticated');
    expect(await result.current.getAccessToken()).toBeNull();
    expect(hasSessionHint()).toBe(false);
    await waitFor(() => expect(logoutCalls).toHaveBeenCalledWith('include'));
  });

  it('does not bring back a session that was signed out while a renewal was on its way', async () => {
    const pending: { finish?: () => void } = {};
    server.use(
      http.post('*/auth/login', () => signedIn('token-1')),
      http.post('*/auth/logout', () => new HttpResponse(null, { status: 204 })),
      http.post(
        '*/auth/refresh',
        () =>
          new Promise<Response>((resolve) => {
            pending.finish = () => resolve(signedIn('token-2'));
          }),
      ),
    );
    const { result } = renderAuth();
    await act(() => result.current.login({ username: 'jane.perera', password: 'secret123' }));

    let renewal: Promise<string | null> = Promise.resolve(null);
    act(() => {
      renewal = result.current.refreshAccessToken();
    });
    await waitFor(() => expect(pending.finish).toBeDefined());
    await act(() => result.current.logout());
    await act(async () => {
      pending.finish?.();
      await renewal;
    });

    expect(result.current.status).toBe('unauthenticated');
  });

  it.skipIf(typeof BroadcastChannel === 'undefined')('signs out when another tab signs out', async () => {
    server.use(http.post('*/auth/login', () => signedIn('token-1')));
    const { result } = renderAuth();
    await act(() => result.current.login({ username: 'jane.perera', password: 'secret123' }));

    const otherTab = new BroadcastChannel('finovex-auth');
    otherTab.postMessage('logout');
    otherTab.close();

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
  });
});
