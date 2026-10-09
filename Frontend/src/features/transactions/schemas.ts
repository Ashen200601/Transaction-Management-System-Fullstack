import { z } from 'zod';

export const TRANSACTION_TYPES = ['sale', 'refund'] as const;
export const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'mobile_wallet'] as const;

const lineSchema = z
  .object({
    productId: z.string().min(1, 'Choose a product'),
    quantity: z
      .number({ error: 'Enter a whole number' })
      .int('Quantity must be a whole number')
      .positive('Quantity must be at least 1'),
    unitPrice: z.number().int().nonnegative('Price cannot be negative'),
    discount: z
      .number({ error: 'Enter an amount like 1.50' })
      .int()
      .nonnegative('Discount cannot be negative')
      .default(0),
  })
  .superRefine((line, ctx) => {
    if (line.discount > line.quantity * line.unitPrice) {
      ctx.addIssue({ code: 'custom', path: ['discount'], message: 'Discount cannot be more than the line amount' });
    }
  });

export const newTransactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES),
    paymentMethod: z.enum(PAYMENT_METHODS, { error: 'Choose a payment method' }),
    customerId: z.string().min(1).nullable().default(null),
    originalTransactionId: z.string().min(1).nullable().default(null),
    note: z.string().trim().max(500, 'Keep the note under 500 characters').default(''),
    lines: z.array(lineSchema).min(1, 'Add at least one item'),
  })
  .superRefine((transaction, ctx) => {
    if (transaction.type === 'refund' && !transaction.originalTransactionId) {
      ctx.addIssue({
        code: 'custom',
        path: ['originalTransactionId'],
        message: 'Enter the sale being refunded',
      });
    }
  });

export type NewTransactionInput = z.input<typeof newTransactionSchema>;
export type NewTransactionValues = z.output<typeof newTransactionSchema>;

export const voidTransactionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Enter a reason for voiding this transaction.')
    .max(250, 'Keep the reason under 250 characters.'),
});

export type VoidTransactionValues = z.output<typeof voidTransactionSchema>;
