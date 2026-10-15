import { createContext, useContext } from 'react';

import type { AuthStatus, AuthUser, LoginCredentials } from './types';

export interface AuthContextValue {
  /** "loading" while an earlier session is being restored from the refresh cookie. */
  status: AuthStatus;
  user: AuthUser | null;
  /** Checks the username and password with the API and starts a session. Rejects on failure. */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Signs out here, in the other tabs, and on the server. */
  logout: () => Promise<void>;
  /** A valid access token, renewed first if it's about to expire; null when signed out. */
  getAccessToken: () => Promise<string | null>;
  /** Renews the access token now. Null, and signed out, when the session has ended. */
  refreshAccessToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside an AuthProvider');
  return value;
}
