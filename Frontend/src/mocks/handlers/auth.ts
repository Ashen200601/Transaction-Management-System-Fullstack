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

const SESSION_SECONDS = 8 * 60 * 60;

// Accounts by username. New sign-ups last until the tab reloads.
const accounts = new Map<string, MockAccount>([[DEMO_ACCOUNT.username, DEMO_ACCOUNT]]);

const toUser = ({ id, username, name, email }: MockAccount): AuthUser => ({ id, username, name, email });

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

    const response: LoginResponse = {
      accessToken: `mock-token.${account.id}.${crypto.randomUUID()}`,
      expiresIn: SESSION_SECONDS,
      user: toUser(account),
    };
    return HttpResponse.json(response);
  }),

  http.post(api('/auth/logout'), async () => {
    await latency();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(api('/auth/register'), async ({ request }) => {
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
