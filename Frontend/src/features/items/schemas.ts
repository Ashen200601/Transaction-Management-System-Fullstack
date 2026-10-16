import { z } from 'zod';

/** "12.5" → 1250. Done on the digits, so no floating-point rounding creeps in. */
function toMinorUnits(price: string) {
  const [whole, fraction = ''] = price.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/**
 * Item form: raw input in, the POST /items payload out. Mirrors the backend's CreateItemRequest;
 * keep the two in step.
 */
export const itemFormSchema = z.object({
  itemName: z.string().trim().min(1, 'Enter the item name').max(120, 'Keep the item name under 120 characters'),
  itemCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9._-]{1,30}$/, 'Use 1–30 letters, numbers, dots, dashes or underscores'),
  description: z
    .string()
    .trim()
    .max(500, 'Keep the description under 500 characters')
    .transform((value) => value || null),
  price: z
    .string()
    .trim()
    .min(1, 'Enter the price')
    .regex(/^\d{1,9}(\.\d{1,2})?$/, 'Enter a price like 12.50')
    .transform(toMinorUnits),
  /** A unit's id, from GET /units. */
  unitId: z.string().min(1, 'Choose a unit'),
});

export type ItemFormInput = z.input<typeof itemFormSchema>;
export type ItemFormValues = z.output<typeof itemFormSchema>;

/** An optional price box: empty means "no limit"; anything else must look like 12.50. */
const optionalPrice = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{1,9}(\.\d{1,2})?$/.test(value), 'Enter a price like 12.50')
  .transform((value) => (value === '' ? undefined : toMinorUnits(value)));

/**
 * Item search filters: raw input in, the GET /items query out. Empty filters are dropped from the
 * URL, so an empty form lists every item. Mirrors the backend's ItemSearchRequest.
 */
export const itemSearchSchema = z
  .object({
    itemCode: z.string().trim().toUpperCase().max(30, 'Keep the item code under 30 characters'),
    itemName: z.string().trim().max(120, 'Keep the item name under 120 characters'),
    /** A unit's id; '' means any unit. */
    unitId: z.string(),
    minPrice: optionalPrice,
    maxPrice: optionalPrice,
  })
  .refine(
    ({ minPrice, maxPrice }) => minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { path: ['maxPrice'], message: 'Make this at least the lowest price' },
  );

export type ItemSearchInput = z.input<typeof itemSearchSchema>;
export type ItemSearchValues = z.output<typeof itemSearchSchema>;
