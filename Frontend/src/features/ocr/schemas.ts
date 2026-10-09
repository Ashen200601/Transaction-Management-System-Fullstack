import { z } from 'zod';

import { isValidIsoDate } from '@/lib/dates';

/** A receipt after a person has checked the OCR output. Amounts are minor units. */
export const reviewedDocumentSchema = z
  .object({
    vendorName: z.string().trim().min(1, 'Enter the supplier name').max(200),
    documentDate: z.string().refine(isValidIsoDate, 'Enter a valid date'),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code, e.g. USD'),
    lines: z
      .array(
        z.object({
          description: z.string().trim().min(1, 'Describe the item'),
          quantity: z.number({ error: 'Enter a quantity' }).positive('Quantity must be more than 0'),
          unitPrice: z.number({ error: 'Enter a price' }).int().nonnegative('Price cannot be negative'),
        }),
      )
      .min(1, 'Add at least one line'),
    subtotal: z.number({ error: 'Enter the subtotal' }).int().nonnegative(),
    tax: z.number({ error: 'Enter the tax' }).int().nonnegative(),
    total: z.number({ error: 'Enter the total' }).int().nonnegative(),
  })
  .superRefine((document, ctx) => {
    const linesTotal = document.lines.reduce((sum, line) => sum + Math.round(line.quantity * line.unitPrice), 0);
    if (document.lines.length > 0 && linesTotal !== document.subtotal) {
      ctx.addIssue({ code: 'custom', path: ['subtotal'], message: "The lines don't add up to the subtotal" });
    }
    if (document.subtotal + document.tax !== document.total) {
      ctx.addIssue({ code: 'custom', path: ['total'], message: 'Total should equal subtotal plus tax' });
    }
  });

export type ReviewedDocument = z.output<typeof reviewedDocumentSchema>;
