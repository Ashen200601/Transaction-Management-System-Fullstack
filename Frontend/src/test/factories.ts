import type { AuthUser } from '@/features/auth/types';

// Test data builders. Each returns a complete, valid object and takes
// overrides for the fields a test cares about.

export function buildUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user_0001',
    username: 'test.cashier',
    name: 'Test Cashier',
    email: 'cashier@example.com',
    ...overrides,
  };
}
