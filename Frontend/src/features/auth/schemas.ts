import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;

const username = z.string().trim().toLowerCase();

/** Sign-in form. The username is matched case-insensitively. */
export const loginFormSchema = z.object({
  username: username.min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});

export type LoginFormInput = z.input<typeof loginFormSchema>;

/** Sign-up form: raw input in, the registration payload out (confirmation and consent are checked, then dropped). */
export const signupFormSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(100, 'Keep your name under 100 characters'),
    businessName: z
      .string()
      .trim()
      .min(2, 'Enter your business name')
      .max(120, 'Keep the business name under 120 characters'),
    username: username.regex(/^[a-z0-9._-]{3,30}$/, 'Use 3–30 letters, numbers, dots, dashes or underscores'),
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address, like name@company.com')),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
      .max(128, 'Keep the password under 128 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/\d/, 'Include at least one number'),
    confirmPassword: z.string().min(1, 'Re-enter your password'),
    acceptTerms: z.boolean().refine((accepted) => accepted, 'Accept the terms to create an account'),
  })
  .refine((values) => values.confirmPassword === '' || values.confirmPassword === values.password, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .transform(({ fullName, businessName, username, email, password }) => ({
    fullName,
    businessName,
    username,
    email,
    password,
  }));

export type SignupFormInput = z.input<typeof signupFormSchema>;
export type SignupFormValues = z.output<typeof signupFormSchema>;
