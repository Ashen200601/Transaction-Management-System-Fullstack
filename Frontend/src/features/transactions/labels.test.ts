import { describe, expect, it } from 'vitest';

import { paymentMethodLabel, transactionStatusLabel, transactionTypeLabel } from './labels';

describe('transaction labels', () => {
  it.each([
    ['pending', 'Pending'],
    ['completed', 'Completed'],
    ['voided', 'Voided'],
  ] as const)('labels status %s as "%s"', (status, label) => {
    expect(transactionStatusLabel(status)).toBe(label);
  });

  it.each([
    ['cash', 'Cash'],
    ['card', 'Card'],
    ['bank_transfer', 'Bank transfer'],
    ['mobile_wallet', 'Mobile wallet'],
  ] as const)('labels payment method %s as "%s"', (method, label) => {
    expect(paymentMethodLabel(method)).toBe(label);
  });

  it.each([
    ['sale', 'Sale'],
    ['refund', 'Refund'],
  ] as const)('labels type %s as "%s"', (type, label) => {
    expect(transactionTypeLabel(type)).toBe(label);
  });
});
