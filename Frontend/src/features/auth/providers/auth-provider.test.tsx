import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { buildUser } from '@/test/factories';
import { server } from '@/test/server';

import { useAuth } from '../auth-context';
import { readSession, writeSession } from '../session-store';
import { AuthProvider } from './auth-provider';

const user = buildUser({ username: 'jane.perera', name: 'Jane Perera' });

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe('AuthProvider', () => {
  it('starts signed out', () => {
    const { result } = renderAuth();

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
  });

  it('signs in with a username and password and keeps the session for the tab', async () => {
    let body: unknown;
    server.use(
      http.post('*/auth/login', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ accessToken: 'token-1', expiresIn: 3600, user });
      }),
    );
    const { result } = renderAuth();

    await act(() => result.current.login({ username: 'jane.perera', password: 'secret123' }));

    expect(body).toEqual({ username: 'jane.perera', password: 'secret123' });
    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toEqual(user);
    expect(await result.current.getAccessToken()).toBe('token-1');
    expect(readSession()?.accessToken).toBe('token-1');
  });

  it('stays signed out when the credentials are wrong', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ title: 'Sign-in failed', status: 401 }, { status: 401 }),
      ),
    );
    const { result } = renderAuth();

    await expect(result.current.login({ username: 'jane.perera', password: 'nope' })).rejects.toMatchObject({ status: 401 });
    expect(result.current.status).toBe('unauthenticated');
    expect(readSession()).toBeNull();
  });

  it('restores the session after a reload', () => {
    writeSession({ accessToken: 'token-1', expiresAt: Date.now() + 60_000, user });

    const { result } = renderAuth();

    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toEqual(user);
  });

  it('signs out locally and on the server', async () => {
    const logoutCalls = vi.fn();
    server.use(
      http.post('*/auth/logout', ({ request }) => {
        logoutCalls(request.headers.get('authorization'));
        return new HttpResponse(null, { status: 204 });
      }),
    );
    writeSession({ accessToken: 'token-1', expiresAt: Date.now() + 60_000, user });
    const { result } = renderAuth();

    await act(() => result.current.logout());

    expect(result.current.status).toBe('unauthenticated');
    expect(await result.current.getAccessToken()).toBeNull();
    expect(readSession()).toBeNull();
    await waitFor(() => expect(logoutCalls).toHaveBeenCalledWith('Bearer token-1'));
  });

  it('signs out when the session expires', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      server.use(http.post('*/auth/logout', () => new HttpResponse(null, { status: 204 })));
      writeSession({ accessToken: 'token-1', expiresAt: Date.now() + 60_000, user });
      const { result } = renderAuth();
      expect(result.current.status).toBe('authenticated');

      act(() => vi.advanceTimersByTime(60_000));

      expect(result.current.status).toBe('unauthenticated');
    } finally {
      vi.useRealTimers();
    }
  });
});
