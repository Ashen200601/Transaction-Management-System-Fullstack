import { useMutation } from '@tanstack/react-query';

import { env } from '@/config/env';
import { createHttpClient } from '@/lib/api';

import type { SignupFormValues } from './schemas';
import type { AuthUser, LoginCredentials } from './types';

// Sign-in and sign-up happen before there is a session, so they skip the shared
// client: no token, no business header, and a 401 means "wrong password", not "signed out".
const authClient = createHttpClient({ baseUrl: env.apiBaseUrl });

export interface RegisteredAccount {
  id: string;
  username: string;
}

export interface LoginResponse {
  accessToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  user: AuthUser;
}

export function registerAccount(values: SignupFormValues) {
  return authClient.post<RegisteredAccount>('/auth/register', values);
}

export function signIn(credentials: LoginCredentials) {
  return authClient.post<LoginResponse>('/auth/login', credentials);
}

/** Ends the session on the server too. */
export function signOut(accessToken: string) {
  return authClient.post<void>('/auth/logout', undefined, { headers: { Authorization: `Bearer ${accessToken}` } });
}

export function useRegisterAccount() {
  return useMutation({ mutationFn: registerAccount });
}
