import { describe, expect, it } from 'vitest';

import { stakeholderFormSchema, stakeholderSearchSchema, type StakeholderFormInput } from './schemas';

const validForm: StakeholderFormInput = {
  stakeholderTypeIds: ['1', '2'],
  stakeholderCode: ' abc-traders ',
  stakeholderName: '  ABC Traders ',
  phone: ' +94 77 123 4567 ',
  email: ' accounts@abc.com ',
  address: '  ',
  taxNo: ' VAT-1 ',
};

function errorFields(input: StakeholderFormInput) {
  const result = stakeholderFormSchema.safeParse(input);
  return result.success ? [] : [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
}

describe('stakeholderFormSchema', () => {
  it('turns the form into the API payload: trimmed, code upper-cased, empty boxes null', () => {
    expect(stakeholderFormSchema.parse(validForm)).toEqual({
      stakeholderTypeIds: ['1', '2'],
      stakeholderCode: 'ABC-TRADERS',
      stakeholderName: 'ABC Traders',
      phone: '+94 77 123 4567',
      email: 'accounts@abc.com',
      address: null,
      taxNo: 'VAT-1',
    });
  });

  it('flags every missing required field at once, the types first', () => {
    expect(
      errorFields({ ...validForm, stakeholderTypeIds: [], stakeholderCode: '', stakeholderName: '' }),
    ).toEqual(['stakeholderTypeIds', 'stakeholderCode', 'stakeholderName']);
  });

  it.each(['abc', '077-123 x'])('rejects phone "%s"', (phone) => {
    expect(errorFields({ ...validForm, phone })).toEqual(['phone']);
  });

  it('rejects an email without a domain', () => {
    expect(errorFields({ ...validForm, email: 'accounts@' })).toEqual(['email']);
  });
});

describe('stakeholderSearchSchema', () => {
  it('trims the filters and upper-cases the code', () => {
    expect(
      stakeholderSearchSchema.parse({ stakeholderCode: ' abc ', stakeholderName: ' traders ', stakeholderTypeId: '2' }),
    ).toEqual({ stakeholderCode: 'ABC', stakeholderName: 'traders', stakeholderTypeId: '2' });
  });
});
