import { Badge, type BadgeTone } from '@/components/ui/badge';

import { getConfidenceLevel, type ConfidenceLevel } from '../confidence';

const LEVELS: Record<ConfidenceLevel, { label: string; tone: BadgeTone }> = {
  high: { label: 'High confidence', tone: 'success' },
  medium: { label: 'Check this', tone: 'warning' },
  low: { label: 'Low confidence', tone: 'danger' },
};

/** How sure the OCR engine was about a field, so the reviewer knows where to look. */
export function ConfidenceBadge({ confidence }: { confidence: number | null | undefined }) {
  const level = LEVELS[getConfidenceLevel(confidence)];
  return (
    <Badge tone={level.tone} title={confidence == null ? 'Not detected' : `${Math.round(confidence * 100)}% sure`}>
      {level.label}
    </Badge>
  );
}
