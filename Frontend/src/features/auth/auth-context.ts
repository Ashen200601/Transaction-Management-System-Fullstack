import { createContext, useContext } from 'react';

import type { AuthStatus, AuthUser, LoginCredentials } from './types';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Checks the username and password with the API and starts a session. Rejects on failure. */
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside an AuthProvider');
  return value;
}
