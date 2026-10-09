import { describe, expect, it } from 'vitest';

import { formatMoney, fromMinorUnits, percentageOf, sumMinorUnits, toMinorUnits } from './money';

// Money is stored and calculated as integer minor units (cents) so totals
// never pick up floating-point drift. Conversion happens only at the edges.

describe('toMinorUnits', () => {
  it.each([
    [12.34, 1234],
    ['12.34', 1234],
    ['12', 1200],
    [0.1 + 0.2, 30],
    [19.999, 2000],
    [0, 0],
    [-5.5, -550],
  ])('converts %s to %i', (amount, expected) => {
    expect(toMinorUnits(amount)).toBe(expected);
  });

  it.each(['', 'abc', '12.3.4', Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid amount %s',
    (amount) => {
      expect(() => toMinorUnits(amount)).toThrow(RangeError);
    },
  );
});

describe('fromMinorUnits', () => {
  it.each([
    [1234, 12.34],
    [-550, -5.5],
    [0, 0],
  ])('converts %i to %s', (minor, expected) => {
    expect(fromMinorUnits(minor)).toBe(expected);
  });
});

describe('formatMoney', () => {
  it('formats minor units in the given currency', () => {
    expect(formatMoney(1234, 'USD')).toBe('$12.34');
  });

  it('adds thousands separators', () => {
    expect(formatMoney(123456789, 'USD')).toBe('$1,234,567.89');
  });

  it('formats zero and negative amounts', () => {
    expect(formatMoney(0, 'USD')).toBe('$0.00');
    expect(formatMoney(-1250, 'USD')).toBe('-$12.50');
  });

  it('respects the locale', () => {
    // Intl uses non-breaking spaces; compare with plain ones.
    expect(formatMoney(1234, 'EUR', 'de-DE').replace(/\s/g, ' ')).toBe('12,34 €');
  });
});

describe('sumMinorUnits', () => {
  it('adds amounts', () => {
    expect(sumMinorUnits([100, 250, -50])).toBe(300);
  });

  it('returns 0 for no amounts', () => {
    expect(sumMinorUnits([])).toBe(0);
  });

  it('refuses fractional minor units', () => {
    expect(() => sumMinorUnits([100, 1.5])).toThrow(RangeError);
  });
});

describe('percentageOf', () => {
  it('calculates a percentage of an amount', () => {
    expect(percentageOf(10000, 15)).toBe(1500);
  });

  it('supports fractional rates', () => {
    expect(percentageOf(2000, 8.25)).toBe(165);
  });

  it('rounds half away from zero to whole minor units', () => {
    expect(percentageOf(1004, 10)).toBe(100);
    expect(percentageOf(1005, 10)).toBe(101);
    expect(percentageOf(-1005, 10)).toBe(-101);
  });
});
