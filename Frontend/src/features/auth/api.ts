import { useMutation } from '@tanstack/react-query';

import { env } from '@/config/env';
import { createHttpClient } from '@/lib/api';

import type { SignupFormValues } from './schemas';
import type { AuthUser, LoginCredentials } from './types';

// Sign-up, sign-in, refresh and sign-out work without an access token, so they skip the shared
// client: no token, no business header, and a 401 means "wrong password" or "session ended",
// not "signed out". The session itself is the refresh token in an HttpOnly cookie that the API
// sets on /auth; "include" sends it even when the API is on another origin.
const authClient = createHttpClient({ baseUrl: env.apiBaseUrl, credentials: 'include' });

export interface SignupResponse {
  id: string;
  username: string;
}

/** Sign-in and refresh both answer with this. The refresh token is never in it: it's in the cookie. */
export interface LoginResponse {
  accessToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  user: AuthUser;
}

export function signUp(values: SignupFormValues) {
  return authClient.post<SignupResponse>('/auth/signup', values);
}

export function signIn(credentials: LoginCredentials) {
  return authClient.post<LoginResponse>('/auth/login', credentials);
}

/** A new access token from the refresh cookie. Rejects with a 401 when the session has ended. */
export function refreshSession() {
  return authClient.post<LoginResponse>('/auth/refresh');
}

/** Ends the session on the server and deletes the refresh cookie. */
export function signOut() {
  return authClient.post<void>('/auth/logout');
}

export function useSignUp() {
  return useMutation({ mutationFn: signUp });
}
