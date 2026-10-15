import { render, screen, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { vi } from 'vitest';

import { ToastProvider } from '@/components/ui/toast';
import { AuthContext, type AuthContextValue } from '@/features/auth/auth-context';

import { buildUser } from './factories';

export * from '@testing-library/react';
export { userEvent };

/** A signed-in user by default. Pass `{ status: 'unauthenticated', user: null }` for a guest. */
export function createAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'authenticated',
    user: buildUser(),
    login: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    getAccessToken: vi.fn(async () => 'test-access-token'),
    refreshAccessToken: vi.fn(async () => 'test-access-token'),
    ...overrides,
  };
}

/** Mirrors the router location into the DOM so tests can assert navigation. */
function LocationProbe() {
  const { pathname, search, hash } = useLocation();
  return <div hidden data-testid="router-location">{`${pathname}${search}${hash}`}</div>;
}

/** The in-memory router's current URL, e.g. `currentLocation().searchParams.get('page')`. */
export function currentLocation() {
  return new URL(screen.getByTestId('router-location').textContent ?? '/', 'http://localhost');
}

interface ProviderOptions {
  auth?: Partial<AuthContextValue>;
  /** Initial URL, e.g. '/login?returnTo=%2F'. */
  route?: string;
}

function createProviders({ auth, route = '/' }: ProviderOptions) {
  const authValue = createAuthValue(auth);

  function Providers({ children }: { children: ReactNode }) {
    return (
      <ToastProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={[route]}>
            {children}
            <LocationProbe />
          </MemoryRouter>
        </AuthContext.Provider>
      </ToastProvider>
    );
  }

  return { Providers, auth: authValue };
}

interface RenderWithProvidersOptions extends ProviderOptions, Omit<RenderOptions, 'wrapper'> {
  /** Route pattern the UI is mounted at, e.g. '/login'. Defaults to '*'. */
  path?: string;
  /** Sibling routes to land on after a redirect, e.g. `{ '/login': <h1>Sign in</h1> }`. */
  routes?: Record<string, ReactNode>;
}

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { auth, route, path = '*', routes = {}, ...renderOptions } = options;
  const providers = createProviders({ auth, route });
  const user = userEvent.setup();

  const view = render(
    <Routes>
      <Route path={path} element={ui} />
      {Object.entries(routes).map(([routePath, element]) => (
        <Route key={routePath} path={routePath} element={element} />
      ))}
    </Routes>,
    { wrapper: providers.Providers, ...renderOptions },
  );

  return {
    ...view,
    user,
    auth: providers.auth,
  };
}
