import type { Customer } from '@/features/customers/types';
import type { Integration } from '@/features/integrations/types';
import type { DocumentExtraction, OcrDocument } from '@/features/ocr/types';
import type { Product } from '@/features/products/types';
import type { Business } from '@/features/tenancy/types';
import { calculateTransactionTotals } from '@/features/transactions/totals';
import type { PaymentMethod, Transaction, TransactionLine } from '@/features/transactions/types';

// In-memory sample data for the mock API. Seeded, so every reload shows the
// same businesses, products and history (timestamps follow today's date).

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

type Random = ReturnType<typeof createRandom>;
const pick = <T>(random: Random, items: readonly T[]) => items[Math.floor(random() * items.length)];
const between = (random: Random, min: number, max: number) => min + Math.floor(random() * (max - min + 1));

let idCounter = 0;
export const nextId = (prefix: string) => `${prefix}_${String(++idCounter).padStart(4, '0')}`;

export const DEMO_USER = { id: 'user_demo', name: 'Demo Owner' };

export interface StockLevel {
  onHand: number;
  updatedAt: string;
}

export interface BusinessStore {
  business: Business;
  products: Product[];
  stock: Map<string, StockLevel>;
  customers: Customer[];
  /** Newest first. */
  transactions: Transaction[];
  documents: OcrDocument[];
  integrations: Integration[];
  /** Idempotency-Key → the transaction it created. */
  idempotency: Map<string, Transaction>;
  nextReference: number;
}

type ProductSeed = Pick<Product, 'name' | 'sku' | 'price' | 'cost' | 'reorderLevel'> & { active?: boolean };

const CATALOGS: Record<string, ProductSeed[]> = {
  biz_harbor: [
    { name: 'Espresso Beans 1kg', sku: 'ESP-1KG', price: 2500, cost: 1400, reorderLevel: 5 },
    { name: 'House Blend 500g', sku: 'HSE-500', price: 1450, cost: 780, reorderLevel: 8 },
    { name: 'Decaf Beans 500g', sku: 'DCF-500', price: 1550, cost: 860, reorderLevel: 4 },
    { name: 'Oat Milk 1L', sku: 'OAT-1L', price: 450, cost: 210, reorderLevel: 12 },
    { name: 'Cold Brew Bottle', sku: 'CLD-330', price: 525, cost: 190, reorderLevel: 10 },
    { name: 'Chai Concentrate 1L', sku: 'CHA-1L', price: 1200, cost: 560, reorderLevel: 4 },
    { name: 'Butter Croissant', sku: 'CRO-01', price: 375, cost: 120, reorderLevel: 15 },
    { name: 'Blueberry Muffin', sku: 'MUF-BLU', price: 350, cost: 110, reorderLevel: 12 },
    { name: 'Banana Bread Slice', sku: 'BAN-SLC', price: 395, cost: 130, reorderLevel: 10 },
    { name: 'Ceramic Mug', sku: 'MUG-CER', price: 1800, cost: 650, reorderLevel: 3 },
    { name: 'Reusable Cup 12oz', sku: 'CUP-12', price: 1500, cost: 520, reorderLevel: 5 },
    { name: 'Pour-over Filters (100)', sku: 'FLT-100', price: 799, cost: 300, reorderLevel: 6 },
    { name: 'Gift Card $25', sku: 'GIFT-25', price: 2500, cost: null, reorderLevel: 0 },
    { name: 'Pumpkin Spice Syrup', sku: 'SYR-PMK', price: 900, cost: 400, reorderLevel: 0, active: false },
  ],
  biz_hillside: [
    { name: 'Sourdough Loaf', sku: 'SRD-LOAF', price: 850, cost: 280, reorderLevel: 10 },
    { name: 'Rye Loaf', sku: 'RYE-LOAF', price: 750, cost: 250, reorderLevel: 6 },
    { name: 'Baguette', sku: 'BAG-01', price: 400, cost: 120, reorderLevel: 12 },
    { name: 'Cinnamon Roll', sku: 'CIN-ROLL', price: 425, cost: 140, reorderLevel: 12 },
    { name: 'Almond Croissant', sku: 'ALM-CRO', price: 450, cost: 160, reorderLevel: 10 },
    { name: 'Chocolate Cake Slice', sku: 'CAK-CHO', price: 550, cost: 190, reorderLevel: 8 },
    { name: 'Cheesecake Slice', sku: 'CAK-CHS', price: 600, cost: 210, reorderLevel: 8 },
    { name: 'Bagels (6 pack)', sku: 'BGL-6', price: 900, cost: 300, reorderLevel: 6 },
    { name: 'Granola 500g', sku: 'GRN-500', price: 1100, cost: 480, reorderLevel: 5 },
    { name: 'Strawberry Jam', sku: 'JAM-STR', price: 650, cost: 260, reorderLevel: 5 },
  ],
};

const FIRST_NAMES = ['Ava', 'Kenji', 'Priya', 'Mateo', 'Amara', 'Liam', 'Sofia', 'Nimal', 'Chloe', 'Omar', 'Hana', 'Diego', 'Zara', 'Ethan', 'Leila', 'Tariq', 'Mei', 'Noah', 'Ines', 'Kofi'];
const LAST_NAMES = ['Perera', 'Tanaka', 'Shah', 'Garcia', 'Okafor', 'Murphy', 'Rossi', 'Silva', 'Martin', 'Haddad', 'Kim', 'Lopez', 'Ahmed', 'Brown', 'Nasser'];

const PAYMENT_WEIGHTS: PaymentMethod[] = ['card', 'card', 'card', 'cash', 'cash', 'mobile_wallet', 'bank_transfer'];

function seedProducts(businessId: string): Product[] {
  const created = new Date(Date.now() - 60 * DAY).toISOString();
  return CATALOGS[businessId].map((seed) => ({
    id: nextId('prod'),
    name: seed.name,
    sku: seed.sku,
    price: seed.price,
    cost: seed.cost,
    reorderLevel: seed.reorderLevel,
    active: seed.active ?? true,
    createdAt: created,
    updatedAt: created,
  }));
}

function seedCustomers(random: Random, count: number): Customer[] {
  const customers: Customer[] = [];
  const used = new Set<string>();
  while (customers.length < count) {
    const name = `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`;
    if (used.has(name)) continue;
    used.add(name);
    const handle = name.toLowerCase().replace(' ', '.');
    customers.push({
      id: nextId('cus'),
      name,
      email: random() < 0.85 ? `${handle}@example.com` : null,
      phone: random() < 0.7 ? `+1 555 01${String(between(random, 0, 99)).padStart(2, '0')}` : null,
      createdAt: new Date(Date.now() - between(random, 5, 300) * DAY).toISOString(),
    });
  }
  return customers.sort((a, b) => a.name.localeCompare(b.name));
}

/** Timestamps: a handful earlier today, then 3–6 a day for the previous 13 days. Newest first. */
function seedTimestamps(random: Random) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sinceMidnight = Date.now() - startOfToday.getTime();
  const dates: Date[] = [];
  for (let k = 0; k < 6; k += 1) {
    dates.push(new Date(Date.now() - (k + 0.5) * (sinceMidnight / 7)));
  }
  for (let day = 1; day <= 13; day += 1) {
    for (let j = between(random, 3, 6); j > 0; j -= 1) {
      const date = new Date(startOfToday.getTime() - day * DAY);
      date.setHours(between(random, 8, 18), between(random, 0, 59), between(random, 0, 59));
      dates.push(date);
    }
  }
  return dates.sort((a, b) => b.getTime() - a.getTime());
}

export function buildLines(
  items: Array<{ product: Product; quantity: number; discount?: number }>,
): TransactionLine[] {
  return items.map(({ product, quantity, discount = 0 }) => ({
    id: nextId('line'),
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    discount,
    lineTotal: Math.max(0, quantity * product.price - discount),
  }));
}

export function totalsFor(lines: TransactionLine[], business: Business) {
  return calculateTransactionTotals(lines, { taxRatePercent: business.taxRatePercent ?? 0 });
}

function seedTransactions(random: Random, store: BusinessStore) {
  const sellable = store.products.filter((product) => product.active);
  const timestamps = seedTimestamps(random);
  const transactions: Transaction[] = timestamps.map((date) => {
    const chosen = new Set<Product>();
    for (let n = between(random, 1, 3); n > 0; n -= 1) chosen.add(pick(random, sellable));
    const lines = buildLines(
      [...chosen].map((product) => {
        const quantity = between(random, 1, 3);
        const discount = random() < 0.1 ? Math.round(quantity * product.price * 0.1) : 0;
        return { product, quantity, discount };
      }),
    );
    const customer = random() < 0.35 ? pick(random, store.customers) : null;
    return {
      id: nextId('txn'),
      reference: '',
      type: 'sale',
      status: 'completed',
      paymentMethod: pick(random, PAYMENT_WEIGHTS),
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? null,
      originalTransactionId: null,
      currency: store.business.currency,
      lines,
      ...totalsFor(lines, store.business),
      note: null,
      createdAt: date.toISOString(),
      createdBy: DEMO_USER,
      voidedAt: null,
      voidReason: null,
    };
  });

  // A few voids, a pending card payment and refunds, so every state is on show.
  const voidAt = (index: number, reason: string) => {
    const transaction = transactions[index];
    if (!transaction) return;
    transaction.status = 'voided';
    transaction.voidedAt = new Date(new Date(transaction.createdAt).getTime() + 10 * 60_000).toISOString();
    transaction.voidReason = reason;
  };
  voidAt(3, 'Duplicate sale');
  voidAt(17, 'Customer changed their mind');
  if (transactions[9]) {
    transactions[9].status = 'pending';
    transactions[9].paymentMethod = 'card';
  }
  for (const [refundIndex, saleIndex] of [
    [5, 15],
    [24, 40],
  ]) {
    const refund = transactions[refundIndex];
    const sale = transactions[saleIndex];
    if (!refund || !sale || sale.status !== 'completed') continue;
    const line = sale.lines[0];
    const lines: TransactionLine[] = [{ ...line, id: nextId('line'), quantity: 1, discount: 0, lineTotal: line.unitPrice }];
    Object.assign(refund, {
      type: 'refund',
      status: 'completed',
      originalTransactionId: sale.id,
      customerId: sale.customerId,
      customerName: sale.customerName,
      lines,
      ...totalsFor(lines, store.business),
      note: 'Item returned',
    });
  }

  // References count up from the oldest.
  transactions.forEach((transaction, index) => {
    transaction.reference = `TXN-${String(transactions.length - index).padStart(6, '0')}`;
  });
  store.nextReference = transactions.length + 1;
  store.transactions = transactions;
}

function seedStock(random: Random, store: BusinessStore) {
  store.products.forEach((product, index) => {
    // Make sure a couple of products are low or out, so the dashboard has something to flag.
    const onHand = index === 2 ? 0 : index === 5 ? product.reorderLevel : product.sku.startsWith('GIFT') ? 200 : between(random, product.reorderLevel + 3, 60);
    store.stock.set(product.id, {
      onHand,
      updatedAt: new Date(Date.now() - between(random, 0, 72) * HOUR).toISOString(),
    });
  });
}

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A simple drawing of a receipt, used as the scan image for sample documents. */
export function receiptImage(vendorName: string, rows: Array<[string, string]>, total: string) {
  const vendor = escapeXml(vendorName);
  const lines = rows
    .map(
      ([label, amount], i) =>
        `<text x="24" y="${150 + i * 28}">${escapeXml(label)}</text><text x="296" y="${150 + i * 28}" text-anchor="end">${escapeXml(amount)}</text>`,
    )
    .join('');
  const height = 230 + rows.length * 28;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="${height}" font-family="monospace" font-size="14" fill="#222"><rect width="320" height="${height}" fill="#fdfcf7"/><text x="160" y="48" text-anchor="middle" font-size="18" font-weight="bold">${vendor}</text><text x="160" y="76" text-anchor="middle" fill="#666">TAX INVOICE</text><line x1="24" y1="110" x2="296" y2="110" stroke="#999" stroke-dasharray="4"/>${lines}<line x1="24" y1="${height - 90}" x2="296" y2="${height - 90}" stroke="#999" stroke-dasharray="4"/><text x="24" y="${height - 56}" font-weight="bold">TOTAL</text><text x="296" y="${height - 56}" text-anchor="end" font-weight="bold">${total}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const SUPPLIERS = ['Harbor Wholesale Supplies', 'Greenleaf Dairy Co.', 'Northside Paper Goods', 'Valley Mills Flour'];

/** OCR output for a supplier receipt, with realistic, uneven confidence. */
export function fakeExtraction(random: Random, currency: string): DocumentExtraction {
  const confidence = () => Math.round((0.62 + random() * 0.37) * 100) / 100;
  const items = [
    ['Espresso Beans 1kg', 4, 1400],
    ['Oat Milk 1L (case)', 2, 2520],
    ['Paper Cups 12oz (50)', 3, 640],
    ['Flour 25kg', 1, 3800],
  ] as const;
  const chosen = items.slice(0, between(random, 2, 4));
  const subtotal = chosen.reduce((sum, [, quantity, price]) => sum + quantity * price, 0);
  const tax = Math.round(subtotal * 0.08);
  const date = new Date(Date.now() - between(random, 0, 6) * DAY);
  return {
    vendorName: { value: pick(random, SUPPLIERS), confidence: confidence() },
    documentDate: { value: date.toISOString().slice(0, 10), confidence: confidence() },
    currency: { value: currency, confidence: 0.99 },
    subtotal: { value: subtotal, confidence: confidence() },
    tax: { value: tax, confidence: confidence() },
    total: { value: subtotal + tax, confidence: confidence() },
    lines: chosen.map(([description, quantity, unitPrice]) => ({
      description: { value: description, confidence: confidence() },
      quantity: { value: quantity, confidence: confidence() },
      unitPrice: { value: unitPrice, confidence: confidence() },
    })),
  };
}

const money = (minor: number) => `$${(minor / 100).toFixed(2)}`;

export function extractionImage(extraction: DocumentExtraction) {
  return receiptImage(
    extraction.vendorName.value ?? 'Supplier',
    extraction.lines.map((line) => [
      `${line.quantity.value} x ${line.description.value}`.slice(0, 28),
      money((line.quantity.value ?? 0) * (line.unitPrice.value ?? 0)),
    ]),
    money(extraction.total.value ?? 0),
  );
}

function seedDocuments(random: Random, store: BusinessStore) {
  const { currency } = store.business;
  const reviewing = fakeExtraction(random, currency);
  const confirmedSource = fakeExtraction(random, currency);
  store.documents = [
    {
      id: nextId('doc'),
      fileName: 'receipt-greenleaf.jpg',
      status: 'needs_review',
      uploadedAt: new Date(Date.now() - 2 * HOUR).toISOString(),
      imageUrl: extractionImage(reviewing),
      extraction: reviewing,
      reviewed: null,
      failureReason: null,
    },
    {
      id: nextId('doc'),
      fileName: 'invoice-harbor-wholesale.pdf',
      status: 'confirmed',
      uploadedAt: new Date(Date.now() - 3 * DAY).toISOString(),
      imageUrl: extractionImage(confirmedSource),
      extraction: confirmedSource,
      reviewed: {
        vendorName: confirmedSource.vendorName.value ?? 'Supplier',
        documentDate: confirmedSource.documentDate.value ?? '2026-01-01',
        currency,
        lines: confirmedSource.lines.map((line) => ({
          description: line.description.value ?? '',
          quantity: line.quantity.value ?? 1,
          unitPrice: line.unitPrice.value ?? 0,
        })),
        subtotal: confirmedSource.subtotal.value ?? 0,
        tax: confirmedSource.tax.value ?? 0,
        total: confirmedSource.total.value ?? 0,
      },
      failureReason: null,
    },
    {
      id: nextId('doc'),
      fileName: 'blurry-photo.jpg',
      status: 'failed',
      uploadedAt: new Date(Date.now() - 5 * DAY).toISOString(),
      imageUrl: null,
      extraction: null,
      reviewed: null,
      failureReason: 'The photo is too blurry to read. Retake it in good light, holding the camera steady.',
    },
  ];
}

function seedIntegrations(): Integration[] {
  return [
    {
      id: 'int_quickbooks',
      name: 'QuickBooks Online',
      category: 'accounting',
      description: 'Send daily sales summaries and refunds to your accounting ledger.',
      status: 'connected',
      lastSyncedAt: new Date(Date.now() - 3 * HOUR).toISOString(),
      error: null,
    },
    {
      id: 'int_xero',
      name: 'Xero',
      category: 'accounting',
      description: 'Post sales, refunds and supplier bills to Xero.',
      status: 'disconnected',
      lastSyncedAt: null,
      error: null,
    },
    {
      id: 'int_shopify',
      name: 'Shopify',
      category: 'ecommerce',
      description: 'Import online orders and keep stock levels in sync.',
      status: 'error',
      lastSyncedAt: new Date(Date.now() - 2 * DAY).toISOString(),
      error: 'The connection expired. Reconnect to resume syncing.',
    },
    {
      id: 'int_stripe',
      name: 'Stripe',
      category: 'payments',
      description: 'Match card payouts to the sales they came from.',
      status: 'disconnected',
      lastSyncedAt: null,
      error: null,
    },
  ];
}

export const BUSINESSES: Business[] = [
  { id: 'biz_harbor', name: 'Harbor Street Coffee', currency: 'USD', role: 'owner', taxRatePercent: 8 },
  { id: 'biz_hillside', name: 'Hillside Bakery', currency: 'USD', role: 'cashier', taxRatePercent: 8 },
];

function createStore(business: Business, seed: number): BusinessStore {
  const random = createRandom(seed);
  const store: BusinessStore = {
    business,
    products: seedProducts(business.id),
    stock: new Map(),
    customers: seedCustomers(random, 24),
    transactions: [],
    documents: [],
    integrations: seedIntegrations(),
    idempotency: new Map(),
    nextReference: 1,
  };
  seedTransactions(random, store);
  seedStock(random, store);
  seedDocuments(random, store);
  return store;
}

const stores = new Map(BUSINESSES.map((business, index) => [business.id, createStore(business, 20260 + index)]));

export const getStore = (businessId: string) => stores.get(businessId);

/** Shared randomness for runtime mocks (uploads etc.). */
export const runtimeRandom = createRandom(Date.now() % 100_000);
