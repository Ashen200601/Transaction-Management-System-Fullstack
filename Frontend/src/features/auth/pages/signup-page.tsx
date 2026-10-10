import { UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { getErrorMessage, isApiError } from '@/lib/api/errors';
import { apiFieldErrors, issuesToFieldErrors } from '@/lib/form-errors';

import { useRegisterAccount } from '../api';
import { useAuth } from '../auth-context';
import { AuthLayout } from '../components/auth-layout';
import { PASSWORD_MIN_LENGTH, signupFormSchema, type SignupFormInput } from '../schemas';

const EMPTY_FORM: SignupFormInput = {
  fullName: '',
  businessName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
};

export function SignupPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const registration = useRegisterAccount();

  if (status === 'authenticated') {
    return <Navigate replace to="/" />;
  }

  const set = <K extends keyof SignupFormInput>(key: K, value: SignupFormInput[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = signupFormSchema.safeParse(values);
    if (!result.success) {
      setErrors(issuesToFieldErrors(result.error.issues));
      return;
    }
    setErrors({});
    registration.mutate(result.data, {
      onSuccess: () => navigate('/login', { replace: true, state: { registered: true } }),
      onError: (error) => {
        if (isApiError(error)) setErrors(apiFieldErrors(error.fieldErrors));
      },
    });
  }

  const showGeneralError =
    registration.isError && !(isApiError(registration.error) && Object.keys(registration.error.fieldErrors).length > 0);
  const termsErrorId = 'signup-terms-error';

  return (
    <AuthLayout>
      <div className="grid gap-8">
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-primary">Get started</p>
          <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Set up your business to start managing sales, stock and receipts in one place.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full name" error={errors.fullName}>
              {(control) => (
                <Input
                  {...control}
                  className="h-11"
                  autoComplete="name"
                  placeholder="Jane Perera"
                  value={values.fullName}
                  onChange={(event) => set('fullName', event.target.value)}
                  autoFocus
                />
              )}
            </FormField>

            <FormField label="Business name" error={errors.businessName}>
              {(control) => (
                <Input
                  {...control}
                  className="h-11"
                  autoComplete="organization"
                  placeholder="Perera Traders"
                  value={values.businessName}
                  onChange={(event) => set('businessName', event.target.value)}
                />
              )}
            </FormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Username" error={errors.username} hint="You'll use this to sign in.">
              {(control) => (
                <Input
                  {...control}
                  className="h-11"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="jane.perera"
                  value={values.username}
                  onChange={(event) => set('username', event.target.value)}
                />
              )}
            </FormField>

            <FormField label="Work email" error={errors.email}>
              {(control) => (
                <Input
                  {...control}
                  className="h-11"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={values.email}
                  onChange={(event) => set('email', event.target.value)}
                />
              )}
            </FormField>
          </div>

          <FormField
            label="Password"
            error={errors.password}
            hint={`At least ${PASSWORD_MIN_LENGTH} characters, including a letter and a number.`}
          >
            {(control) => (
              <PasswordInput
                {...control}
                className="h-11"
                autoComplete="new-password"
                value={values.password}
                onChange={(event) => set('password', event.target.value)}
              />
            )}
          </FormField>

          <FormField label="Confirm password" error={errors.confirmPassword}>
            {(control) => (
              <PasswordInput
                {...control}
                className="h-11"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={(event) => set('confirmPassword', event.target.value)}
              />
            )}
          </FormField>

          <div className="grid gap-1.5">
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                checked={values.acceptTerms}
                aria-invalid={errors.acceptTerms ? true : undefined}
                aria-describedby={errors.acceptTerms ? termsErrorId : undefined}
                onChange={(event) => set('acceptTerms', event.target.checked)}
              />
              <span>I agree to the Finovex Solutions terms of service and privacy policy.</span>
            </label>
            {errors.acceptTerms && (
              <p id={termsErrorId} className="pl-7 text-xs text-destructive">
                {errors.acceptTerms}
              </p>
            )}
          </div>

          {showGeneralError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {getErrorMessage(registration.error)}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={registration.isPending}>
            <UserPlus aria-hidden />
            {registration.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
