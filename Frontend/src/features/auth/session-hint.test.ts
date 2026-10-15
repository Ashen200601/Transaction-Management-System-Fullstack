import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearSessionHint, hasSessionHint, setSessionHint } from './session-hint';

describe('session hint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('remembers that a session may exist until it is cleared', () => {
    expect(hasSessionHint()).toBe(false);

    setSessionHint();
    expect(hasSessionHint()).toBe(true);

    clearSessionHint();
    expect(hasSessionHint()).toBe(false);
  });

  it('holds no secret, only a flag', () => {
    setSessionHint();

    expect(Object.values({ ...localStorage })).toEqual(['1']);
  });

  it('assumes a session may exist when storage is blocked, so the API is asked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(hasSessionHint()).toBe(true);
  });
});
