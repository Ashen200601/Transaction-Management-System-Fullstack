import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { env } from '@/config/env';

import { AuthContext, type AuthContextValue } from '../auth-context';
import { sanitizeReturnTo } from '../return-to';
import type { AuthStatus, AuthUser } from '../types';

let userManager: UserManager | null = null;

function getUserManager() {
  if (!env.oidc) throw new Error('OIDC is not configured (see VITE_OIDC_* in .env.example).');
  userManager ??= new UserManager({
    authority: env.oidc.authority,
    client_id: env.oidc.clientId,
    redirect_uri: env.oidc.redirectUri,
    post_logout_redirect_uri: window.location.origin,
    response_type: 'code',
    scope: 'openid profile email',
    automaticSilentRenew: true,
    // Tokens live only as long as the tab, never in localStorage.
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  });
  return userManager;
}

function toAuthUser(user: User): AuthUser {
  const { sub, name, preferred_username: username, email } = user.profile;
  return { id: sub, name: name ?? username ?? email ?? sub, email: email ?? '' };
}

let pendingCallback: Promise<string> | null = null;

/**
 * Finishes the redirect back from the identity provider and returns the
 * in-app path to continue to. Safe to call twice (React StrictMode).
 */
export function completeOidcSignIn(): Promise<string> {
  pendingCallback ??= getUserManager()
    .signinRedirectCallback()
    .then((user) => {
      const state = user.state as { returnTo?: string } | undefined;
      return sanitizeReturnTo(state?.returnTo);
    });
  return pendingCallback;
}

export function OidcAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const manager = getUserManager();
    const onLoaded = (loaded: User) => {
      setUser(loaded);
      setStatus('authenticated');
    };
    const onUnloaded = () => {
      setUser(null);
      setStatus('unauthenticated');
    };

    manager.events.addUserLoaded(onLoaded);
    manager.events.addUserUnloaded(onUnloaded);
    manager.events.addSilentRenewError(onUnloaded);

    manager
      .getUser()
      .then((existing) => (existing && !existing.expired ? onLoaded(existing) : onUnloaded()))
      .catch(onUnloaded);

    return () => {
      manager.events.removeUserLoaded(onLoaded);
      manager.events.removeUserUnloaded(onUnloaded);
      manager.events.removeSilentRenewError(onUnloaded);
    };
  }, []);

  const login = useCallback(async (returnTo?: string) => {
    await getUserManager().signinRedirect({ state: { returnTo: sanitizeReturnTo(returnTo) } });
  }, []);

  const logout = useCallback(async () => {
    await getUserManager().signoutRedirect();
  }, []);

  const getAccessToken = useCallback(async () => {
    const current = await getUserManager().getUser();
    return current && !current.expired ? current.access_token : null;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: user ? toAuthUser(user) : null, login, logout, getAccessToken }),
    [status, user, login, logout, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
