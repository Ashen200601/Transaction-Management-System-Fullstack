import { describe, expect, it } from 'vitest';

import { calculateLineTotal, calculateTransactionTotals } from './totals';

describe('calculateLineTotal', () => {
  it('multiplies quantity by unit price and subtracts the discount', () => {
    expect(calculateLineTotal({ quantity: 3, unitPrice: 250, discount: 50 })).toBe(700);
  });

  it('treats a missing discount as zero', () => {
    expect(calculateLineTotal({ quantity: 2, unitPrice: 999 })).toBe(1998);
  });

  it('never goes below zero', () => {
    expect(calculateLineTotal({ quantity: 1, unitPrice: 500, discount: 800 })).toBe(0);
  });
});

describe('calculateTransactionTotals', () => {
  it('returns zeros for an empty cart', () => {
    expect(calculateTransactionTotals([], { taxRatePercent: 10 })).toEqual({
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
    });
  });

  it('adds up lines and discounts, then taxes the discounted amount', () => {
    const totals = calculateTransactionTotals(
      [
        { quantity: 2, unitPrice: 1000, discount: 0 },
        { quantity: 1, unitPrice: 550, discount: 50 },
      ],
      { taxRatePercent: 10 },
    );

    expect(totals).toEqual({ subtotal: 2550, discount: 50, tax: 250, total: 2750 });
  });

  it('rounds tax to whole minor units, half away from zero', () => {
    expect(calculateTransactionTotals([{ quantity: 1, unitPrice: 1005 }], { taxRatePercent: 10 })).toEqual({
      subtotal: 1005,
      discount: 0,
      tax: 101,
      total: 1106,
    });
  });

  it('charges no tax when the rate is zero', () => {
    expect(calculateTransactionTotals([{ quantity: 4, unitPrice: 500 }], { taxRatePercent: 0 })).toEqual({
      subtotal: 2000,
      discount: 0,
      tax: 0,
      total: 2000,
    });
  });

  it('keeps every figure a whole number of minor units', () => {
    const totals = calculateTransactionTotals(
      [
        { quantity: 3, unitPrice: 333, discount: 7 },
        { quantity: 7, unitPrice: 129 },
        { quantity: 1, unitPrice: 1 },
      ],
      { taxRatePercent: 8.875 },
    );

    for (const value of Object.values(totals)) {
      expect(Number.isInteger(value)).toBe(true);
    }
    expect(totals.total).toBe(totals.subtotal - totals.discount + totals.tax);
  });
});
