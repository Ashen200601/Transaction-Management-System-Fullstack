import { Badge, type BadgeTone } from '@/components/ui/badge';

import type { DocumentStatus } from '../types';

const STATUS: Record<DocumentStatus, { label: string; tone: BadgeTone }> = {
  processing: { label: 'Reading…', tone: 'info' },
  needs_review: { label: 'Needs review', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>;
}
