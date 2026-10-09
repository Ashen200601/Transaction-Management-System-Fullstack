import type { AuthUser } from '@/features/auth/types';
import type { Customer } from '@/features/customers/types';
import type { Product } from '@/features/products/types';
import type { Business } from '@/features/tenancy/types';
import type { Transaction, TransactionLine } from '@/features/transactions/types';
import type { Paginated } from '@/lib/api/types';

// Test data builders. Each returns a complete, valid object and takes
// overrides for the fields a test cares about. Money is in integer minor
// units (cents).

let sequence = 0;

function next() {
  sequence += 1;
  return sequence;
}

const pad = (value: number, length = 4) => String(value).padStart(length, '0');

export function buildUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user_0001',
    name: 'Test Cashier',
    email: 'cashier@example.com',
    ...overrides,
  };
}

export function buildBusiness(overrides: Partial<Business> = {}): Business {
  return {
    id: `biz_${pad(next())}`,
    name: 'Finovex Demo Store',
    currency: 'USD',
    role: 'owner',
    ...overrides,
  };
}

export function buildCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: `cus_${pad(next())}`,
    name: 'Jane Customer',
    email: 'jane@example.com',
    phone: '+1 555 0100',
    createdAt: '2026-03-01T09:00:00.000Z',
    ...overrides,
  };
}

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: `prod_${pad(next())}`,
    name: 'Espresso Beans 1kg',
    sku: 'ESP-1KG',
    price: 2500,
    cost: 1400,
    reorderLevel: 5,
    active: true,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
    ...overrides,
  };
}

export function buildTransactionLine(overrides: Partial<TransactionLine> = {}): TransactionLine {
  const quantity = overrides.quantity ?? 1;
  const unitPrice = overrides.unitPrice ?? 1000;
  const discount = overrides.discount ?? 0;
  return {
    id: `line_${pad(next())}`,
    productId: 'prod_0001',
    productName: 'Espresso Beans 1kg',
    quantity,
    unitPrice,
    discount,
    lineTotal: quantity * unitPrice - discount,
    ...overrides,
  };
}

export function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const seq = next();
  const lines = overrides.lines ?? [buildTransactionLine({ quantity: 2, unitPrice: 1250 })];
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discount = lines.reduce((sum, line) => sum + line.discount, 0);
  return {
    id: `txn_${pad(seq)}`,
    reference: `TXN-${pad(seq, 6)}`,
    type: 'sale',
    status: 'completed',
    paymentMethod: 'cash',
    customerId: null,
    customerName: null,
    originalTransactionId: null,
    currency: 'USD',
    lines,
    subtotal,
    discount,
    tax: 0,
    total: subtotal - discount,
    note: null,
    createdAt: '2026-03-05T10:00:00.000Z',
    createdBy: { id: 'user_0001', name: 'Test Cashier' },
    voidedAt: null,
    voidReason: null,
    ...overrides,
  };
}

export function buildPage<T>(
  items: T[],
  meta: Partial<Omit<Paginated<T>, 'items'>> = {},
): Paginated<T> {
  const page = meta.page ?? 1;
  const pageSize = meta.pageSize ?? 20;
  const totalItems = meta.totalItems ?? items.length;
  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: meta.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}
