import { http, HttpResponse } from 'msw';

import type { LoginResponse } from '@/features/auth/api';
import { loginFormSchema, signupFormSchema } from '@/features/auth/schemas';
import type { AuthUser } from '@/features/auth/types';

import { DEMO_USER } from '../db';
import { api, latency, problem, validationProblem } from '../utils';

interface MockAccount extends AuthUser {
  password: string;
}

/** Development sign-in for the mock API. The mock API is refused in production builds (see env.ts). */
export const DEMO_ACCOUNT: MockAccount = {
  ...DEMO_USER,
  username: 'demo',
  email: 'demo.owner@example.com',
  password: 'demo1234',
};

// Same lengths as the real API: short access tokens, renewed until the 8-hour session ends.
const ACCESS_TOKEN_SECONDS = 15 * 60;
const SESSION_MS = 8 * 60 * 60 * 1000;

// The real API keeps the session in an HttpOnly cookie, which a mock can't set. The mock keeps it
// for the tab instead, so a reload still restores it.
const MOCK_SESSION_KEY = 'finovex.mockSession';

interface MockSession {
  username: string;
  /** Epoch milliseconds. */
  endsAt: number;
}

// Accounts by username. New sign-ups last until the tab reloads.
const accounts = new Map<string, MockAccount>([[DEMO_ACCOUNT.username, DEMO_ACCOUNT]]);

const toUser = ({ id, username, name, email }: MockAccount): AuthUser => ({ id, username, name, email });

function readMockSession(): MockSession | null {
  try {
    const raw = sessionStorage.getItem(MOCK_SESSION_KEY);
    return raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    return null;
  }
}

function writeMockSession(session: MockSession | null) {
  try {
    if (session) sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(MOCK_SESSION_KEY);
  } catch {
    // Storage blocked: the mock session just won't survive a reload.
  }
}

function signedIn(account: MockAccount, endsAt: number): LoginResponse {
  return {
    accessToken: `mock-token.${account.id}.${crypto.randomUUID()}`,
    expiresIn: Math.max(0, Math.min(ACCESS_TOKEN_SECONDS, Math.floor((endsAt - Date.now()) / 1000))),
    user: toUser(account),
  };
}

export const authHandlers = [
  http.post(api('/auth/login'), async ({ request }) => {
    await latency();
    const result = loginFormSchema.safeParse(await request.json());
    if (!result.success) return validationProblem(result.error.issues);

    const account = accounts.get(result.data.username);
    if (!account || account.password !== result.data.password) {
      // Same answer for an unknown username and a wrong password, so neither can be probed.
      return problem(401, 'Sign-in failed', { code: 'INVALID_CREDENTIALS', detail: 'Incorrect username or password.' });
    }

    const endsAt = Date.now() + SESSION_MS;
    writeMockSession({ username: account.username, endsAt });
    return HttpResponse.json(signedIn(account, endsAt));
  }),

  http.post(api('/auth/refresh'), async () => {
    await latency();
    const session = readMockSession();
    const account = session && session.endsAt > Date.now() ? accounts.get(session.username) : undefined;
    if (!session || !account) {
      writeMockSession(null);
      return problem(401, 'Session ended', {
        code: 'SESSION_EXPIRED',
        detail: 'Your session has ended. Please sign in again.',
      });
    }
    return HttpResponse.json(signedIn(account, session.endsAt));
  }),

  http.post(api('/auth/logout'), async () => {
    await latency();
    writeMockSession(null);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(api('/auth/signup'), async ({ request }) => {
    await latency();
    const body = (await request.json()) as Record<string, unknown>;
    // The API receives the payload, so validate it as the form would (password confirmed, terms accepted).
    const result = signupFormSchema.safeParse({ ...body, confirmPassword: body.password, acceptTerms: true });
    if (!result.success) return validationProblem(result.error.issues);

    const { fullName, username, email, password } = result.data;
    const errors: Record<string, string[]> = {};
    if (accounts.has(username)) {
      errors.username = ['That username is taken. Try another.'];
    }
    if ([...accounts.values()].some((account) => account.email === email)) {
      errors.email = ['An account with this email already exists. Sign in instead.'];
    }
    if (Object.keys(errors).length > 0) {
      return problem(409, 'Account already exists', { code: 'ACCOUNT_EXISTS', detail: 'Some details are already in use.', errors });
    }

    const account: MockAccount = { id: `user_${crypto.randomUUID()}`, username, name: fullName, email, password };
    accounts.set(username, account);
    return HttpResponse.json({ id: account.id, username }, { status: 201 });
  }),
];
