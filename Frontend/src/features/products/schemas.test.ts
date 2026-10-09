import { describe, expect, it } from 'vitest';

import { productFormSchema } from './schemas';

type ParseResult =
  | { success: true }
  | { success: false; error: { issues: Array<{ path: PropertyKey[] }> } };

function errorPaths(result: ParseResult) {
  return result.success ? [] : result.error.issues.map((issue) => issue.path.map(String).join('.'));
}

// Raw values as they come out of the form inputs.
const validForm = {
  name: 'Espresso Beans 1kg',
  sku: 'ESP-1KG',
  price: '25.00',
  cost: '14.00',
  reorderLevel: '5',
  active: true,
};

describe('productFormSchema', () => {
  it('converts form input into a product payload with prices in minor units', () => {
    expect(productFormSchema.parse(validForm)).toEqual({
      name: 'Espresso Beans 1kg',
      sku: 'ESP-1KG',
      price: 2500,
      cost: 1400,
      reorderLevel: 5,
      active: true,
    });
  });

  it('trims the name and rejects a blank one', () => {
    expect(productFormSchema.parse({ ...validForm, name: '  Oat Milk 1L  ' }).name).toBe('Oat Milk 1L');
    expect(errorPaths(productFormSchema.safeParse({ ...validForm, name: '   ' }))).toContain('name');
  });

  it('upper-cases the SKU', () => {
    expect(productFormSchema.parse({ ...validForm, sku: 'esp-1kg' }).sku).toBe('ESP-1KG');
  });

  it.each(['E', 'ESP 1KG', 'ESP_1KG', 'X'.repeat(33)])('rejects SKU "%s"', (sku) => {
    expect(errorPaths(productFormSchema.safeParse({ ...validForm, sku }))).toContain('sku');
  });

  it.each(['', 'abc', '-1', '12.345'])('rejects price "%s"', (price) => {
    expect(errorPaths(productFormSchema.safeParse({ ...validForm, price }))).toContain('price');
  });

  it('allows the cost to be left empty', () => {
    expect(productFormSchema.parse({ ...validForm, cost: '' }).cost).toBeNull();
  });

  it.each(['-1', '1.5', 'abc'])('rejects reorder level "%s"', (reorderLevel) => {
    expect(errorPaths(productFormSchema.safeParse({ ...validForm, reorderLevel }))).toContain('reorderLevel');
  });
});
