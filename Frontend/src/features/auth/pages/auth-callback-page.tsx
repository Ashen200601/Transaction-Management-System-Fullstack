import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';

import { ErrorState, LoadingState } from '@/components/common/states';
import { env } from '@/config/env';

import { completeOidcSignIn } from '../providers/oidc-auth-provider';

/** Where the identity provider sends the user back to after sign-in. */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (env.authMode !== 'oidc') return;
    completeOidcSignIn()
      .then((returnTo) => navigate(returnTo, { replace: true }))
      .catch(setError);
  }, [navigate]);

  if (env.authMode !== 'oidc') {
    return <Navigate replace to="/" />;
  }

  return error ? (
    <ErrorState title="Sign-in failed" error={error} onRetry={() => navigate('/login', { replace: true })} />
  ) : (
    <LoadingState label="Completing sign-in…" />
  );
}
