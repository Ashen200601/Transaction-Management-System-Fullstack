import type { BadgeTone } from '@/components/ui/badge';

import type { PaymentMethod, TransactionStatus, TransactionType } from './types';

const STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  voided: 'Voided',
};

export const STATUS_TONES: Record<TransactionStatus, BadgeTone> = {
  pending: 'warning',
  completed: 'success',
  voided: 'danger',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  mobile_wallet: 'Mobile wallet',
};

const TYPE_LABELS: Record<TransactionType, string> = {
  sale: 'Sale',
  refund: 'Refund',
};

export const transactionStatusLabel = (status: TransactionStatus) => STATUS_LABELS[status];
export const paymentMethodLabel = (method: PaymentMethod) => PAYMENT_METHOD_LABELS[method];
export const transactionTypeLabel = (type: TransactionType) => TYPE_LABELS[type];
