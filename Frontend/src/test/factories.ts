import type { AuthUser } from '@/features/auth/types';
import type { Unit } from '@/features/units/types';

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

/** Part of the seeded unit list (GET /units), for pages with a unit select. */
export const UNITS: Unit[] = [
  { id: '1', unitCode: 'PCS', unitName: 'Piece' },
  { id: '2', unitCode: 'KG', unitName: 'Kilogram' },
  { id: '4', unitCode: 'L', unitName: 'Litre' },
  { id: '7', unitCode: 'BOX', unitName: 'Box' },
];
