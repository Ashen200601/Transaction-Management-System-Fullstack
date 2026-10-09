import { Badge } from '@/components/ui/badge';

import { STATUS_TONES, transactionStatusLabel } from '../labels';
import type { TransactionStatus } from '../types';

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{transactionStatusLabel(status)}</Badge>;
}
