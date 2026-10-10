import { describe, expect, it } from 'vitest';

import { loginFormSchema, signupFormSchema } from './schemas';

type ParseResult =
  | { success: true }
  | { success: false; error: { issues: Array<{ path: PropertyKey[] }> } };

function errorPaths(result: ParseResult) {
  return result.success ? [] : result.error.issues.map((issue) => issue.path.map(String).join('.'));
}

const validForm = {
  fullName: 'Jane Perera',
  businessName: 'Perera Traders',
  username: 'jane.perera',
  email: 'jane@perera.lk',
  password: 'secret123',
  confirmPassword: 'secret123',
  acceptTerms: true,
};

describe('loginFormSchema', () => {
  it('trims and lower-cases the username but leaves the password exactly as typed', () => {
    expect(loginFormSchema.parse({ username: ' Jane.Perera ', password: ' Secret123 ' })).toEqual({
      username: 'jane.perera',
      password: ' Secret123 ',
    });
  });

  it('requires both fields', () => {
    expect(errorPaths(loginFormSchema.safeParse({ username: '  ', password: '' }))).toEqual(['username', 'password']);
  });
});

describe('signupFormSchema', () => {
  it('turns the form into a registration payload, dropping the confirmation and consent', () => {
    expect(
      signupFormSchema.parse({ ...validForm, fullName: '  Jane Perera ', username: ' Jane.Perera ', email: ' Jane@Perera.LK ' }),
    ).toEqual({
      fullName: 'Jane Perera',
      businessName: 'Perera Traders',
      username: 'jane.perera',
      email: 'jane@perera.lk',
      password: 'secret123',
    });
  });

  it('flags every missing field at once', () => {
    const empty = {
      fullName: '',
      businessName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    };
    expect(errorPaths(signupFormSchema.safeParse(empty))).toEqual(
      expect.arrayContaining(['fullName', 'businessName', 'username', 'email', 'password', 'confirmPassword', 'acceptTerms']),
    );
  });

  it.each(['jp', 'jane perera', 'jane@perera', 'x'.repeat(31)])('rejects username "%s"', (username) => {
    expect(errorPaths(signupFormSchema.safeParse({ ...validForm, username }))).toContain('username');
  });

  it.each(['jane', 'jane@', '@perera.lk', 'jane perera@x.lk'])('rejects email "%s"', (email) => {
    expect(errorPaths(signupFormSchema.safeParse({ ...validForm, email }))).toContain('email');
  });

  it.each(['short1', 'longpassword', '12345678'])('rejects weak password "%s"', (password) => {
    expect(errorPaths(signupFormSchema.safeParse({ ...validForm, password, confirmPassword: password }))).toContain(
      'password',
    );
  });

  it('requires the passwords to match, even while other fields need attention', () => {
    const result = signupFormSchema.safeParse({ ...validForm, fullName: '', confirmPassword: 'secret124' });
    expect(errorPaths(result)).toEqual(expect.arrayContaining(['fullName', 'confirmPassword']));
  });

  it('requires the terms to be accepted', () => {
    expect(errorPaths(signupFormSchema.safeParse({ ...validForm, acceptTerms: false }))).toEqual(['acceptTerms']);
  });
});
