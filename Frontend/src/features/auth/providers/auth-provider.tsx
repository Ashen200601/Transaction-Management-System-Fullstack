import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { signIn, signOut } from '../api';
import { AuthContext, type AuthContextValue } from '../auth-context';
import { clearSession, readSession, writeSession, type Session } from '../session-store';
import type { LoginCredentials } from '../types';

// setTimeout fires immediately for delays above this (about 24.8 days).
const MAX_TIMER_DELAY = 2 ** 31 - 1;

/** Username and password sign-in against the API, with the session kept for the life of the tab. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { accessToken, expiresIn, user } = await signIn(credentials);
    const next: Session = { accessToken, expiresAt: Date.now() + expiresIn * 1000, user };
    writeSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(async () => {
    const current = sessionRef.current;
    clearSession();
    setSession(null);
    if (current && current.expiresAt > Date.now()) {
      // Best effort: the user is signed out here even if the server can't be reached.
      void signOut(current.accessToken).catch(() => {});
    }
  }, []);

  // Sign out when the token expires instead of waiting for a request to fail.
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => void logout(), Math.min(Math.max(0, session.expiresAt - Date.now()), MAX_TIMER_DELAY));
    return () => clearTimeout(timer);
  }, [session, logout]);

  const getAccessToken = useCallback(async () => {
    const current = sessionRef.current;
    return current && current.expiresAt > Date.now() ? current.accessToken : null;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: session ? 'authenticated' : 'unauthenticated',
      user: session?.user ?? null,
      login,
      logout,
      getAccessToken,
    }),
    [session, login, logout, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
