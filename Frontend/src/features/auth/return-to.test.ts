import { describe, expect, it } from 'vitest';

import { sanitizeReturnTo } from './return-to';

// The ?returnTo= value comes from the URL, so anyone can craft it. Only
// same-origin paths are allowed back through, or sign-in becomes an open redirect.

describe('sanitizeReturnTo', () => {
  it.each(['/transactions', '/transactions?page=2&status=voided', '/products/prod_1#pricing'])(
    'keeps the in-app path %s',
    (path) => {
      expect(sanitizeReturnTo(path)).toBe(path);
    },
  );

  it.each([
    null,
    undefined,
    '',
    'transactions',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    '/login',
    '/login?returnTo=%2Fproducts',
  ])('falls back to "/" for %s', (value) => {
    expect(sanitizeReturnTo(value)).toBe('/');
  });
});
