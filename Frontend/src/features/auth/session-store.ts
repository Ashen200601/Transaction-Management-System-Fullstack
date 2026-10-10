import { z } from 'zod';

const SESSION_KEY = 'finovex.session';

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  /** Epoch milliseconds. */
  expiresAt: z.number(),
  user: z.object({ id: z.string(), username: z.string(), name: z.string(), email: z.string() }),
});

export type Session = z.infer<typeof sessionSchema>;

// The session lives in sessionStorage: it ends with the tab and is never kept in localStorage.

/** The stored session, or null when there is none, it has expired, or it is unreadable. */
export function readSession(now = Date.now()): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const result = sessionSchema.safeParse(JSON.parse(raw));
    if (!result.success || result.data.expiresAt <= now) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

export function writeSession(session: Session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked: the session just won't survive a reload.
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing stored.
  }
}
