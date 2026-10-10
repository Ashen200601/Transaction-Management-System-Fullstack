import { describe, expect, it } from 'vitest';

import { buildUser } from '@/test/factories';

import { clearSession, readSession, writeSession, type Session } from './session-store';

const NOW = Date.UTC(2026, 9, 10, 9, 0);

const session: Session = { accessToken: 'token-1', expiresAt: NOW + 60_000, user: buildUser() };

describe('session store', () => {
  it('keeps a session for the life of the tab', () => {
    writeSession(session);

    expect(readSession(NOW)).toEqual(session);
    expect(localStorage.length).toBe(0);
  });

  it('drops an expired session', () => {
    writeSession(session);

    expect(readSession(session.expiresAt)).toBeNull();
    expect(readSession(NOW)).toBeNull();
  });

  it('ignores a damaged session', () => {
    sessionStorage.setItem('finovex.session', '{"accessToken":"x"}');
    expect(readSession(NOW)).toBeNull();

    sessionStorage.setItem('finovex.session', 'not json');
    expect(readSession(NOW)).toBeNull();
  });

  it('clears the session on sign-out', () => {
    writeSession(session);
    clearSession();

    expect(readSession(NOW)).toBeNull();
  });
});
