import { CircleAlert, CircleCheck, Lock, LogIn, User, type LucideIcon } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { env } from '@/config/env';
import { getErrorMessage, isApiError } from '@/lib/api/errors';
import { issuesToFieldErrors } from '@/lib/form-errors';

import { useAuth } from '../auth-context';
import { AuthLayout } from '../components/auth-layout';
import { sanitizeReturnTo } from '../return-to';
import { loginFormSchema, type LoginFormInput } from '../schemas';

/** A control with an icon at its start. The control needs `pl-10`. */
function WithIcon({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="relative">
      <Icon aria-hidden className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      {children}
    </div>
  );
}

function signInErrorMessage(error: unknown) {
  // A 401 here means the credentials were wrong. Never say which one, so usernames can't be probed.
  return isApiError(error) && error.status === 401 ? 'Incorrect username or password.' : getErrorMessage(error);
}

export function LoginPage() {
  const { status, login } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const returnTo = sanitizeReturnTo(searchParams.get('returnTo'));
  const justRegistered = (location.state as { registered?: boolean } | null)?.registered === true;

  const [values, setValues] = useState<LoginFormInput>({ username: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<unknown>(null);
  const [isPending, setIsPending] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);

  if (status === 'authenticated') {
    return <Navigate replace to={returnTo} />;
  }

  const set = (key: keyof LoginFormInput, value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setError(null);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = loginFormSchema.safeParse(values);
    if (!result.success) {
      setFieldErrors(issuesToFieldErrors(result.error.issues));
      return;
    }
    setFieldErrors({});
    setIsPending(true);
    try {
      await login(result.data);
      // Signed in: the status change re-renders this page into a redirect to returnTo.
    } catch (caught) {
      setError(caught);
      setValues((previous) => ({ ...previous, password: '' }));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthLayout>
      <div className="grid gap-8">
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-primary">Welcome back</p>
          <h1 className="text-3xl font-semibold tracking-tight">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">Enter your username and password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid gap-5">
          {error !== null ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {signInErrorMessage(error)}
            </p>
          ) : (
            justRegistered && (
              <p
                role="status"
                className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2.5 text-sm text-success"
              >
                <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
                Your account is ready. Sign in to continue.
              </p>
            )
          )}

          <FormField label="Username" error={fieldErrors.username}>
            {(control) => (
              <WithIcon icon={User}>
                <Input
                  {...control}
                  className="h-11 pl-10"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="jane.perera"
                  value={values.username}
                  onChange={(event) => set('username', event.target.value)}
                  autoFocus
                />
              </WithIcon>
            )}
          </FormField>

          <FormField
            label="Password"
            error={fieldErrors.password}
            labelAction={
              <button
                type="button"
                aria-expanded={showResetHelp}
                onClick={() => setShowResetHelp((shown) => !shown)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            }
          >
            {(control) => (
              <WithIcon icon={Lock}>
                <PasswordInput
                  {...control}
                  className="h-11 pl-10"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={(event) => set('password', event.target.value)}
                />
              </WithIcon>
            )}
          </FormField>

          {showResetHelp && (
            <p className="-mt-2 rounded-md bg-accent px-3 py-2.5 text-sm text-accent-foreground">
              Self-service password reset isn't available yet. Ask your business owner or administrator to reset it for you.
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            <LogIn aria-hidden />
            {isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="grid gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
          {env.enableMocks && (
            <p className="text-xs text-muted-foreground">Development mode: the demo sign-in is in src/mocks/handlers/auth.ts.</p>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
