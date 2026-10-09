import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { AuthContext, type AuthContextValue } from '../auth-context';
import type { AuthUser } from '../types';

// Development only: signs in a fixed demo user without a password.
// parseEnv refuses this mode in production builds.

const SESSION_KEY = 'finovex.mockSession';

const DEMO_USER: AuthUser = {
  id: 'user_demo',
  name: 'Demo Owner',
  email: 'demo.owner@example.com',
};

function readSession(): AuthUser | null {
  try {
    return sessionStorage.getItem(SESSION_KEY) ? DEMO_USER : null;
  } catch {
    return null;
  }
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readSession);

  const login = useCallback(async () => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Storage blocked: the session just won't survive a reload.
    }
    setUser(DEMO_USER);
  }, []);

  const logout = useCallback(async () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing stored.
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: user ? 'authenticated' : 'unauthenticated',
      user,
      login,
      logout,
      getAccessToken: async () => (user ? 'mock-access-token' : null),
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
