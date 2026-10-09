import { createContext, useContext } from 'react';

import type { AuthStatus, AuthUser } from './types';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Starts sign-in, then returns the user to the in-app path `returnTo`. */
  login: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside an AuthProvider');
  return value;
}
