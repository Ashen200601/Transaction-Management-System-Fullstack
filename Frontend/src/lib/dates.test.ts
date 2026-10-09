import { describe, expect, it } from 'vitest';

import { formatDate, isValidIsoDate, toIsoDate } from './dates';

describe('formatDate', () => {
  it('formats an ISO timestamp as a short readable date', () => {
    expect(formatDate('2026-03-05T10:00:00Z', { timeZone: 'UTC' })).toBe('Mar 5, 2026');
  });

  it('uses the time zone to decide the calendar day', () => {
    // 23:30 UTC is already the next morning in Colombo (UTC+05:30).
    expect(formatDate('2026-03-05T23:30:00Z', { timeZone: 'UTC' })).toBe('Mar 5, 2026');
    expect(formatDate('2026-03-05T23:30:00Z', { timeZone: 'Asia/Colombo' })).toBe('Mar 6, 2026');
  });

  it('accepts Date objects', () => {
    expect(formatDate(new Date('2026-12-31T12:00:00Z'), { timeZone: 'UTC' })).toBe('Dec 31, 2026');
  });

  it('returns an empty string for missing or invalid input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('toIsoDate', () => {
  it('returns the local calendar date as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 2, 5, 23, 59))).toBe('2026-03-05');
    expect(toIsoDate(new Date(2026, 11, 1))).toBe('2026-12-01');
  });
});

describe('isValidIsoDate', () => {
  it.each(['2026-02-28', '2028-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(isValidIsoDate(value)).toBe(true);
  });

  it.each(['2026-02-29', '2026-13-01', '2026-3-5', '03/05/2026', '2026-03-05T10:00:00Z', ''])(
    'rejects "%s"',
    (value) => {
      expect(isValidIsoDate(value)).toBe(false);
    },
  );
});
