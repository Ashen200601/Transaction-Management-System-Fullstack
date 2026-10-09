import { z } from 'zod';

import { toMinorUnits } from '@/lib/money';

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

/** Product form: raw input strings in, an API payload with minor-unit prices out. */
export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a product name').max(120, 'Keep the name under 120 characters'),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,32}$/, 'Use 3–32 letters, numbers or dashes'),
  price: z
    .string()
    .trim()
    .regex(MONEY_PATTERN, 'Enter a price like 12.50')
    .transform((value) => toMinorUnits(value)),
  cost: z
    .string()
    .trim()
    .refine((value) => value === '' || MONEY_PATTERN.test(value), 'Enter a cost like 8.00, or leave it empty')
    .transform((value) => (value === '' ? null : toMinorUnits(value))),
  reorderLevel: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Enter a whole number, 0 or more')
    .transform(Number),
  active: z.boolean(),
});

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;
