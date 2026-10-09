import { describe, expect, it } from 'vitest';

import { createIdempotencyKey } from './id';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('createIdempotencyKey', () => {
  it('returns a lowercase UUID v4', () => {
    expect(createIdempotencyKey()).toMatch(UUID_V4);
  });

  it('returns a different key on every call', () => {
    const keys = new Set(Array.from({ length: 500 }, () => createIdempotencyKey()));
    expect(keys.size).toBe(500);
  });
});
