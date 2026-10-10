import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/server';
import { renderWithProviders, screen } from '@/test/test-utils';

import { LoginPage } from './login-page';
import { SignupPage } from './signup-page';

const guest = { status: 'unauthenticated', user: null } as const;

function renderPage() {
  return renderWithProviders(<SignupPage />, {
    route: '/signup',
    path: '/signup',
    auth: guest,
    routes: { '/login': <LoginPage /> },
  });
}

async function fillForm(user: ReturnType<typeof renderPage>['user'], overrides: { email?: string } = {}) {
  const fields = {
    'Full name': 'Jane Perera',
    'Business name': 'Perera Traders',
    Username: 'Jane.Perera',
    'Work email': overrides.email ?? 'Jane@Perera.lk',
    Password: 'secret123',
    'Confirm password': 'secret123',
  };
  // Pasting keeps this long form quick to fill; typing is covered by the validation tests.
  for (const [label, value] of Object.entries(fields)) {
    await user.click(screen.getByLabelText(label));
    await user.paste(value);
  }
  await user.click(screen.getByRole('checkbox', { name: /terms of service/i }));
}

describe('SignupPage', () => {
  it('shows the company details beside the form', () => {
    renderPage();

    expect(screen.getAllByText('Finovex Solutions').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
  });

  it('points out what needs fixing without calling the API', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByLabelText('Full name')).toHaveAccessibleDescription('Enter your full name');
    expect(screen.getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('checkbox', { name: /terms of service/i })).toHaveAccessibleDescription(
      'Accept the terms to create an account',
    );
  });

  it('catches a mistyped password confirmation', async () => {
    const { user } = renderPage();

    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.type(screen.getByLabelText('Confirm password'), 'secret124');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByLabelText('Confirm password')).toHaveAccessibleDescription('Passwords do not match');
  });

  it('lets the user check what they typed in the password field', async () => {
    const { user } = renderPage();
    const password = screen.getByLabelText('Password');

    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getAllByRole('button', { name: 'Show password' })[0]);
    expect(password).toHaveAttribute('type', 'text');
  });

  it('creates the account and sends the user to sign in', async () => {
    let payload: unknown;
    server.use(
      http.post('*/auth/register', async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ id: 'user_1', username: 'jane.perera' }, { status: 201 });
      }),
    );
    const { user } = renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Your account is ready');
    expect(payload).toEqual({
      fullName: 'Jane Perera',
      businessName: 'Perera Traders',
      username: 'jane.perera',
      email: 'jane@perera.lk',
      password: 'secret123',
    });
  });

  it('shows the API error on the field it belongs to', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json(
          {
            title: 'Email already registered',
            status: 409,
            errors: { email: ['An account with this email already exists. Sign in instead.'] },
          },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderPage();

    await fillForm(user, { email: 'taken@perera.lk' });
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText(/already exists/)).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('sends users who are already signed in to the app', async () => {
    renderWithProviders(<SignupPage />, {
      route: '/signup',
      path: '/signup',
      routes: { '/': <h1>Dashboard</h1> },
    });

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });
});
