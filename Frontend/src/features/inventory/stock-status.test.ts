import { describe, expect, it } from 'vitest';

import { getStockStatus, stockStatusLabel } from './stock-status';

describe('getStockStatus', () => {
  it.each([
    [0, 5, 'out_of_stock'],
    [-2, 5, 'out_of_stock'],
    [3, 5, 'low_stock'],
    [5, 5, 'low_stock'],
    [6, 5, 'in_stock'],
    [0, 0, 'out_of_stock'],
    [1, 0, 'in_stock'],
  ] as const)('%i on hand with reorder level %i is %s', (onHand, reorderLevel, expected) => {
    expect(getStockStatus(onHand, reorderLevel)).toBe(expected);
  });
});

describe('stockStatusLabel', () => {
  it.each([
    ['out_of_stock', 'Out of stock'],
    ['low_stock', 'Low stock'],
    ['in_stock', 'In stock'],
  ] as const)('labels %s as "%s"', (status, label) => {
    expect(stockStatusLabel(status)).toBe(label);
  });
});
