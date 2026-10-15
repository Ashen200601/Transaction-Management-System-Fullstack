import { describe, expect, it } from 'vitest';

import { itemFormSchema, itemSearchSchema, type ItemFormInput } from './schemas';

const validForm: ItemFormInput = {
  itemName: '  Espresso Beans 1kg ',
  itemCode: ' esp-1kg ',
  description: '  Medium roast. ',
  price: '25.5',
  unit: 'KG',
};

function errorFields(input: ItemFormInput) {
  const result = itemFormSchema.safeParse(input);
  return result.success ? [] : [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
}

describe('itemFormSchema', () => {
  it('turns the form into the API payload: trimmed, code upper-cased, price in cents', () => {
    expect(itemFormSchema.parse(validForm)).toEqual({
      itemName: 'Espresso Beans 1kg',
      itemCode: 'ESP-1KG',
      description: 'Medium roast.',
      price: 2550,
      unit: 'KG',
    });
  });

  it('sends an empty description as null', () => {
    expect(itemFormSchema.parse({ ...validForm, description: '   ' }).description).toBeNull();
  });

  it.each([
    ['0', 0],
    ['12', 1200],
    ['12.5', 1250],
    ['12.05', 1205],
    ['0.99', 99],
  ])('converts price "%s" to %i cents', (price, cents) => {
    expect(itemFormSchema.parse({ ...validForm, price }).price).toBe(cents);
  });

  it.each(['', 'abc', '-1', '12.345', '1,50'])('rejects price "%s"', (price) => {
    expect(errorFields({ ...validForm, price })).toEqual(['price']);
  });

  it.each(['', 'has space', 'a/b', 'X'.repeat(31)])('rejects item code "%s"', (itemCode) => {
    expect(errorFields({ ...validForm, itemCode })).toEqual(['itemCode']);
  });

  it('flags every missing field at once', () => {
    expect(errorFields({ itemName: '', itemCode: '', description: '', price: '', unit: '' })).toEqual([
      'itemName',
      'itemCode',
      'price',
      'unit',
    ]);
  });

  it('only accepts units from the list', () => {
    expect(errorFields({ ...validForm, unit: 'TONNE' })).toEqual(['unit']);
  });
});

describe('itemSearchSchema', () => {
  const empty = { itemCode: '', itemName: '', unit: '', minPrice: '', maxPrice: '' };

  it('turns the filters into the query: trimmed, code upper-cased, prices in cents', () => {
    expect(
      itemSearchSchema.parse({ itemCode: ' esp ', itemName: ' beans ', unit: 'KG', minPrice: '10', maxPrice: '30.5' }),
    ).toEqual({ itemCode: 'ESP', itemName: 'beans', unit: 'KG', minPrice: 1000, maxPrice: 3050 });
  });

  it('treats empty price boxes as no limit', () => {
    expect(itemSearchSchema.parse(empty)).toEqual({
      itemCode: '',
      itemName: '',
      unit: '',
      minPrice: undefined,
      maxPrice: undefined,
    });
  });

  it.each(['abc', '-1', '1.234'])('rejects price "%s"', (price) => {
    const result = itemSearchSchema.safeParse({ ...empty, minPrice: price });
    expect(result.success).toBe(false);
  });

  it('allows an equal range but not one that runs backwards', () => {
    expect(itemSearchSchema.safeParse({ ...empty, minPrice: '10', maxPrice: '10' }).success).toBe(true);
    const result = itemSearchSchema.safeParse({ ...empty, minPrice: '10', maxPrice: '9.99' });
    expect(result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))).toEqual(['maxPrice']);
  });
});
