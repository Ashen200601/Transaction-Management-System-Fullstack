import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { isApiError } from '@/lib/api/errors';

import { refreshSession, signIn, signOut, type LoginResponse } from '../api';
import { AuthContext, type AuthContextValue } from '../auth-context';
import { clearSessionHint, hasSessionHint, setSessionHint } from '../session-hint';
import type { AuthStatus, AuthUser, LoginCredentials } from '../types';

/** Renew the access token about this long before it expires. */
const REFRESH_AHEAD_MS = 60_000;
/** Never renew more often than this, even when the last token of a session is very short. */
const MIN_REFRESH_DELAY_MS = 5_000;
/** A token with less time left than this is renewed before it's handed out. */
const MIN_TOKEN_LIFETIME_MS = 10_000;
// setTimeout fires immediately for delays above this (about 24.8 days).
const MAX_TIMER_DELAY = 2 ** 31 - 1;
/** Tabs share the refresh cookie, so they sign out together over this channel. */
const AUTH_CHANNEL = 'finovex-auth';

interface Session {
  accessToken: string;
  /** Epoch milliseconds. */
  expiresAt: number;
  user: AuthUser;
}

function broadcastLogout() {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage('logout');
  channel.close();
}

/**
 * Username and password sign-in. The API answers with a short-lived access token, kept in memory
 * only, and sets an HttpOnly refresh cookie that scripts can't read. The access token is renewed
 * with that cookie before it expires, after a 401, and after a page reload. The API ends the
 * session 8 hours after sign-in; the next renewal then fails and the user is signed out.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(hasSessionHint);
  const restoreOnMount = useRef(restoring);
  const sessionRef = useRef<Session | null>(null);
  const refreshing = useRef<Promise<string | null> | null>(null);
  // Bumped whenever the session is replaced or ended, so a renewal that was already on its way
  // can't bring back a session the user has just left.
  const epoch = useRef(0);

  const startSession = useCallback(({ accessToken, expiresIn, user }: LoginResponse) => {
    const next = { accessToken, expiresAt: Date.now() + expiresIn * 1000, user };
    sessionRef.current = next;
    setSession(next);
    setSessionHint();
    return accessToken;
  }, []);

  const endSession = useCallback(() => {
    epoch.current += 1;
    sessionRef.current = null;
    setSession(null);
    setRestoring(false);
    clearSessionHint();
  }, []);

  const refreshAccessToken = useCallback(() => {
    // One renewal at a time: each refresh token works once, so a second request would fail.
    if (!refreshing.current) {
      const startedIn = epoch.current;
      refreshing.current = refreshSession()
        .then((response) => (epoch.current === startedIn ? startSession(response) : null))
        .catch((error: unknown) => {
          // A 401 means the session is over. Other failures (offline, server down) keep a live
          // session for the next try, but can't restore one.
          if (epoch.current === startedIn && ((isApiError(error) && error.status === 401) || !sessionRef.current)) {
            endSession();
          }
          return null;
        })
        .finally(() => {
          refreshing.current = null;
          setRestoring(false);
        });
    }
    return refreshing.current;
  }, [startSession, endSession]);

  // A reload or a new tab: pick the session back up from the refresh cookie.
  useEffect(() => {
    if (restoreOnMount.current) void refreshAccessToken();
  }, [refreshAccessToken]);

  // Renew shortly before the access token expires.
  useEffect(() => {
    if (!session) return;
    const remaining = session.expiresAt - Date.now();
    const delay = Math.max(remaining - REFRESH_AHEAD_MS, remaining / 2, MIN_REFRESH_DELAY_MS);
    const timer = setTimeout(() => void refreshAccessToken(), Math.min(delay, MAX_TIMER_DELAY));
    return () => clearTimeout(timer);
  }, [session, refreshAccessToken]);

  // Signing out in another tab signs out this one too.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.onmessage = (event: MessageEvent) => {
      if (event.data === 'logout') endSession();
    };
    return () => channel.close();
  }, [endSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      epoch.current += 1;
      startSession(await signIn(credentials));
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    endSession();
    broadcastLogout();
    // Best effort: the user is signed out here even if the server can't be reached.
    void signOut().catch(() => {});
  }, [endSession]);

  const getAccessToken = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return null;
    if (current.expiresAt - Date.now() > MIN_TOKEN_LIFETIME_MS) return current.accessToken;
    return refreshAccessToken();
  }, [refreshAccessToken]);

  const status: AuthStatus = session ? 'authenticated' : restoring ? 'loading' : 'unauthenticated';

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: session?.user ?? null, login, logout, getAccessToken, refreshAccessToken }),
    [status, session, login, logout, getAccessToken, refreshAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
