import type { ReactNode } from 'react';

import { env } from '@/config/env';

import { MockAuthProvider } from './mock-auth-provider';
import { OidcAuthProvider } from './oidc-auth-provider';

/** Picks the sign-in method from VITE_AUTH_MODE. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return env.authMode === 'oidc' ? (
    <OidcAuthProvider>{children}</OidcAuthProvider>
  ) : (
    <MockAuthProvider>{children}</MockAuthProvider>
  );
}
