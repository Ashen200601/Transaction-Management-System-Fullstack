import { describe, expect, it } from 'vitest';

import { newTransactionSchema, voidTransactionSchema } from './schemas';

type ParseResult =
  | { success: true }
  | { success: false; error: { issues: Array<{ path: PropertyKey[] }> } };

/** Dotted paths of every validation issue, e.g. ['lines.0.quantity']. */
function errorPaths(result: ParseResult) {
  return result.success ? [] : result.error.issues.map((issue) => issue.path.map(String).join('.'));
}

const validSale = {
  type: 'sale',
  paymentMethod: 'cash',
  customerId: null,
  originalTransactionId: null,
  note: '',
  lines: [{ productId: 'prod_0001', quantity: 2, unitPrice: 1250, discount: 0 }],
};

const withLine = (line: Partial<(typeof validSale.lines)[number]>) => ({
  ...validSale,
  lines: [{ ...validSale.lines[0], ...line }],
});

describe('newTransactionSchema', () => {
  it('accepts a valid sale', () => {
    expect(newTransactionSchema.safeParse(validSale).success).toBe(true);
  });

  it.each(['cash', 'card', 'bank_transfer', 'mobile_wallet'])('accepts payment method %s', (paymentMethod) => {
    expect(newTransactionSchema.safeParse({ ...validSale, paymentMethod }).success).toBe(true);
  });

  it('rejects an unknown payment method', () => {
    const result = newTransactionSchema.safeParse({ ...validSale, paymentMethod: 'cheque' });
    expect(errorPaths(result)).toContain('paymentMethod');
  });

  it('requires at least one line item', () => {
    const result = newTransactionSchema.safeParse({ ...validSale, lines: [] });
    expect(errorPaths(result)).toContain('lines');
  });

  it.each([0, -1, 1.5])('rejects quantity %s', (quantity) => {
    expect(errorPaths(newTransactionSchema.safeParse(withLine({ quantity })))).toContain('lines.0.quantity');
  });

  it('rejects a negative unit price', () => {
    expect(errorPaths(newTransactionSchema.safeParse(withLine({ unitPrice: -1 })))).toContain('lines.0.unitPrice');
  });

  it('rejects a discount larger than the line amount', () => {
    // 2 × 1250 = 2500, so 2501 would make the line negative.
    expect(errorPaths(newTransactionSchema.safeParse(withLine({ discount: 2501 })))).toContain('lines.0.discount');
  });

  it('requires the original transaction for a refund', () => {
    const result = newTransactionSchema.safeParse({ ...validSale, type: 'refund' });
    expect(errorPaths(result)).toContain('originalTransactionId');

    const refund = { ...validSale, type: 'refund', originalTransactionId: 'txn_0001' };
    expect(newTransactionSchema.safeParse(refund).success).toBe(true);
  });

  it('limits the note to 500 characters', () => {
    expect(newTransactionSchema.safeParse({ ...validSale, note: 'x'.repeat(500) }).success).toBe(true);
    expect(errorPaths(newTransactionSchema.safeParse({ ...validSale, note: 'x'.repeat(501) }))).toContain('note');
  });

  it('trims the note', () => {
    const result = newTransactionSchema.parse({ ...validSale, note: '  Paid in full  ' });
    expect(result.note).toBe('Paid in full');
  });
});

describe('voidTransactionSchema', () => {
  it('requires a reason', () => {
    expect(errorPaths(voidTransactionSchema.safeParse({ reason: '   ' }))).toContain('reason');
  });

  it('trims the reason', () => {
    expect(voidTransactionSchema.parse({ reason: '  Duplicate sale  ' })).toEqual({ reason: 'Duplicate sale' });
  });

  it('limits the reason to 250 characters', () => {
    expect(errorPaths(voidTransactionSchema.safeParse({ reason: 'x'.repeat(251) }))).toContain('reason');
  });
});
