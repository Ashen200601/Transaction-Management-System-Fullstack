import { describe, expect, it } from 'vitest';

import { reviewedDocumentSchema } from './schemas';

type ParseResult =
  | { success: true }
  | { success: false; error: { issues: Array<{ path: PropertyKey[] }> } };

function errorPaths(result: ParseResult) {
  return result.success ? [] : result.error.issues.map((issue) => issue.path.map(String).join('.'));
}

// A supplier receipt after a person has reviewed the OCR output.
// 4 × 1400 + 12 × 250 = 8600 subtotal; 8600 + 860 tax = 9460 total.
const validReceipt = {
  vendorName: 'Harbor Wholesale Supplies',
  documentDate: '2026-03-05',
  currency: 'USD',
  lines: [
    { description: 'Espresso Beans 1kg', quantity: 4, unitPrice: 1400 },
    { description: 'Oat Milk 1L', quantity: 12, unitPrice: 250 },
  ],
  subtotal: 8600,
  tax: 860,
  total: 9460,
};

describe('reviewedDocumentSchema', () => {
  it('accepts a receipt whose figures add up', () => {
    expect(reviewedDocumentSchema.safeParse(validReceipt).success).toBe(true);
  });

  it('trims the vendor name and requires one', () => {
    expect(reviewedDocumentSchema.parse({ ...validReceipt, vendorName: '  Harbor Wholesale  ' }).vendorName).toBe(
      'Harbor Wholesale',
    );
    expect(errorPaths(reviewedDocumentSchema.safeParse({ ...validReceipt, vendorName: '  ' }))).toContain('vendorName');
  });

  it('rejects an impossible date', () => {
    expect(errorPaths(reviewedDocumentSchema.safeParse({ ...validReceipt, documentDate: '2026-02-30' }))).toContain(
      'documentDate',
    );
  });

  it('upper-cases the currency and requires a 3-letter code', () => {
    expect(reviewedDocumentSchema.parse({ ...validReceipt, currency: 'usd' }).currency).toBe('USD');
    expect(errorPaths(reviewedDocumentSchema.safeParse({ ...validReceipt, currency: 'US' }))).toContain('currency');
    expect(errorPaths(reviewedDocumentSchema.safeParse({ ...validReceipt, currency: 'DOLLARS' }))).toContain(
      'currency',
    );
  });

  it('requires at least one line', () => {
    const result = reviewedDocumentSchema.safeParse({ ...validReceipt, lines: [], subtotal: 0, tax: 0, total: 0 });
    expect(errorPaths(result)).toContain('lines');
  });

  it('flags a subtotal that does not match the lines', () => {
    const result = reviewedDocumentSchema.safeParse({ ...validReceipt, subtotal: 8500, total: 9360 });
    expect(errorPaths(result)).toContain('subtotal');
  });

  it('flags a total that is not subtotal plus tax', () => {
    const result = reviewedDocumentSchema.safeParse({ ...validReceipt, total: 9999 });
    expect(errorPaths(result)).toContain('total');
  });
});
