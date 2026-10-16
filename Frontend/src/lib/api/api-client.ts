// Every call the frontend makes to the backend API, grouped by module. Features use these
// through their React Query hooks (features/*/hooks.ts); nothing else calls fetch directly.

import { env } from '@/config/env';
import type { SignupFormValues } from '@/features/auth/schemas';
import type { AuthUser, LoginCredentials } from '@/features/auth/types';
import type { Business } from '@/features/business/types';
import type { ItemFormValues, ItemSearchValues } from '@/features/items/schemas';
import type { Item } from '@/features/items/types';
import type { Unit } from '@/features/units/types';

import { createHttpClient, type HttpClientConfig } from './http-client';

/* ------------------------------------------------------------------------------------------ */
/* Clients                                                                                    */
/* ------------------------------------------------------------------------------------------ */

type RuntimeConfig = Required<Pick<HttpClientConfig, 'getAccessToken' | 'refreshAccessToken' | 'onUnauthorized'>>;

const runtime: RuntimeConfig = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
  onUnauthorized: () => {},
};

/** Wires the shared client to the signed-in session. */
export function configureApiClient(config: Partial<RuntimeConfig>) {
  Object.assign(runtime, config);
}

/** For signed-in calls: sends the access token. */
export const apiClient = createHttpClient({
  baseUrl: env.apiBaseUrl,
  getAccessToken: () => runtime.getAccessToken(),
  refreshAccessToken: () => runtime.refreshAccessToken(),
  onUnauthorized: () => runtime.onUnauthorized(),
});

// Sign-up, sign-in, refresh and sign-out work without an access token, so they use their own
// client: no token, and a 401 means "wrong password" or "session ended", not "signed out".
// The session itself is the refresh token in an HttpOnly cookie that the API sets on /auth;
// "include" sends it even when the API is on another origin.
const authClient = createHttpClient({ baseUrl: env.apiBaseUrl, credentials: 'include' });

/* ------------------------------------------------------------------------------------------ */
/* Auth                                                                                       */
/* ------------------------------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------------------------------ */
/* Business                                                                                   */
/* ------------------------------------------------------------------------------------------ */

/** The business the signed-in user works in. */
export function getCurrentBusiness() {
  return apiClient.get<Business>('/businesses/current');
}

/* ------------------------------------------------------------------------------------------ */
/* Units                                                                                      */
/* ------------------------------------------------------------------------------------------ */

/** The units an item can be given, in list order. */
export function listUnits() {
  return apiClient.get<Unit[]>('/units');
}

/* ------------------------------------------------------------------------------------------ */
/* Items                                                                                      */
/* ------------------------------------------------------------------------------------------ */

/** Creates an item in the signed-in user's business. */
export function createItem(values: ItemFormValues) {
  return apiClient.post<Item>('/items', values);
}

/** The signed-in user's business's items that match the filters, ordered by item code. No filters lists them all. */
export function listItems(search: Partial<ItemSearchValues> = {}) {
  return apiClient.get<Item[]>('/items', { params: search });
}
